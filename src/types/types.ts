// Copyright 2019 Diffblue Limited. All Rights Reserved.

/** Possible analysis statuses */
export enum AnalysisStatuses {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  CANCELED = 'CANCELED',
  ERRORED = 'ERRORED',
  COMPLETED = 'COMPLETED',
}

/**
 * An interface that contains all the possible files for
 * submitting a request using the Platform Lite API
 */
export interface AnalysisFiles {
  build: Buffer | NodeJS.ReadableStream;
  dependenciesBuild?: Buffer | NodeJS.ReadableStream;
  baseBuild?: Buffer | NodeJS.ReadableStream;
}

/** Analysis progress returned by the API */
export interface AnalysisProgress {
  total: number;
  completed: number;
}

/** Error object returned by the API */
export interface ApiErrorResponse {
  code: string;
  message: string;
}

/** Analysis result returned by API */
export interface AnalysisResult {
  testId: string;
  testName: string;
  testedFunction: string;
  sourceFilePath: string;
  testBody: string;
  imports: string[];
  staticImports: string[];
  classAnnotations: string[];
  tags: string[];
  phaseGenerated: string;
  createdTime: string;
}

/** Analysis phase returned and consumed by the API */
export interface AnalysisPhase {
  initial?: boolean;
  timeout?: number;
  classpath?: string;
  depth?: number;
  javaExternalCodeAction?: 'mock' | 'mock-non-jdk' | 'ignore' | 'discard-testcase';
  javaLoadClass?: string[];
  javaMaxVlaLength?: number;
  javaMockClass?: string[];
  javaUnwindEnumStatic?: boolean;
  maxNondetStringLength?: number;
  unwind?: number;
  stringPrintable?: boolean;
  maxNondetArrayLength?: number;
  nextPhase?: {
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
  ignoreDefaults?: boolean;
  phases?: AnalysisPhases;
}

/** Status object returned by the API */
export interface AnalysisStatusApiResponse {
  status: AnalysisStatuses;
  progress: AnalysisProgress;
  message?: ApiErrorResponse;
}

/** Object returned by the API on analysis start */
export interface AnalysisStartApiResponse {
  id: string;
  phases: AnalysisPhases;
}

/** Object returned by the API on analysis cancellation */
export interface AnalysisCancelApiResponse {
  message: string;
  status: AnalysisStatusApiResponse;
}

/** Object returned by the API on fetching results */
export interface AnalysisResultsApiResponse {
  cursor: number;
  status: AnalysisStatusApiResponse;
  results: AnalysisResult[];
}

/** Version object returned by the API */
export interface ApiVersionApiResponse {
  version: string;
}

/** Options accepted by `Analysis.run` */
export interface RunAnalysisOptions {
  outputTests?: string;
  writingConcurrency?: number;
  pollingInterval?: number; // polling interval in seconds
  /** Called once for each results group returned when polling */
  onResults?(results: AnalysisResult[], filename: string): void;
  /** Called With error instance if run throws any error */
  onError?(error: Error): void;
}

/** Options accepted by `writeTests` */
export interface WriteTestsOptions {
  concurrency?: number;
}
