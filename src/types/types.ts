// Copyright 2019 Diffblue Limited. All Rights Reserved.

/** Possible analysis statuses */
export enum AnalysisStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  CANCELED = 'CANCELED',
  ERRORED = 'ERRORED',
  COMPLETED = 'COMPLETED',
}

export const inProgressStatuses = new Set([AnalysisStatus.QUEUED, AnalysisStatus.RUNNING, AnalysisStatus.STOPPING]);
export const endedStatuses = new Set([AnalysisStatus.CANCELED, AnalysisStatus.ERRORED, AnalysisStatus.COMPLETED]);

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
  classAnnotations: string[];
  coveredLines: string[];
  createdTime: string;
  imports: string[];
  phaseGenerated: string;
  sourceFilePath: string;
  staticImports: string[];
  tags: string[];
  testBody: string;
  testedFunction: string;
  testId: string;
  testName: string;
}

/** Analysis phase returned and consumed by the API */
export interface AnalysisPhase {
  classpath?: string;
  depth?: number;
  doNotTestMethodsWithAccess?: ['public' | 'protected' | 'default' | 'private'];
  initial?: boolean;
  inlineFunctionArguments?: boolean;
  inlineIntoAssertion?: boolean;
  javaAssumeInputsIntegral?: boolean;
  javaAssumeInputsNonNull?: boolean;
  javaExternalCodeAction?: 'mock' | 'mock-non-jdk' | 'ignore' | 'discard-testcase';
  javaGenerateNoComments?: boolean;
  javaLoadClass?: string[];
  javaMaxVlaLength?: number;
  javaMockClass?: string[];
  javaTestInputFactory?: string[];
  javaTestInputFactoryBmcMaxMutators?: number;
  javaTestInputFactoryBmcRecursionLimit?: number;
  javaTestInputFactoryEntryPoint?: string[];
  javaTestOutputEntryPoint?: string[];
  javaUnwindEnumStatic?: boolean;
  loadContainingClassOnly?: boolean;
  maxNondetArrayLength?: number;
  maxNondetStringLength?: number;
  nextPhase?: { [event: string]: string | null };
  noReflectiveAsserts?: boolean;
  paths?: 'fifo' | 'lifo';
  preferDepsJar?: boolean;
  singleFunctionOnly?: boolean;
  smartHarness?: 'nondet' | 'simplest-constructor-and-nondet' | 'input-factory';
  staticValuesJson?: boolean;
  stringPrintable?: boolean;
  throwRuntimeExceptions?: boolean;
  timeout: number;
  unwind?: number;
}

/**
 * Analysis phase returned and consumed by the API
 * - Timeout is optional in the input phases, only required for the computed phases (merged with defaults)
 */
export interface PartialAnalysisPhase extends Partial<AnalysisPhase> {}

/**
 * Analysis phases returned and consumed by the API
 * A mapping of phase names to phases.
 */
export interface AnalysisPhases {
  [phaseName: string]: AnalysisPhase;
}

/**
 * Analysis phases returned and consumed by the API
 * A mapping of phase names to phases.
 */
export interface PartialAnalysisPhases {
  [phaseName: string]: PartialAnalysisPhase;
}


/** Settings parameter require to start an analysis */
export interface AnalysisSettings {
  cover?: string[];
  coverExcludeBytecode?: string[];
  coverExcludeLines?: string[];
  coverFunctionOnly?: boolean;
  coverIncludeBytecode?: string[];
  coverIncludeLines?: string[];
  coverIncludePattern?: string;
  coverOnly?: 'file' | 'function';
  dependenciesOnClasspath?: Array<{classFile: string, source: string}>;
  entryPointsExclude?: string[];
  entryPointsInclude?: string[];
  ignoreDefaults?: boolean;
  phaseBase?: PartialAnalysisPhase;
  phases?: PartialAnalysisPhases;
}

/** Status object returned by the API */
export interface AnalysisStatusApiResponse {
  status: AnalysisStatus;
  progress: AnalysisProgress;
  message?: ApiErrorResponse;
}

/** Object returned by the API on analysis start */
export interface AnalysisStartApiResponse {
  id: string;
  settings: AnalysisSettings;
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

/** Options accepted by low level bindings */
export interface BindingsOptions {
  allowUnauthorizedHttps?: boolean;
}
