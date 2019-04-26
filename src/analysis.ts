// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { cancel, getStatus, results, start, version } from './dummy-api';
import { AnalysisError, AnalysisErrorCodeEnum } from './errors';
import {
  AnalysisCancel, AnalysisObjectStatusEnum, AnalysisPhases, AnalysisProgress, AnalysisResult,
  AnalysisResultsApiResponse, AnalysisSettings, AnalysisStartApiResponse,
  AnalysisStatusApiResponse, ApiError, ApiVersionApiResponse,
} from './types';

export const components = {
  cancel: cancel,
  getStatus: getStatus,
  results: results,
  start: start,
  version: version,
};

/** Class to run an analysis and keep track of the analysis's state */
export default class Analysis {

  public apiUrl: string;
  public id = '';
  public buildPath?: string;
  public settings?: AnalysisSettings;
  public dependenciesBuildPath?: string;
  public baseBuildPath?: string;
  public status: AnalysisObjectStatusEnum = AnalysisObjectStatusEnum.NOT_STARTED;
  public progress?: AnalysisProgress;
  public error?: ApiError;
  public phases?: AnalysisPhases;
  public results: AnalysisResult[] = [];
  public cursor?: string;
  public apiVersion?: string;

  public constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /** Check if analysis is running */
  private checkRunning(): void {
    if (!this.id || this.status !== AnalysisObjectStatusEnum.RUNNING) {
      throw new AnalysisError(`Analysis is not running (status: ${this.status}).`, AnalysisErrorCodeEnum.NOT_RUNNING);
    }
  }

  /** Check if analysis has started */
  private checkNotStarted(): void {
    if (this.status !== AnalysisObjectStatusEnum.NOT_STARTED) {
      throw new AnalysisError(
        `Analysis has already started (status: ${this.status}).`,
        AnalysisErrorCodeEnum.ALREADY_STARTED,
      );
    }
  }

  /** Update status related properties */
  private updateStatus(status: AnalysisStatusApiResponse): void {
    this.status = AnalysisObjectStatusEnum[status.status];
    this.progress = status.progress;
    this.error = status.message;
  }

  /** Start analysis */
  public async start(
    buildPath: string,
    settings: AnalysisSettings,
    dependenciesBuildPath?: string,
    baseBuildPath?: string,
  ): Promise<AnalysisStartApiResponse> {
    this.checkNotStarted();
    const response = await components.start(this.apiUrl, buildPath, settings, dependenciesBuildPath, baseBuildPath);
    this.buildPath = buildPath;
    this.settings = settings;
    this.dependenciesBuildPath = dependenciesBuildPath;
    this.baseBuildPath = baseBuildPath;
    this.id = response.id;
    this.phases = response.phases;
    this.status = AnalysisObjectStatusEnum.RUNNING;
    return response;
  }

  /** Cancel analysis */
  public async cancel(): Promise<AnalysisCancel> {
    this.checkRunning();
    const response = await components.cancel(this.apiUrl, this.id);
    this.updateStatus(response.status);
    return response;
  }

  /** Get analysis status */
  public async getStatus(): Promise<AnalysisStatusApiResponse> {
    this.checkRunning();
    const response = await components.getStatus(this.apiUrl, this.id);
    this.updateStatus(response);
    return response;
  }

  /** Get analysis results */
  public async getResults(paginate: boolean = true): Promise<AnalysisResultsApiResponse> {
    this.checkRunning();
    const response = await components.results(this.apiUrl, this.id, paginate ? this.cursor : undefined);
    this.updateStatus(response.status);
    this.cursor = response.cursor;
    this.results = paginate ? [...this.results, ...response.results] : response.results;
    return response;
  }

  /** Get api version */
  public async getApiVersion(): Promise<ApiVersionApiResponse> {
    const response = await components.version(this.apiUrl);
    this.apiVersion = response.version;
    return response;
  }

  /** Check if status is not started */
  public isNotStarted(): boolean {
    return this.status === AnalysisObjectStatusEnum.NOT_STARTED;
  }

  /** Check if status is running */
  public isRunning(): boolean {
    return this.status === AnalysisObjectStatusEnum.RUNNING;
  }

  /** Check if status is completed */
  public isCompleted(): boolean {
    return this.status === AnalysisObjectStatusEnum.COMPLETED;
  }

  /** Check if status is errored */
  public isErrored(): boolean {
    return this.status === AnalysisObjectStatusEnum.ERRORED;
  }

  /** Check if status is canceled */
  public isCanceled(): boolean {
    return this.status === AnalysisObjectStatusEnum.CANCELED;
  }

  /** Check if status indicates that analysis has started */
  public isStarted(): boolean {
    return this.status !== AnalysisObjectStatusEnum.NOT_STARTED;
  }

  /** Check if status indicates that analysis has ended */
  public isEnded(): boolean {
    const endedStatuses = new Set([
      AnalysisObjectStatusEnum.COMPLETED,
      AnalysisObjectStatusEnum.ERRORED,
      AnalysisObjectStatusEnum.CANCELED,
    ]);
    return endedStatuses.has(this.status);
  }
}
