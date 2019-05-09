// Copyright 2019 Diffblue Limited. All Rights Reserved.

/** Error codes usable by CombinerError */
export enum CombinerErrorCodes {
  RESULTS_MISSING = 'RESULTS_MISSING',
  RESULTS_EMPTY = 'RESULTS_EMPTY',
  RESULTS_TYPE = 'RESULTS_TYPE',
  EXISTING_CLASS_MISSING = 'EXISTING_CLASS_MISSING',
  EXISTING_CLASS_TYPE = 'EXISTING_CLASS_TYPE',
  SOURCE_FILE_PATH_DIFFERS = 'SOURCE_FILE_PATH_DIFFERS',
  CLASS_NAME_DIFFERS = 'CLASS_NAME_DIFFERS',
  PACKAGE_NAME_DIFFERS = 'PACKAGE_NAME_DIFFERS',
  NO_CLASS_NAME = 'NO_CLASS_NAME',
  MERGE_ERROR = 'MERGE_ERROR',
  GENERATE_ERROR = 'GENERATE_ERROR',
}

/** Error thrown when combining results, with additional error code */
export class CombinerError extends Error {

  public message: string;
  public code: CombinerErrorCodes;

  public constructor(message: string, code: CombinerErrorCodes) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error codes usable by AnalysisError */
export enum AnalysisErrorCodes {
  NOT_RUNNING = 'NOT_STARTED',
  ALREADY_STARTED = 'ALREADY_STARTED',
  NO_ID = 'NO_ID',
  STREAM_MUST_PAGINATE = 'STREAM_MUST_PAGINATE',
  STREAM_NOT_WRITABLE = 'STREAM_NOT_WRITABLE',
  STREAM_NOT_OBJECT_MODE = 'STREAM_NOT_OBJECT_MODE',
}

/** Error thrown by Analysis object with additional error code */
export class AnalysisError extends Error {

  public message: string;
  public code: AnalysisErrorCodes;

  public constructor(message: string, code: AnalysisErrorCodes) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
