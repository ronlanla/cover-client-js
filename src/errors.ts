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
export enum BindingsErrorCode {
  BUILD_MISSING = 'BUILD_MISSING',
  SETTINGS_INVALID = 'SETTINGS_INVALID',
  SETTINGS_MISSING = 'SETTINGS_MISSING',
}

/** Error thrown by bindings functions, with additional error code */
export class BindingsError extends CoverClientError {

  public message: string;
  public code: BindingsErrorCode;

  public constructor(message: string, code: BindingsErrorCode) {
    super(message);
    this.code = code;
    this.name = `BindingsError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error codes used by CombinerError */
export enum CombinerErrorCode {
  RESULTS_MISSING = 'RESULTS_MISSING',
  RESULTS_EMPTY = 'RESULTS_EMPTY',
  RESULTS_TYPE = 'RESULTS_TYPE',
  EXISTING_CLASS_MISSING = 'EXISTING_CLASS_MISSING',
  EXISTING_CLASS_TYPE = 'EXISTING_CLASS_TYPE',
  SOURCE_FILE_PATH_DIFFERS = 'SOURCE_FILE_PATH_DIFFERS',
  PACKAGE_NAME_DIFFERS = 'PACKAGE_NAME_DIFFERS',
  MERGE_ERROR = 'MERGE_ERROR',
  GENERATE_ERROR = 'GENERATE_ERROR',
}

/** Error thrown when combining results, with additional error code */
export class CombinerError extends CoverClientError {

  public message: string;
  public code: CombinerErrorCode;

  public constructor(message: string, code: CombinerErrorCode) {
    super(message);
    this.code = code;
    this.name = `CombinerError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error codes used by WriterError */
export enum WriterErrorCode {
  DIR_FAILED = 'DIR_FAILED',
  WRITE_FAILED = 'WRITE_FAILED',
}

/** Error thrown by Analysis object, with additional error code */
export class WriterError extends CoverClientError {

  public message: string;
  public code: WriterErrorCode;

  public constructor(message: string, code: WriterErrorCode) {
    super(message);
    this.code = code;
    this.name = `WriterError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

/** Error codes used by AnalysisError */
export enum AnalysisErrorCode {
  NOT_STARTED = 'NOT_STARTED',
  ALREADY_STARTED = 'ALREADY_STARTED',
  NO_ID = 'NO_ID',
  RUN_ERRORED = 'RUN_ERRORED',
  START_DEFAULTS_FAILED = 'START_DEFAULTS_FAILED',
}

/** Error thrown by Analysis object, with additional error code */
export class AnalysisError extends CoverClientError {

  public message: string;
  public code: AnalysisErrorCode;

  public constructor(message: string, code: AnalysisErrorCode) {
    super(message);
    this.code = code;
    this.name = `AnalysisError ${this.code}`;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
