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

/** Error object returned by the API */
export interface ApiErrorResponse {
  code: string;
  message: string;
}

/** Analysis result returned by API */
export interface AnalysisResult {
  classAnnotations: string[];
  classRules: string[];
  coveredLines: string[];
  createdTime: string;
  imports: string[];
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
  loadRtJar?: boolean;
  maxNondetArrayLength?: number;
  maxNondetStringLength?: number;
  nextPhase?: { [name: string]: string | null };
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
 * - Timeout is optional in the input phases, only required for the computed phases
 * - Any property may be set in the phaseBase and hence omitted from a specific phase
 */
export interface PartialAnalysisPhase extends Partial<AnalysisPhase> {}

/**
 * Analysis phases returned and consumed by the API.
 * A mapping of phase names to phases.
 */
export interface AnalysisPhases {
  [phaseName: string]: AnalysisPhase;
}

/**
 * Partial analysis phases returned and consumed by the API.
 * A mapping of phase names to partial phases.
 */
export interface PartialAnalysisPhases {
  [phaseName: string]: PartialAnalysisPhase;
}


/** Settings parameter require to start an analysis */
export interface AnalysisSettings {
  cover?: string[];
  coverIncludeBytecode?: string[];
  coverExcludeBytecode?: string[];
  coverIncludeLines?: string[];
  coverExcludeLines?: string[];
  coverOnly?: 'file' | 'function';
  coverFunctionOnly?: boolean;
  coverIncludePattern?: string;
  inlineFunctionArguments?: boolean;
  inlineIntoAssertion?: boolean;
  entryPointsInclude?: string[];
  entryPointsExclude?: string[];
  useFuzzer?: boolean;
  phaseBase?: PartialAnalysisPhase;
  phases: { [name: string]: PartialAnalysisPhases };
}

/**
 * Fully computed analysis settings
 * - phaseBase is not returned in computed settings (any supplied phaseBase has been merged into phases)
 * - phases must now contain all required properties
 */
export interface ComputedAnalysisSettings extends Omit<AnalysisSettings, 'phases phaseBase'> {
  phases: { [name: string]: AnalysisPhases };
}


/** Status object returned by the API */
export interface AnalysisStatusApiResponse {
  status: AnalysisStatus;
  message?: ApiErrorResponse;
}

/** Object returned by the API on analysis start */
export interface AnalysisStartApiResponse {
  id: string;
  settings: ComputedAnalysisSettings;
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
