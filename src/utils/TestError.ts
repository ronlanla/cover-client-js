// Copyright 2019 Diffblue Limited. All Rights Reserved.

/** Error class to imitate node errors */
export default class TestError extends Error implements NodeJS.ErrnoException {
  public code: string;

  public constructor(message: string, code: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
