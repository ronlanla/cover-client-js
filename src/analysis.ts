// Copyright 2019 Diffblue Limited. All Rights Reserved.

import {
  cancelAnalysis,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  startAnalysis,
} from './bindings';
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
} from './types/types';


export const components = {
  cancelAnalysis: cancelAnalysis,
  getAnalysisResults: getAnalysisResults,
  getAnalysisStatus: getAnalysisStatus,
  getApiVersion: getApiVersion,
  startAnalysis: startAnalysis,
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

  /** Update status related properties and end the internal readable stream if required */
  private updateStatus(status: AnalysisStatusApiResponse): void {
    this.status = AnalysisObjectStatuses[status.status];
    this.progress = status.progress;
    this.error = status.message;
  }

  /** Start analysis */
  public async start(
    settings: AnalysisSettings,
    files: AnalysisFiles,
  ): Promise<AnalysisStartApiResponse> {
    this.checkNotStarted();
    const response = await components.startAnalysis(this.apiUrl, settings, files);
    this.settings = settings;
    this.analysisId = response.id;
    this.phases = response.phases;
    this.status = AnalysisObjectStatuses.RUNNING;
    return response;
  }

  /** Cancel analysis */
  public async cancel(): Promise<AnalysisCancelApiResponse> {
    this.checkRunning();
    const response = await components.cancelAnalysis(this.apiUrl, this.analysisId);
    this.updateStatus(response.status);
    return response;
  }

  /** Get analysis status */
  public async getStatus(): Promise<AnalysisStatusApiResponse> {
    this.checkRunning();
    const response = await components.getAnalysisStatus(this.apiUrl, this.analysisId);
    this.updateStatus(response);
    return response;
  }

  /** Get analysis results */
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

  /** Check if status indicates that analysis has started */
  public isStarted(): boolean {
    return this.status !== AnalysisObjectStatuses.NOT_STARTED;
  }

  /** Check if status indicates that analysis has ended */
  public isEnded(): boolean {
    const endedStatuses = new Set([
      AnalysisObjectStatuses.COMPLETED,
      AnalysisObjectStatuses.ERRORED,
      AnalysisObjectStatuses.CANCELED,
    ]);
    return endedStatuses.has(this.status);
  }
}
