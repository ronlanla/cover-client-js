// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import publishPackage, {
  authenticateNpm,
  components,
  dependencies,
  extractNpmError,
  getAuthUser,
} from '../../../src/scripts/publishPackage';

import { ExpectedError } from '../../../src/utils/commandLineRunner';

const sinonTest = sinonTestFactory();

describe('scripts/copyrightChecker', () => {
  describe('getAuthUser', () => {
    const environment = { foo: 'bar' };
    it('Resolve with the username when authenticated with NPM', sinonTest(async (sinon) => {
      const exec = sinon.stub(dependencies, 'exec').resolves({ stdout: 'username', stderr: '' });
      assert.strictEqual(await getAuthUser(environment), 'username');
      assert.calledOnceWith(exec, ['npm whoami', { env: environment }]);
    }));

    it('Resolves with undefined if not authenticated with NPM', sinonTest(async (sinon) => {
      const exec = sinon.stub(dependencies, 'exec').rejects(new Error('Not authenticated'));
      assert.strictEqual(await getAuthUser({ foo: 'bar' }), undefined);
      assert.calledOnceWith(exec, ['npm whoami', { env: environment }]);
    }));
  });

  describe('authenticateNpm', () => {
    it('Resolves after calling the callback, writing and removing the npm config file', sinonTest(async (sinon) => {
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const unlink = sinon.stub(dependencies, 'unlink').resolves();
      const callback = sinon.stub().resolves();

      await authenticateNpm('abc123', { foo: 'bar' }, callback);
      assert.calledOnceWith(callback, [{ foo: 'bar', npm_config_registry: '' }]);
      assert.calledOnceWith(writeFile, ['.npmrc', '//registry.npmjs.org/:_authToken=abc123']);
      assert.calledOnceWith(unlink, ['.npmrc']);
    }));

    it('Rejects if the callback rejects', sinonTest(async (sinon) => {
      sinon.stub(dependencies, 'writeFile').resolves();
      sinon.stub(dependencies, 'unlink').resolves();
      const callback = sinon.stub().rejects(new Error('Callback error'));

      await assert.rejectsWith(authenticateNpm('abc123', { foo: 'bar' }, callback), new Error('Callback error'));
    }));
  });

  describe('extractNpmError', () => {
    it('Returns the error message from NPM output', () => {
      const output = [
        'npm notice',
        'npm ERR! code ENEEDAUTH',
        'npm ERR! need auth auth required for publishing',
      ].join('\n');

      const errorMessage = [
        'code ENEEDAUTH',
        'need auth auth required for publishing',
      ].join('\n');

      assert.strictEqual(extractNpmError(output), errorMessage);
    });
  });

  describe('publishPackage', () => {
    const environment = { foo: 'bar' };
    it('Rejects if no token is provided', sinonTest(async (sinon) => {
      const getAuthUser = sinon.stub(components, 'getAuthUser');
      const authenticateNpm = sinon.stub(components, 'authenticateNpm');
      const exec = sinon.stub(dependencies, 'exec');

      const expectedError = new Error('Please provide a token to authenticate with NPM');
      await assert.rejectsWith(publishPackage(environment)([]), expectedError);
      assert.notCalled(exec);
      assert.notCalled(getAuthUser);
      assert.notCalled(authenticateNpm);
    }));

    it('Rejects if the token does not authenticate with NPM', sinonTest(async (sinon) => {
      sinon.stub(components, 'getAuthUser').resolves(undefined);
      sinon.stub(components, 'authenticateNpm').callsFake(async (token, environment, callback) => {
        return callback(environment);
      });
      const exec = sinon.stub(dependencies, 'exec');
      exec.withArgs('yarn install').resolves();
      exec.withArgs('npm shrinkwrap').resolves();

      assert.notOtherwiseCalled(exec, 'exec');
      const expectedError = new ExpectedError('Invalid token to authenticate with NPM');
      await assert.rejectsWith(publishPackage(environment)(['abc123']), expectedError);
    }));

    it('Rejects when the package could not be otherwise published', sinonTest(async (sinon) => {
      sinon.stub(components, 'getAuthUser').resolves('username');
      sinon.stub(components, 'authenticateNpm').callsFake(async (token, environment, callback) => {
        return callback(environment);
      });
      const exec = sinon.stub(dependencies, 'exec');
      exec.withArgs('yarn install').resolves();
      exec.withArgs('npm shrinkwrap').resolves();
      exec.withArgs('npm publish --access public', { env: environment }).rejects(new Error('Publish error'));

      assert.notOtherwiseCalled(exec, 'exec');
      const expectedError = new ExpectedError('Could not publish package\n');
      await assert.rejectsWith(publishPackage(environment)(['abc123']), expectedError);
    }));

    it('Resolves when the package is published correctly ', sinonTest(async (sinon) => {
      sinon.stub(components, 'getAuthUser').resolves('username');
      sinon.stub(components, 'authenticateNpm').callsFake(async (token, environment, callback) => {
        return callback(environment);
      });
      const exec = sinon.stub(dependencies, 'exec');
      exec.withArgs('yarn install').resolves();
      exec.withArgs('npm shrinkwrap').resolves();
      exec.withArgs('npm publish --access public', { env: environment }).resolves();

      assert.notOtherwiseCalled(exec, 'exec');
      const result = await publishPackage(environment)(['abc123']);
      assert.strictEqual(result, 'Successfully published');
    }));
  });
});
