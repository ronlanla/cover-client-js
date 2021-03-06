// Copyright 2019 Diffblue Limited. All Rights Reserved.

import {
  cancelAnalysis,
  components,
  dependencies,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  getDefaultSettings,
  startAnalysis,
} from '../../src/bindings';
import { BindingsError, BindingsErrorCode } from '../../src/errors';
import assert from '../../src/utils/assertExtra';
import sinonTestFactory from '../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

const sampleConfig = {
  httpsAgent: components.permissiveHttpsAgent,
};

describe('api/bindings', () => {
  const api = 'http://localhost/api';

  describe('getApiVersion', () => {
    const versionUrl = `${api}/version`;

    it('Returns the current version of the API', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get');

      get.withArgs(versionUrl).resolves({ version: '1.0.1' });
      assert.notOtherwiseCalled(get, 'get');

      const actualVersion = await getApiVersion(api);
      const expectedVersion = { version: '1.0.1' };

      assert.deepStrictEqual(actualVersion, expectedVersion);
    }));

    it('Handles the allowUnauthorizedHttps option correctly', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get').resolves();
      await getApiVersion(api, { allowUnauthorizedHttps: true });
      assert.calledOnceWith(get, [versionUrl, sampleConfig]);
    }));
  });

  describe('getDefaultSettings', () => {
    const defaultSettingsUrl = `${api}/default-settings`;

    it('Returns default analysis settings', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get');
      const settings = { phases: {}};

      get.withArgs(defaultSettingsUrl).resolves(settings);
      assert.notOtherwiseCalled(get, 'get');

      const response = await getDefaultSettings(api);

      assert.deepStrictEqual(response, settings);
    }));

    it('Handles the allowUnauthorizedHttps option correctly', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get').resolves();
      await getDefaultSettings(api, { allowUnauthorizedHttps: true });
      assert.calledOnceWith(get, [defaultSettingsUrl, sampleConfig]);
    }));
  });

  describe('startAnalysis', () => {
    const build = Buffer.from('foo');
    const baseBuild = Buffer.from('bar');
    const dependenciesBuild = Buffer.from('roh');
    const startUrl = `${api}/analysis`;
    const settings = { phases: {}};

    it('Starts an analysis then returns the id and settings', sinonTest(async (sinon) => {
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(startUrl).resolves({ id: '1234-ABCD', settings: {}});
      assert.notOtherwiseCalled(post, 'post');

      const actualResponse = await startAnalysis(api, { build: build }, settings);
      const expectedResponse = { id: '1234-ABCD', settings: {}};

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));

    it('Appends a base build file to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(startUrl).resolves({ id: '1234-ABCD', settings: settings });
      assert.notOtherwiseCalled(post, 'post');

      await startAnalysis(api, { build: build, baseBuild: baseBuild }, settings);

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'baseBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));

    it('Appends a dependencies build file to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(startUrl).resolves({ id: '1234-ABCD', settings: settings });
      assert.notOtherwiseCalled(post, 'post');

      await startAnalysis(api, { build: build, dependenciesBuild: dependenciesBuild }, settings);

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'dependenciesBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));

    it('Appends all files to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(startUrl).resolves({ id: '1234-ABCD', settings: settings });
      assert.notOtherwiseCalled(post, 'post');

      await startAnalysis(
        api,
        {
          build: build,
          baseBuild: baseBuild,
          dependenciesBuild: dependenciesBuild,
        },
        settings,
      );

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'baseBuild', 'dependenciesBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));

    it('Throws an error when no build is supplied', sinonTest(async () => {
      await assert.rejectsWith(
        startAnalysis(api, { build: undefined } as any, settings),
        new BindingsError('The required `build` JAR file was not supplied', BindingsErrorCode.BUILD_MISSING),
      );
    }));

    it('Throws an error when no settings are supplied', sinonTest(async () => {
      await assert.rejectsWith(
        startAnalysis(api, { build: build }, undefined as any),
        new BindingsError('The required `settings` object was not supplied', BindingsErrorCode.SETTINGS_MISSING),
      );
    }));

    it('Throws an error when the settings are invalid', sinonTest(async () => {
      // Infinite cycle object to throw an error for JSON.stringify
      const obj: { a?: Object } = {};
      obj.a = { b: obj };

      const expectedError = new RegExp(BindingsErrorCode.SETTINGS_INVALID);

      await assert.rejectsWith(
        startAnalysis(api, { build: build }, obj as any), expectedError,
      );
    }));

    it('Handles the allowUnauthorizedHttps option correctly', sinonTest(async (sinon) => {
      const post = sinon.stub(dependencies.request, 'post').resolves();
      const headers = { someKey: 'someValue' };
      const formData = {
        getHeaders: () => headers,
        append: () => undefined,
      };
      sinon.stub(dependencies, 'FormData').returns(formData);
      await startAnalysis(api, { build: build }, settings, { allowUnauthorizedHttps: true });
      const config = { ...sampleConfig, headers: headers, maxContentLength: 1024 * 1024 * 1024 * 2 };
      assert.calledOnceWith(post, [startUrl, formData, config]);
    }));
  });

  describe('getAnalysisResults', () => {
    const resultUrl = `${api}/analysis/ABCD-1234`;

    it('Returns all results from the target analysis', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get');

      get.withArgs(resultUrl).resolves({
        cursor: 1234,
        results: [{ testId: '12-34-56' }, { testId: '34-56-78' }],
        status: { status: 'COMPLETED' },
      });
      assert.notOtherwiseCalled(get, 'get');

      const actualResponse = await getAnalysisResults(api, 'ABCD-1234');
      const expectedResponse = {
        cursor: 1234,
        results: [{ testId: '12-34-56' }, { testId: '34-56-78' }],
        status: { status: 'COMPLETED' },
      };

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));

    it('Returns results from the target analysis using a cursor', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get');
      const cursor = 1234;

      get.withArgs(resultUrl).resolves({
        cursor: 5678,
        results: [{ testId: '34-56-78' }],
        status: { status: 'COMPLETED' },
      });
      assert.notOtherwiseCalled(get, 'get');

      const actualResponse = await getAnalysisResults(api, 'ABCD-1234', cursor);
      const expectedResults = {
        cursor: 5678,
        results: [{ testId: '34-56-78' }],
        status: { status: 'COMPLETED' },
      };

      assert.deepStrictEqual(actualResponse, expectedResults);
    }));

    it('Handles the allowUnauthorizedHttps option correctly', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get').resolves();
      await getAnalysisResults(api, 'ABCD-1234', undefined, { allowUnauthorizedHttps: true });
      const config = { ...sampleConfig, params: { cursor: undefined }};
      assert.calledOnceWith(get, [resultUrl, config]);
    }));
  });

  describe('cancelAnalysis', () => {
    const cancelUrl = `${api}/analysis/ABCD-1234/cancel`;

    it('Cancels the target analysis', sinonTest(async (sinon) => {
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(cancelUrl).resolves({
        message: 'Analysis successfully canceled',
        status: { status: 'STOPPING' },
      });
      assert.notOtherwiseCalled(post, 'post');

      const actualResponse = await cancelAnalysis(api, 'ABCD-1234');
      const expectedResponse = {
        message: 'Analysis successfully canceled',
        status: { status: 'STOPPING' },
      };

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));

    it('Handles the allowUnauthorizedHttps option correctly', sinonTest(async (sinon) => {
      const post = sinon.stub(dependencies.request, 'post').resolves();
      await cancelAnalysis(api, 'ABCD-1234', { allowUnauthorizedHttps: true });
      assert.calledOnceWith(post, [cancelUrl, undefined, sampleConfig]);
    }));
  });

  describe('getAnalysisStatus', () => {
    const statusUrl = `${api}/analysis/ABCD-1234/status`;

    it('Gets the target analysis status', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get');

      get.withArgs(statusUrl).resolves({ status: { status: 'RUNNING' }});
      assert.notOtherwiseCalled(get, 'get');

      const actualResponse = await getAnalysisStatus(api, 'ABCD-1234');
      const expectedResponse = { status: { status: 'RUNNING' }};

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));

    it('Handles the allowUnauthorizedHttps option correctly', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get').resolves();
      await getAnalysisStatus(api, 'ABCD-1234', { allowUnauthorizedHttps: true });
      assert.calledOnceWith(get, [statusUrl, sampleConfig]);
    }));
  });
});
