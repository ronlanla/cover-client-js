// Copyright 2019 Diffblue Limited. All Rights Reserved.

import {
  cancelAnalysis,
  dependencies,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  startAnalysis,
} from '../../../src/bindings';
import { BindingsError, BindingsErrorCodes } from '../../../src/errors';
import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

describe('api/bindings', () => {
  const api = 'http://localhost/api';

  describe('getApiVersion', () => {
    it('Returns the current version of the API', sinonTest(async (sinon) => {
      const versionUrl = `${api}/version`;
      const get = sinon.stub(dependencies.request, 'get');

      get.withArgs(versionUrl).resolves({ version: '1.0.1' });
      assert.notOtherwiseCalled(get, 'get');

      const actualVersion = await getApiVersion(api);
      const expectedVersion = { version: '1.0.1' };

      assert.deepStrictEqual(actualVersion, expectedVersion);
    }));
  });

  describe('startAnalysis', () => {
    const build = Buffer.from('foo');
    const baseBuild = Buffer.from('bar');
    const dependenciesBuild = Buffer.from('roh');
    const startUrl = `${api}/analysis`;
    const settings = {
      ignoreDefaults: true,
      phases: {},
      webhooks: {},
    };

    it('Starts an analysis then returns the id and phases', sinonTest(async (sinon) => {
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(startUrl).resolves({ id: '1234-ABCD', phases: settings.phases });
      assert.notOtherwiseCalled(post, 'post');

      const actualResponse = await startAnalysis(api, settings, { build: build });
      const expectedResponse = { id: '1234-ABCD', phases: settings.phases };

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));

    it('Appends a base build file to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(startUrl).resolves({ id: '1234-ABCD', phases: settings.phases });
      assert.notOtherwiseCalled(post, 'post');

      await startAnalysis(api, settings, { build: build, baseBuild: baseBuild });

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'baseBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));

    it('Appends a dependencies build file to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(startUrl).resolves({ id: '1234-ABCD', phases: settings.phases });
      assert.notOtherwiseCalled(post, 'post');

      await startAnalysis(api, settings, { build: build, dependenciesBuild: dependenciesBuild });

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'dependenciesBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));

    it('Appends all files to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(startUrl).resolves({ id: '1234-ABCD', phases: settings.phases });
      assert.notOtherwiseCalled(post, 'post');

      await startAnalysis(
        api,
        settings,
        {
          build: build,
          baseBuild: baseBuild,
          dependenciesBuild: dependenciesBuild,
        },
      );

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'baseBuild', 'dependenciesBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));

    it('Throws an error when no build is supplied', sinonTest(async () => {
      await assert.rejectsWith(
        // tslint:disable-next-line:no-any
        startAnalysis(api, settings, { build: undefined } as any),
        new BindingsError('The required `build` JAR file was not supplied', BindingsErrorCodes.BUILD_MISSING),
      );
    }));

    it('Throws an error when no settings are supplied', sinonTest(async () => {
      await assert.rejectsWith(
        // tslint:disable-next-line:no-any
        startAnalysis(api, undefined as any, { build: build }),
        new BindingsError('The required `settings` JSON file was not supplied', BindingsErrorCodes.SETTINGS_MISSING),
      );
    }));

    it('Throws an error when the settings are invalid', sinonTest(async () => {
      /** Infinite cycle object to throw an error for JSON.stringify */
      const obj: { a?: Object } = {};
      obj.a = { b: obj };

      await assert.rejectsWith(
        startAnalysis(api, obj as any, { build: build }), // tslint:disable-line:no-any
        new BindingsError(
          'The settings JSON was not valid:\nTypeError: Converting circular structure to JSON',
          BindingsErrorCodes.SETTINGS_INVALID,
        ),
      );
    }));
  });

  describe('getAnalysisResults', () => {
    const resultUrl = `${api}/analysis/ABCD-1234`;

    it('Returns all results from the target analysis', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get');

      get.withArgs(resultUrl).resolves({
        cursor: 1234,
        results: [{ testId: '12-34-56' }, { testId: '34-56-78' }],
        status: {
          status: 'COMPLETED',
          progress: 100,
        },
      });
      assert.notOtherwiseCalled(get, 'get');

      const actualResponse = await getAnalysisResults(api, 'ABCD-1234');
      const expectedResponse = {
        cursor: 1234,
        results: [{ testId: '12-34-56' }, { testId: '34-56-78' }],
        status: {
          status: 'COMPLETED',
          progress: 100,
        },
      };

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));

    it('Returns results from the target analysis using a cursor', sinonTest(async (sinon) => {
      const get = sinon.stub(dependencies.request, 'get');
      const cursor = 1234;

      get.withArgs(resultUrl).resolves({
        cursor: 5678,
        results: [{ testId: '34-56-78' }],
        status: {
          status: 'COMPLETED',
          progress: 100,
        },
      });
      assert.notOtherwiseCalled(get, 'get');

      const actualResponse = await getAnalysisResults(api, 'ABCD-1234', cursor);
      const expectedResults = {
        cursor: 5678,
        results: [{ testId: '34-56-78' }],
        status: {
          status: 'COMPLETED',
          progress: 100,
        },
      };

      assert.deepStrictEqual(actualResponse, expectedResults);
    }));
  });

  describe('cancelAnalysis', () => {
    it('Cancels the targetted analysis', sinonTest(async (sinon) => {
      const cancelUrl = `${api}/analysis/ABCD-1234/cancel`;
      const post = sinon.stub(dependencies.request, 'post');

      post.withArgs(cancelUrl).resolves({
        message: 'Analysis successfully canceled',
        status: {
          status: 'CANCELED',
          progress: 50,
        },
      });
      assert.notOtherwiseCalled(post, 'post');

      const actualResponse = await cancelAnalysis(api, 'ABCD-1234');
      const expectedResponse = {
        message: 'Analysis successfully canceled',
        status: {
          status: 'CANCELED',
          progress: 50,
        },
      };

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));
  });

  describe('getAnalysisStatus', () => {
    it('Cancels the targetted analysis', sinonTest(async (sinon) => {
      const statusUrl = `${api}/analysis/ABCD-1234/status`;
      const get = sinon.stub(dependencies.request, 'get');

      get.withArgs(statusUrl).resolves({ status: { status: 'RUNNING', progress: 75 }});
      assert.notOtherwiseCalled(get, 'get');

      const actualResponse = await getAnalysisStatus(api, 'ABCD-1234');
      const expectedResponse = { status: { status: 'RUNNING', progress: 75 }};

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));
  });
});
