// Copyright 2019 Diffblue Limited. All Rights Reserved.

//  tslint:disable:no-non-null-assertion

import {
  cancelAnalysis,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  startAnalysis,
} from './bindings';
import { getFileNameForResult, groupResults } from './combiner';
import { AnalysisError, AnalysisErrorCodes } from './errors';
import {
  AnalysisCancelApiResponse,
  AnalysisFiles,
  AnalysisPhases,
  AnalysisProgress,
  AnalysisResult,
  AnalysisResultsApiResponse,
  AnalysisSettings,
  AnalysisStartApiResponse,
  AnalysisStatusApiResponse,
  AnalysisStatuses,
  ApiErrorResponse,
  ApiVersionApiResponse,
  BindingsOptions,
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
  startAnalysis: startAnalysis,
};

/** Class to run an analysis and keep track of its state */
export default class Analysis {

  public apiUrl: string;
  public bindingsOptions: BindingsOptions;
  public analysisId?: string;
  public settings?: AnalysisSettings;
  public status?: AnalysisStatuses;
  public progress?: AnalysisProgress;
  public error?: ApiErrorResponse;
  public phases?: AnalysisPhases;
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
  private checkInProgress(): void {
    if (!this.isInProgress()) {
      throw new AnalysisError(
        `Analysis is not in progress (status: ${this.status}).`,
        AnalysisErrorCodes.NOT_IN_PROGRESS,
      );
    }
    if (!this.analysisId) {
      throw new AnalysisError('Analysis is in progress but the analysis id is not set.', AnalysisErrorCodes.NO_ID);
    }
  }

  /** Check if analysis has started */
  private checkNotStarted(): void {
    if (this.isStarted()) {
      throw new AnalysisError(
        `Analysis has already started (status: ${this.status}).`,
        AnalysisErrorCodes.ALREADY_STARTED,
      );
    }
  }

  /** Update status related properties */
  private updateStatus(status: AnalysisStatusApiResponse): void {
    this.status = AnalysisStatuses[status.status];
    this.progress = status.progress;
    this.error = status.message;
  }

  /**
   * Run the analysis.
   *
   * Starts the analysis and waits until it is complete before resolving.
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
    settings: AnalysisSettings = {},
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
            AnalysisErrorCodes.RUN_ERRORED,
          );
        }
      }
      if (options.outputTests) {
        const writeOptions = options.writingConcurrency ? { concurrency: options.writingConcurrency } : undefined;
        await this.writeTests(options.outputTests, writeOptions);
      }
    } catch (error) {
      this.forceStop();
      if (options.onError) {
        options.onError(error);
      } else {
        throw error;
      }
    }
    return this.results;
  }

  /** If an analysis is being run, stop polling for results */
  public forceStop(): void {
    if (this.pollDelay) {
      this.pollDelay.cancel();
    }
    this.pollingStopped = true;
  }

  /** Write test files to the specified directory using the current results */
  public async writeTests(directoryPath: string, options?: WriteTestsOptions): Promise<string[]> {
    return components.writeTests(directoryPath, this.results, options);
  }

  /** Start the analysis */
  public async start(
    files: AnalysisFiles,
    settings: AnalysisSettings = {},
  ): Promise<AnalysisStartApiResponse> {
    this.checkNotStarted();
    const response = await components.startAnalysis(this.apiUrl, files, settings, this.bindingsOptions);
    this.settings = settings;
    this.analysisId = response.id;
    this.phases = response.phases;
    this.status = AnalysisStatuses.QUEUED;
    return response;
  }

  /** Cancel the analysis */
  public async cancel(): Promise<AnalysisCancelApiResponse> {
    this.checkInProgress();
    const response = await components.cancelAnalysis(this.apiUrl, this.analysisId!, this.bindingsOptions);
    this.updateStatus(response.status);
    return response;
  }

  /** Get the analysis's status */
  public async getStatus(): Promise<AnalysisStatusApiResponse> {
    this.checkInProgress();
    const response = await components.getAnalysisStatus(this.apiUrl, this.analysisId!, this.bindingsOptions);
    this.updateStatus(response);
    return response;
  }

  /** Get the analysis's results */
  public async getResults(useCursor: boolean = true): Promise<AnalysisResultsApiResponse> {
    this.checkInProgress();
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
    return this.status === AnalysisStatuses.QUEUED;
  }

  /** Check if status is running */
  public isRunning(): boolean {
    return this.status === AnalysisStatuses.RUNNING;
  }

  /** Check if status is completed */
  public isCompleted(): boolean {
    return this.status === AnalysisStatuses.COMPLETED;
  }

  /** Check if status is errored */
  public isErrored(): boolean {
    return this.status === AnalysisStatuses.ERRORED;
  }

  /** Check if status is canceled */
  public isCanceled(): boolean {
    return this.status === AnalysisStatuses.CANCELED;
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
    const endedStatuses = new Set([
      AnalysisStatuses.COMPLETED,
      AnalysisStatuses.ERRORED,
      AnalysisStatuses.CANCELED,
    ]);
    return endedStatuses.has(this.status);
  }

  /** Check if status indicates that the analysis is in progress (started but not finished) */
  public isInProgress(): boolean {
    return this.isQueued() || this.isRunning();
  }
}
