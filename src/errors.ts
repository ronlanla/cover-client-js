// Copyright 2019 Diffblue Limited. All Rights Reserved.

/**
 * Common parent class for all Client Library errors.
 * Not intended to be thrown directly.
 */
export class CoverClientError extends Error {

  public message: string;
  public code?: string;

  public constructor(message: string, code?: string) {
    super(message);
    this.code = code;
    this.name = `CoverClientError ${ this.code || ''}`.trim();
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error returned by an API request */
export class ApiError extends CoverClientError {

  public message: string; // The message provided in the API error response body, if present
  public code: string;  // The code provided in the API error response body, if present
  public status?: number;  // the http status code of the response, if available

  public constructor(message: string, code: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = `ApiError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error codes used by BindingsError */
export enum BindingsErrorCodes {
  BUILD_MISSING = 'BUILD_MISSING',
  SETTINGS_INVALID = 'SETTINGS_INVALID',
}

/** Error thrown by bindings functions, with additional error code */
export class BindingsError extends CoverClientError {

  public message: string;
  public code: BindingsErrorCodes;

  public constructor(message: string, code: BindingsErrorCodes) {
    super(message);
    this.code = code;
    this.name = `BindingsError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error codes used by CombinerError */
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
export class CombinerError extends CoverClientError {

  public message: string;
  public code: CombinerErrorCodes;

  public constructor(message: string, code: CombinerErrorCodes) {
    super(message);
    this.code = code;
    this.name = `CombinerError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error codes used by WriterError */
export enum WriterErrorCodes {
  DIR_FAILED = 'DIR_FAILED',
  WRITE_FAILED = 'WRITE_FAILED',
}

/** Error thrown by Analysis object, with additional error code */
export class WriterError extends CoverClientError {

  public message: string;
  public code: WriterErrorCodes;

  public constructor(message: string, code: WriterErrorCodes) {
    super(message);
    this.code = code;
    this.name = `WriterError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error codes used by AnalysisError */
export enum AnalysisErrorCodes {
  NOT_RUNNING = 'NOT_STARTED',
  ALREADY_STARTED = 'ALREADY_STARTED',
  NO_ID = 'NO_ID',
  RUN_ERRORED = 'RUN_ERRORED',
}

/** Error thrown by Analysis object, with additional error code */
export class AnalysisError extends CoverClientError {

  public message: string;
  public code: AnalysisErrorCodes;

  public constructor(message: string, code: AnalysisErrorCodes) {
    super(message);
    this.code = code;
    this.name = `AnalysisError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
