// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import CancellableDelay from '../../../src/utils/CancellableDelay';

const sinonTest = sinonTestFactory({ useFakeTimers: false });


describe('utils/CancellableDelay', () => {

  it('Resolves after the specified delay', sinonTest(async (sinon) => {
    const delay = new CancellableDelay(1, undefined);
    const retval = await delay.promise;
    assert.strictEqual(retval, undefined);
  }));

  it('Resolves after the specified delay with the provided value', sinonTest(async (sinon) => {
    const delay = new CancellableDelay(1, 'resolved');
    const retval = await delay.promise;
    assert.strictEqual(retval, 'resolved');
  }));

  it('Resolves early if cancel is called', sinonTest(async (sinon) => {
    const delay = new CancellableDelay(5 * 1000, 'resolved');
    setImmediate(() => delay.cancel());
    const retval = await delay.promise;
    assert.strictEqual(retval, 'resolved');
  }));

  it('Rejects if cancel is called with error', sinonTest(async (sinon) => {
    const delay = new CancellableDelay(5 * 1000, 'resolved');
    const error = new Error('canceled with error');
    setImmediate(() => delay.cancel(error));
    await assert.rejects(async () => delay.promise, error);
  }));

  it('Resolves immediately if resolve is called', sinonTest(async (sinon) => {
    const delay = new CancellableDelay(5 * 1000, 'resolved');
    setImmediate(() => delay.resolve('something else'));
    const retval = await delay.promise;
    assert.strictEqual(retval, 'something else');
  }));

  it('Resolves immediately if reject is called', sinonTest(async (sinon) => {
    const delay = new CancellableDelay(5 * 1000, 'resolved');
    const error = new Error('rejected with error');
    setImmediate(() => delay.reject(error));
    await assert.rejects(async () => delay.promise, error);
  }));

  it('Does nothing cancel is called again', sinonTest(async (sinon) => {
    const delay = new CancellableDelay(5 * 1000, 'resolved');
    setImmediate(() => delay.cancel());
    const retval = await delay.promise;
    delay.cancel();
    assert.strictEqual(retval, 'resolved');
  }));
});
