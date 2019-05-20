// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { delay } from 'bluebird';

import {
  cancelAnalysis,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  startAnalysis,
} from './bindings';
import {  getFileNameForResult, groupResults } from './combiner';
import { AnalysisError, AnalysisErrorCodes } from './errors';
import {
  AnalysisCancelApiResponse,
  AnalysisFiles,
  AnalysisObjectStatuses,
  AnalysisPhases,
  AnalysisProgress,
  AnalysisResult,
  AnalysisResultsApiResponse,
  AnalysisSettings,
  AnalysisStartApiResponse,
  AnalysisStatusApiResponse,
  ApiErrorResponse,
  ApiVersionApiResponse,
  RunAnalysisOptions,
  WriteTestsOptions,
} from './types/types';
import writeTests from './writeTests';

export const components = {
  writeTests: writeTests,
  cancelAnalysis: cancelAnalysis,
  getAnalysisResults: getAnalysisResults,
  getAnalysisStatus: getAnalysisStatus,
  getApiVersion: getApiVersion,
  startAnalysis: startAnalysis,
  defaultPollingInterval: 60,  // seconds
};

/** Class to run an analysis and keep track of its state */
export default class Analysis {

  public apiUrl: string;
  public analysisId = '';
  public settings?: AnalysisSettings;
  public status: AnalysisObjectStatuses = AnalysisObjectStatuses.NOT_STARTED;
  public progress?: AnalysisProgress;
  public error?: ApiErrorResponse;
  public phases?: AnalysisPhases;
  public results: AnalysisResult[] = [];
  public cursor?: number;
  public apiVersion?: string;

  public constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /** Check if analysis is running */
  private checkRunning(): void {
    if (!this.isRunning()) {
      throw new AnalysisError(`Analysis is not running (status: ${this.status}).`, AnalysisErrorCodes.NOT_RUNNING);
    }
    if (!this.analysisId) {
      throw new AnalysisError('Analysis is running but the analysis id is not set.', AnalysisErrorCodes.NO_ID);
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
    this.status = AnalysisObjectStatuses[status.status];
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
      const millisecondsPerSecond = 1000;
      const pollingIntervalMilliseconds = (
        (options.pollingInterval || components.defaultPollingInterval) * millisecondsPerSecond
      );
      await this.start(files, settings);
      while (this.isRunning()) {
        await delay(pollingIntervalMilliseconds);
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
      if (options.onError) {
        options.onError(error);
      } else {
        throw error;
      }
    }
    return this.results;
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
    const response = await components.startAnalysis(this.apiUrl, files, settings);
    this.settings = settings;
    this.analysisId = response.id;
    this.phases = response.phases;
    this.status = AnalysisObjectStatuses.RUNNING;
    return response;
  }

  /** Cancel the analysis */
  public async cancel(): Promise<AnalysisCancelApiResponse> {
    this.checkRunning();
    const response = await components.cancelAnalysis(this.apiUrl, this.analysisId);
    this.updateStatus(response.status);
    return response;
  }

  /** Get the analysis' status */
  public async getStatus(): Promise<AnalysisStatusApiResponse> {
    this.checkRunning();
    const response = await components.getAnalysisStatus(this.apiUrl, this.analysisId);
    this.updateStatus(response);
    return response;
  }

  /** Get the analysis' results */
  public async getResults(paginate: boolean = true): Promise<AnalysisResultsApiResponse> {
    this.checkRunning();
    const response = await components.getAnalysisResults(
      this.apiUrl,
      this.analysisId,
      paginate ? this.cursor : undefined,
    );
    this.cursor = response.cursor;
    this.results = paginate ? [...this.results, ...response.results] : response.results;
    this.updateStatus(response.status);
    return response;
  }

  /** Get api version */
  public async getApiVersion(): Promise<ApiVersionApiResponse> {
    const response = await components.getApiVersion(this.apiUrl);
    this.apiVersion = response.version;
    return response;
  }

  /** Check if status is not started */
  public isNotStarted(): boolean {
    return this.status === AnalysisObjectStatuses.NOT_STARTED;
  }

  /** Check if status is running */
  public isRunning(): boolean {
    return this.status === AnalysisObjectStatuses.RUNNING;
  }

  /** Check if status is completed */
  public isCompleted(): boolean {
    return this.status === AnalysisObjectStatuses.COMPLETED;
  }

  /** Check if status is errored */
  public isErrored(): boolean {
    return this.status === AnalysisObjectStatuses.ERRORED;
  }

  /** Check if status is canceled */
  public isCanceled(): boolean {
    return this.status === AnalysisObjectStatuses.CANCELED;
  }

  /** Check if status indicates that the analysis has started */
  public isStarted(): boolean {
    return this.status !== AnalysisObjectStatuses.NOT_STARTED;
  }

  /** Check if status indicates that the analysis has ended */
  public isEnded(): boolean {
    const endedStatuses = new Set([
      AnalysisObjectStatuses.COMPLETED,
      AnalysisObjectStatuses.ERRORED,
      AnalysisObjectStatuses.CANCELED,
    ]);
    return endedStatuses.has(this.status);
  }
}
