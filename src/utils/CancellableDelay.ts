// Copyright 2019 Diffblue Limited. All Rights Reserved.

/** Signature of Promise resolver callback */
type resolver = (value?: {} | PromiseLike<{}> | undefined) => void;
/** Signature of Promise rejector callback */
type rejector = (reason?: any) => void;  // tslint:disable-line:no-any

/**
 * A deferred whose promise resolves after the specified delay, with any supplied value.
 *
 * Calling cancel will clear the internal timer and can cause the promise to resolve or reject as required.
 */
export default class CancellableDelay {

  public timer?: NodeJS.Timeout | null = null;
  public promise: Promise<any>; // tslint:disable-line:no-any
  public resolve: resolver;
  public reject: rejector;
  public resolveValue: any; // tslint:disable-line:no-any

  public constructor(delay: number, value?: any) { // tslint:disable-line:no-any
    // tslint:disable-next-line:no-inferred-empty-object-type
    this.promise = new Promise((resolve: resolver, reject: rejector) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.resolveValue = value;
    this.timer = setTimeout(() => this.resolve(value), delay);
  }

  /** Cancel the timer and either resolve the promise early or reject with the supplied error */
  public cancel(rejectWith?: Error): void {
    if (rejectWith) {
      this.reject(rejectWith);
    } else {
      this.resolve(this.resolveValue);
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

}
