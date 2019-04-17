import { Context } from 'mocha';
import * as sinon from 'sinon';

/**
 * Helper which injects a sinon sandbox into a Mocha callback
 *
 * Usage:
 * ```
 * it('Tests the function', sinonTest((sandbox) => {
 *  const logger = sandbox.stub(dependency, 'logger');
 *
 *  const result = testFunction('hello');
 *
 *  assert.strictEqual(result, 5);
 *  assert.calledOnceWith(logger, ['hello']);
 * }));
 * ```
 */
export default function sinonTest(config?: Partial<sinon.SinonSandboxConfig>) {
  return (callback: (this: Context, sandbox: sinon.SinonSandbox) => void) => {
    return async function(this: Context) {
      const sandbox = sinon.createSandbox({ ...sinon.defaultConfig, ...config });

      try {
        const result = await Promise.resolve(callback.call(this, sandbox));
        sandbox.verifyAndRestore();
        return result;
      } catch (error) {
        sandbox.restore();
        throw error;
      }
    };
  };
}
