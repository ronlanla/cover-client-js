// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { delay } from 'bluebird';
import * as sinon from 'sinon';

import assert from '../../../src/utils/assertExtra';

import sinonTest from '../../../src/utils/sinonTest';

// "You're very clever, young man, very clever, but it's turtles all the way down!"
describe('utils/sinonTest', () => {
  it('Resolves if the callback resolves', async function() {
    await sinonTest()(async () => Promise.resolve()).call(this);
  });

  it('Resolves if the callback returns', async function() {
    await sinonTest()(() => undefined).call(this);
  });

  it('Rejects if the callback rejects', async function() {
    await assert.rejectsWith(
      sinonTest()(() => Promise.reject(new Error('Callback error'))).call(this),
      new Error('Callback error'),
    );
  });

  it('Configures the sandbox as specified ', async function() {
    await sinonTest({ useFakeTimers: false })(async () => {
      await delay(10);
    }).call(this);
  });

  it('Restores mocked dependencies once the callback has resolved', async function() {
    const originalProperty = () => true;
    const dependency = { property: originalProperty };

    const callback = async (sinon: sinon.SinonSandbox) => {
      const stub = sinon.stub(dependency, 'property');
      sinon.clock.restore();
      await delay(10);
      assert.strictEqual(dependency.property, stub);
    };

    await sinonTest()(callback).call(this);
    assert.strictEqual(dependency.property, originalProperty);
  });

  it('Restores mocked dependencies once the callback has rejected', async function() {
    const originalProperty = () => true;
    const dependency = { property: originalProperty };

    const callback = async (sinon: sinon.SinonSandbox) => {
      const stub = sinon.stub(dependency, 'property');
      sinon.clock.restore();
      await delay(10);
      assert.strictEqual(dependency.property, stub);
      throw new Error('Callback error');
    };

    await assert.rejectsWith(sinonTest()(callback).call(this), new Error('Callback error'));
    assert.strictEqual(dependency.property, originalProperty);
  });
});
