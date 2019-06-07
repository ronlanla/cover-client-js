// Copyright 2019 Diffblue Limited. All Rights Reserved.

/** Signature of Promise resolver callback */
type Resolver<Value> = (value?: Value | PromiseLike<Value> | undefined) => void;
/** Signature of Promise rejector callback */
type Rejector = (reason?: string | Error) => void;

/**
 * A deferred whose promise resolves after the specified delay, with any supplied value.
 *
 * Calling cancel will clear the internal timer and can cause the promise to resolve or reject as required.
 */
export default class CancellableDelay<Value> {

  public timer?: NodeJS.Timeout | null = null;
  public promise: Promise<Value>;
  public resolve: Resolver<Value>;
  public reject: Rejector;
  public resolveValue: Value;

  public constructor(delay: number, value: Value) {
    this.promise = new Promise((resolve: Resolver<Value>, reject: Rejector) => {
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
