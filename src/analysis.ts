// Copyright 2019 Diffblue Limited. All Rights Reserved.

//  tslint:disable:no-non-null-assertion

import {
  cancelAnalysis,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  getDefaultSettings,
  startAnalysis,
} from './bindings';
import { getFileNameForResult, groupResults } from './combiner';
import { AnalysisError, AnalysisErrorCode } from './errors';
import {
  AnalysisCancelApiResponse,
  AnalysisFiles,
  AnalysisResult,
  AnalysisResultsApiResponse,
  AnalysisSettings,
  AnalysisStartApiResponse,
  AnalysisStatus,
  AnalysisStatusApiResponse,
  ApiErrorResponse,
  ApiVersionApiResponse,
  BindingsOptions,
  ComputedAnalysisSettings,
  endedStatuses,
  inProgressStatuses,
  RunAnalysisOptions,
  WriteTestsOptions,
} from './types/types';
import CancellableDelay from './utils/CancellableDelay';
import writeTests from './writeTests';

export const components = {
  writeTests: writeTests,
  cancelAnalysis: cancelAnalysis,
  getAnalysisResults: getAnalysisResults,
  getAnalysisStatus: getAnalysisStatus,
  getApiVersion: getApiVersion,
  getDefaultSettings: getDefaultSettings,
  startAnalysis: startAnalysis,
};

/** Class to run an analysis and keep track of its state */
export default class Analysis {

  public apiUrl: string;
  public bindingsOptions: BindingsOptions;
  public analysisId?: string;
  public settings?: AnalysisSettings;
  public computedSettings?: ComputedAnalysisSettings;
  public defaultSettings?: ComputedAnalysisSettings;
  public status?: AnalysisStatus;
  public error?: ApiErrorResponse;
  public results: AnalysisResult[] = [];
  public cursor?: number;
  public apiVersion?: string;
  public pollDelay?: CancellableDelay<void>;
  public pollingStopped?: boolean;

  public constructor(apiUrl: string, bindingsOptions: BindingsOptions = {}) {
    this.apiUrl = apiUrl;
    this.bindingsOptions = bindingsOptions;
  }

  /** Check if analysis is running */
  private checkStarted(): void {
    if (this.isNotStarted()) {
      throw new AnalysisError(
        'Analysis has not been started.',
        AnalysisErrorCode.NOT_STARTED,
      );
    }
    if (!this.analysisId) {
      throw new AnalysisError('Analysis is in progress but the analysis id is not set.', AnalysisErrorCode.NO_ID);
    }
  }

  /** Check if analysis has started */
  private checkNotStarted(): void {
    if (this.isStarted()) {
      throw new AnalysisError(
        `Analysis has already started (status: ${this.status}).`,
        AnalysisErrorCode.ALREADY_STARTED,
      );
    }
  }

  /** Update status related properties */
  private updateStatus(status: AnalysisStatusApiResponse): void {
    this.status = AnalysisStatus[status.status];
    this.error = status.message;
  }

  /**
   * Run the analysis.
   *
   * Starts the analysis and waits until it is complete before resolving.
   *
   * If settings are omitted, the analysis will be started with default settings.
   * Default settings will be fetched from the server if not already set on the object.
   *
   * Will poll for latest results and analysis status every 60 seconds,
   * configurable via the `pollingInterval` option.
   *
   * If a directory is specified in the `outputTests` option,
   * tests will be written to that directory when the analysis completes.
   * The `writingConcurrency` option can be used in conjunction to specify
   * the concurrency when writing tests.
   *
   * If an `onResults` callback option is provided, this will be called
   * once for each group of results returned by each polling attempt.
   *
   * If an `onError` callback option is provided, this will be called
   * with any error thrown, and this method will resolve rather than reject.
   */
  public async run(
    files: AnalysisFiles,
    settings?: AnalysisSettings,
    options: RunAnalysisOptions = {},
  ): Promise<AnalysisResult[]> {
    try {
      this.checkNotStarted();
      this.pollingStopped = false;
      const defaultPollingInterval = 60;  // seconds
      const pollingIntervalMilliseconds = (options.pollingInterval || defaultPollingInterval) * 1000;
      await this.start(files, settings);
      while (this.isInProgress()) {
        this.pollDelay = new CancellableDelay(pollingIntervalMilliseconds, undefined);
        await this.pollDelay.promise;
        this.pollDelay = undefined;
        if (this.pollingStopped) {
          // May have been changed by force stop
          break;
        }
        const { results } = await this.getResults();
        if (results.length && options.onResults) {
          const groups = groupResults(results);
          for (const resultGroup of Object.values(groups)) {
            const fileName = getFileNameForResult(resultGroup[0]);
            options.onResults(resultGroup, fileName);
          }
        }
        if (this.isErrored()) {
          throw new AnalysisError(
            'Analysis ended with ERRORED status.',
            AnalysisErrorCode.RUN_ERRORED,
          );
        }
      }
      if (options.outputTests) {
        const writeOptions = options.writingConcurrency ? { concurrency: options.writingConcurrency } : undefined;
        await this.writeTests(options.outputTests, writeOptions);
      }
    } catch (error) {
      this.stopPolling();
      if (options.onError) {
        options.onError(error);
      } else {
        throw error;
      }
    }
    return this.results;
  }

  /** If an analysis is being run, stop polling for results */
  public stopPolling(): void {
    if (this.pollDelay) {
      this.pollDelay.cancel();
    }
    this.pollingStopped = true;
  }

  /** Write test files to the specified directory using the current results */
  public async writeTests(directoryPath: string, options?: WriteTestsOptions): Promise<string[]> {
    return components.writeTests(directoryPath, this.results, options);
  }

  /**
   * Start the analysis
   *
   * If settings are omitted, the analysis will be started with default settings.
   * Default settings will be fetched from the server if not already set on the object.
   */
  public async start(
    files: AnalysisFiles,
    settings?: AnalysisSettings,
  ): Promise<AnalysisStartApiResponse> {
    if (!settings && !this.defaultSettings) {
      try {
        await this.getDefaultSettings();
      } catch (error) {
        throw new AnalysisError(
          `Could not fetch default settings when starting analysis:\n${error}`,
          AnalysisErrorCode.START_DEFAULTS_FAILED,
        );
      }
    }
    this.checkNotStarted();
    const response = await components.startAnalysis(
      this.apiUrl,
      files,
      settings || this.defaultSettings!,
      this.bindingsOptions,
    );
    this.settings = settings;
    this.analysisId = response.id;
    this.computedSettings = response.settings;
    this.status = AnalysisStatus.QUEUED;
    return response;
  }

  /** Cancel the analysis */
  public async cancel(): Promise<AnalysisCancelApiResponse> {
    this.checkStarted();
    const response = await components.cancelAnalysis(this.apiUrl, this.analysisId!, this.bindingsOptions);
    this.updateStatus(response.status);
    return response;
  }

  /** Get the analysis's status */
  public async getStatus(): Promise<AnalysisStatusApiResponse> {
    this.checkStarted();
    const response = await components.getAnalysisStatus(this.apiUrl, this.analysisId!, this.bindingsOptions);
    this.updateStatus(response);
    return response;
  }

  /** Get the analysis's results */
  public async getResults(useCursor: boolean = true): Promise<AnalysisResultsApiResponse> {
    this.checkStarted();
    const response = await components.getAnalysisResults(
      this.apiUrl,
      this.analysisId!,
      useCursor ? this.cursor : undefined,
      this.bindingsOptions,
    );
    this.cursor = response.cursor;
    this.results = useCursor ? [...this.results, ...response.results] : response.results;
    this.updateStatus(response.status);
    return response;
  }

  /** Get default analysis settings */
  public async getDefaultSettings(): Promise<ComputedAnalysisSettings> {
    const response = await components.getDefaultSettings(this.apiUrl, this.bindingsOptions);
    this.defaultSettings = response;
    return response;
  }

  /** Get api version */
  public async getApiVersion(): Promise<ApiVersionApiResponse> {
    const response = await components.getApiVersion(this.apiUrl, this.bindingsOptions);
    this.apiVersion = response.version;
    return response;
  }

  /** Check if status is not started */
  public isNotStarted(): boolean {
    return !this.status;
  }

  /** Check if status is queued */
  public isQueued(): boolean {
    return this.status === AnalysisStatus.QUEUED;
  }

  /** Check if status is running */
  public isRunning(): boolean {
    return this.status === AnalysisStatus.RUNNING;
  }

  /** Check if status is stopping */
  public isStopping(): boolean {
    return this.status === AnalysisStatus.STOPPING;
  }

  /** Check if status is completed */
  public isCompleted(): boolean {
    return this.status === AnalysisStatus.COMPLETED;
  }

  /** Check if status is errored */
  public isErrored(): boolean {
    return this.status === AnalysisStatus.ERRORED;
  }

  /** Check if status is canceled */
  public isCanceled(): boolean {
    return this.status === AnalysisStatus.CANCELED;
  }

  /** Check if status indicates that the analysis has started */
  public isStarted(): boolean {
    return Boolean(this.status);
  }

  /** Check if status indicates that the analysis has ended */
  public isEnded(): boolean {
    if (!this.status) {
      return false;
    }
    return endedStatuses.has(this.status);
  }

  /** Check if status indicates that the analysis is in progress (started but not finished) */
  public isInProgress(): boolean {
    if (!this.status) {
      return false;
    }
    return inProgressStatuses.has(this.status);
  }
}
