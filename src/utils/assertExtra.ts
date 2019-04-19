// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import * as assert from 'assert';
import * as sinon from 'sinon';

const assertExtra = {
  // Asserts that a spy was not called
  notCalled: (spy: sinon.SinonSpy) => {
    assert.strictEqual(spy.callCount, 0, `Called ${spy.callCount} times`);
  },

  // Asserts that a spy was called exactly once
  calledOnce: (spy: sinon.SinonSpy) => {
    assert.strictEqual(spy.callCount, 1, `Called ${spy.callCount} times`);
  },

  // Asserts that a spy was called exactly once with the arguments `args`
  calledOnceWith: <Type>(spy: sinon.SinonSpy, args: Type[]) => {
    assertExtra.calledOnce(spy);
    assert.deepStrictEqual(spy.getCall(0).args, args);
  },

  // Asserts that a spy was called exactly with the arguments specified in each entry of `calls`
  calledWith: <Type>(spy: sinon.SinonSpy, calls: Type[][]) => {
    assert.deepStrictEqual(spy.getCalls().map((call) => call.args), calls);
  },

  // Asserts that a spy was called starting with the arguments specified in each entry of `calls`
  calledStartingWith: <Type>(spy: sinon.SinonSpy, calls: Type[][]) => {
    const actualCalls = spy.getCalls().map((call) => call.args);
    const startingWithCalls = actualCalls.map((args, i) => calls[i] ? args.slice(0, calls[i].length) : args);
    assert.deepStrictEqual(startingWithCalls, calls);
  },

  // Asserts that a spy was called exactly once starting with the arguments `args`
  calledOnceStartingWith: <Type>(spy: sinon.SinonSpy, args: Type[]) => {
    assertExtra.calledOnce(spy);
    assert.deepStrictEqual(spy.getCall(0).args.slice(0, args.length), args);
  },

  // Asserts a promise rejects with a particular error
  rejectsWith: async <Resolve>(promise: Promise<Resolve>, expectedError: Error | string) => {
    let rejected = false;
    return promise.catch((error: Error | string) => {
      rejected = true;
      return error;
    })
    .then((error: Error | string) => {
      assert.strictEqual(rejected, true, 'Promise did not reject');
      assert.strictEqual(String(error), String(expectedError));
    });
  },

  notOtherwiseCalled: (stub: sinon.SinonStub, name: string) => {
    stub.callsFake(async (...args) => {
      throw new Error(`Unexpected call to ${name} with args ${JSON.stringify(args)}`);
    });
  }
};

export default { ...assert, ...assertExtra };
