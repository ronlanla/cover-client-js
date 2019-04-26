// Copyright 2019 Diffblue Limited. All Rights Reserved.

/** Possible analysis states, extends the api status */
export enum AnalysisStatusEnum {
  /** Analysis is running */
  RUNNING = 'RUNNING',
  /** Analysis is canceled */
  CANCELED = 'CANCELED',
  /** Analysis is errored */
  ERRORED = 'ERRORED',
  /** Analysis is completed */
  COMPLETED = 'COMPLETED',
}

/** Possible Analysis object statuses, extends the api status enum */
export enum AnalysisObjectStatusEnum {
  /** Analysis has not been started */
  NOT_STARTED = 'NOT_STARTED',
  /** Analysis is running */
  RUNNING = 'RUNNING',
  /** Analysis is canceled */
  CANCELED = 'CANCELED',
  /** Analysis is errored */
  ERRORED = 'ERRORED',
  /** Analysis is completed */
  COMPLETED = 'COMPLETED',
}

/** Analysis progress returned by the API */
export interface AnalysisProgress {
  total: number;
  completed: number;
}

/** Error object returned by the API */
export interface ApiError {
  code: string;
  message: string;
}

/** Analysis result returned by API */
export interface AnalysisResult {
  'test-id': string;
  'test-name': string;
  'tested-function': string;
  'source-file-path': string;
  'test-body': string;
  imports: string[];
  'static-imports': string[];
  'class-annotations': string[];
  tags: string[];
  'phase-generated': string;
  'created-time': string;
}

/** Analysis phase returned and consumed by the API */
export interface AnalysisPhase {
  initial?: boolean;
  timeout?: number;
  classpath?: string;
  depth?: number;
  'java-external-code-action'?: string;
  'java-load-class'?: string[];
  'java-max-vla-length'?: number;
  'java-mock-class'?: string[];
  'java-unwind-enum-static'?: boolean;
  'max-nondet-string-length'?: number;
  unwind?: number;
  'string-printable'?: boolean;
  'max-nondet-array-length'?: number;
  'next-phase'?: {
    [event: string]: string;
  };
}

/**
 * Analysis phases returned and consumed by the API
 * A mapping of phase names to phases.
 */
export interface AnalysisPhases {
  [phaseName: string]: AnalysisPhase;
}

/** Settings parameter require to start an analysis */
export interface AnalysisSettings {
  include?: string[];
  exclude?: string[];
  context?: {
    include?: string[];
    exclude?: string[];
  };
  'ignore-defaults'?: boolean;
  phases?: AnalysisPhases;
  webhooks?: {
    finish?: string[];
    'test-generated'?: string[];
  };
}

/** Status object returned by the API */
export interface AnalysisStatusApiResponse {
  status: AnalysisStatusEnum;
  progress: AnalysisProgress;
  message?: ApiError;
}

/** Object returned by the API on analysis start */
export interface AnalysisStartApiResponse {
  id: string;
  phases: AnalysisPhases;
}

/** Object returned by the API on analysis cancellation */
export interface AnalysisCancel {
  message: string;
  status: AnalysisStatusApiResponse;
}

/** Object returned by the API on fetching results */
export interface AnalysisResultsApiResponse {
  cursor: string;
  status: AnalysisStatusApiResponse;
  results: AnalysisResult[];
}

/** Version object returned by the API */
export interface ApiVersionApiResponse {
  version: string;
}
