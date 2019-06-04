// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import * as assert from 'assert';
import * as sinon from 'sinon';

/** Returns the error thrown by a callback */
export function getError(callback: () => void): Error {
  try {
    callback();
  } catch (error) {
    return error;
  }
  throw new Error('Expected callback to throw an error');
}

/** Higher order function which checks errors match in `assert.throws` */
export function errorEquals(expectedError: Error) {
  return (error: Error | string) => {
    assert.deepStrictEqual(error, expectedError);
    return true;
  };
}

const assertExtra = {
  /** Asserts that a spy was not called */
  notCalled: (spy: sinon.SinonSpy) => {
    assert.strictEqual(spy.callCount, 0, `Called ${spy.callCount} times`);
  },

  /** Asserts that a spy was called exactly once */
  calledOnce: (spy: sinon.SinonSpy) => {
    assert.strictEqual(spy.callCount, 1, `Called ${spy.callCount} times`);
  },

  /** Asserts that a spy was called exactly once with the arguments `args` */
  calledOnceWith: <Type>(spy: sinon.SinonSpy, args: Type[]) => {
    assertExtra.calledOnce(spy);
    assert.deepStrictEqual(spy.getCall(0).args, args);
  },

  /** Asserts that a spy was called exactly with the arguments specified in each entry of `calls` */
  calledWith: <Type>(spy: sinon.SinonSpy, calls: Type[][]) => {
    assert.deepStrictEqual(spy.getCalls().map((call) => call.args), calls);
  },

  /** Asserts that a spy was called starting with the arguments specified in each entry of `calls` */
  calledStartingWith: <Type>(spy: sinon.SinonSpy, calls: Type[][]) => {
    const actualCalls = spy.getCalls().map((call) => call.args);
    const startingWithCalls = actualCalls.map((args, i) => calls[i] ? args.slice(0, calls[i].length) : args);
    assert.deepStrictEqual(startingWithCalls, calls);
  },

  /** Asserts that a spy was called exactly once starting with the arguments `args` */
  calledOnceStartingWith: <Type>(spy: sinon.SinonSpy, args: Type[]) => {
    assertExtra.calledOnce(spy);
    assert.deepStrictEqual(spy.getCall(0).args.slice(0, args.length), args);
  },

  /** Asserts a promise rejects with a particular error */
  rejectsWith: async <Resolve>(promise: Promise<Resolve>, expectedError: Error | string | RegExp) => {
    let rejected = false;
    return promise.catch((error: Error | string) => {
      rejected = true;
      return error;
    })
    .then((error: Error | string) => {
      assert.strictEqual(rejected, true, 'Promise did not reject');

      if (expectedError instanceof RegExp) {
        assertExtra.matches(String(error), expectedError);
      } else {
        assert.strictEqual(String(error), String(expectedError));
      }
    });
  },

  /**
   * Asserts that a stub is not called, expected to be used in combination
   * with `withArgs` so that any other calls fall through to this.
   * This should be called before calling the function under test
   */
  notOtherwiseCalled: (stub: sinon.SinonStub, name: string) => {
    stub.callsFake((...args) => {
      throw new assert.AssertionError({ message: `Unexpected call to ${name} with args ${JSON.stringify(args)}` });
    });
  },

  /** Checks if a value matches a regex or string pattern */
  matches: (value: string, pattern: RegExp | string) => {
    const matches = value.match(pattern);
    assert.strictEqual(Boolean(matches && matches.length), true, `"${value}" did not match pattern "${pattern}"`);
  },

  startsWith: (value: string, start: string) => {
    assert.strictEqual(value.startsWith(start), true, `"${value}" does not start with "${start}"`);
  },

  endsWith: (value: string, end: string) => {
    assert.strictEqual(value.endsWith(end), true, `"${value}" does not end with "${end}"`);
  },

  /** Assert that the expected changes and only the expected changes have occurred on an object */
  changedProperties: <ObjectA, ObjectB>(
    originalObject: ObjectA,
    changedObject: ObjectB,
    expectedChanges: Partial<ObjectA & ObjectB>,
  ) => {
    for (const [key, value] of Object.entries(expectedChanges)) {
      originalObject[key as keyof ObjectA] = value;
    }
    assert.deepStrictEqual(changedObject, originalObject);
  },
};

export default { ...assert, ...assertExtra };
