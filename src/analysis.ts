// Copyright 2019 Diffblue Limited. All Rights Reserved.

/** Possible analysis states, extends the api status */
enum StatusEnum {
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
interface AnalysisProgress {
  total: number;
  completed: number;
}

/** Error object returned by the API */
interface ApiError {
  code: string;
  message: string;
}

/** Analysis result returned by API */
interface AnalysisResult {
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
interface AnalysisPhase {
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
interface AnalysisPhases {
  [phaseName: string]: AnalysisPhase;
}

/** Settings parameter require to start an analysis */
interface AnalysisSettings {
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
interface AnalysisStatus {
  status: StatusEnum;
  progress: AnalysisProgress;
  message?: ApiError;
}

/** Object returned by the API on analysis start */
interface AnalysisStart {
  id: string;
  phases: AnalysisPhases;
}

/** Object returned by the API on analysis cancellation */
interface AnalysisCancel {
  message: string;
  status: AnalysisStatus;
}

/** Object returned by the API on fetching results */
interface AnalysisResults {
  cursor: string;
  status: AnalysisStatus;
  results: AnalysisResult[];
}

/** Version object returned by the API */
interface ApiVersion {
  version: string;
}

///////////////////////
// DUMMY API METHODS //
///////////////////////

const dummyStatus = { status: StatusEnum.RUNNING, progress: { completed: 10, total: 20 }};
const dummyResult = {
  'test-id': 'string',
  'test-name': 'string',
  'tested-function': 'string',
  'source-file-path': 'string',
  'test-body': 'string',
  imports: [],
  'static-imports': [],
  'class-annotations': [],
  tags: [],
  'phase-generated': 'string',
  'created-time': 'string',
};

/** Dummy start */
const start = async (
  _url: string,
  _buildPath: string,
  _settings: AnalysisSettings,
  _dependenciesBuildPath?: string,
  _baseBuildPath?: string,
): Promise<AnalysisStart> => {
  return { id: 'analysis-id-12345', phases: {}};
};

/** Dummy get status */
const getStatus = async (_url: string, _id: string): Promise<AnalysisStatus> => {
  return dummyStatus;
};

/** Dummy cancel */
const cancel = async (_url: string, _id: string): Promise<AnalysisCancel> => {
  return { message: 'message here', status: dummyStatus };
};

/** Dummy get results */
const results = async (_url: string, _id: string, _cursor?: string): Promise<AnalysisResults> => {
  return { cursor: '12345', status: dummyStatus, results: [dummyResult] };
};

/** Dummy version */
const version = async (_url: string): Promise<ApiVersion> => {
  return { version: '1.2.3' };
};

///////////////////////
///////////////////////

/** Class to run an analysis TODO */
export default class Analysis {

  /** API url */
  public url: string;

  private _id: string;
  private _status: StatusEnum = StatusEnum.NOT_STARTED;
  private _progress: AnalysisProgress;
  private _error?: ApiError;
  private _phases?: AnalysisPhases;
  private _results: AnalysisResult[] = [];
  private _cursor?: string;
  private _version?: string;

  public constructor(url: string) {
    this.url = url;
  }

  public get id(): string {
    return this._id;
  }

  public get status(): StatusEnum {
    return this._status;
  }

  public get progress(): AnalysisProgress {
    return this._progress;
  }

  public get error(): ApiError | undefined {
    return this._error;
  }

  public get phases(): AnalysisPhases | undefined {
    return this._phases;
  }

  public get results(): AnalysisResult[] | [] {
    return this._results;
  }

  public get cursor(): string | undefined {
    return this._cursor;
  }

  public get version(): string | undefined {
    return this._version;
  }

  /** Check if analysis is running */
  private checkRunning(): void {
    if (!this.id || this._status !== StatusEnum.RUNNING) {
      throw new Error(`Analysis is not running (status: ${this._status}).`);
    }
  }

  /** Check if analysis has started */
  private checkNotStarted(): void {
    if (this._status !== StatusEnum.NOT_STARTED) {
      throw new Error(`Analysis has already started (status: ${this._status}).`);
    }
  }

  /** Update status related properties */
  private updateStatus(status: AnalysisStatus): void {
    this._status = status.status;
    this._progress = status.progress;
    this._error = status.message;
  }

  /** Start analysis */
  public async start(
    buildPath: string,
    settings: AnalysisSettings,
    dependenciesBuildPath?: string,
    baseBuildPath?: string,
  ): Promise<AnalysisStart> {
    this.checkNotStarted();
    const response = await start(this.url, buildPath, settings, dependenciesBuildPath, baseBuildPath);
    this._id = response.id;
    this._phases = response.phases;
    this._status = StatusEnum.RUNNING;
    return response;
  }

  /** Cancel analysis */
  public async cancel(): Promise<AnalysisCancel> {
    this.checkRunning();
    const response = await cancel(this.url, this.id);
    this.updateStatus(response.status);
    return response;
  }

  /** Get analysis status */
  public async getStatus(): Promise<AnalysisStatus> {
    this.checkRunning();
    const response = await getStatus(this.url, this.id);
    this.updateStatus(response);
    return response;
  }

  /** Get analysis results */
  public async getResults(paginate: boolean = true): Promise<AnalysisResults> {
    this.checkRunning();
    const response = await results(this.url, this.id, paginate ? this.cursor : undefined);
    this.updateStatus(response.status);
    this._cursor = response.cursor;
    this._results = paginate ? [...this.results, ...response.results] : response.results;
    return response;
  }

  /** Get api version */
  public async getApiVersion(): Promise<ApiVersion> {
    const response = await version(this.url);
    this._version = response.version;
    return response;
  }

  // AKTODO
  // other features:
  //
  // automatic polling (option for start method?)
  // - set timeout
  // - callback on results
  // - callback on end
  // - accept stream??
  // - method to stop polling
  //
  // check version on start? optionally?
}
