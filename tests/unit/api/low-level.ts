// Copyright 2019 Diffblue Limited. All Rights Reserved.

import {
  cancelAnalysis,
  components,
  dependencies,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  startAnalysis,
} from '../../../src/api/low-level';
import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

describe('src/api/low-level', () => {
  const api = 'http://localhost/api';
  const analysisId = 'ABCD-1234';

  describe('getApiVersion', () => {
    it('Returns the current version of the API', sinonTest(async (sinon) => {
      const versionUrl = `${api}/version`;
      const version = sinon.stub(components, 'version');
      const get = sinon.stub(components, 'get');

      version.withArgs(api).returns(versionUrl);
      get.withArgs(versionUrl).resolves({ version: '1.0.1' });

      const actualVersion = await getApiVersion(api);
      const expectedVersion = { version: '1.0.1' };
      assert.deepStrictEqual(actualVersion, expectedVersion);
    }));
  });

  describe('startAnalysis', () => {
    const build = new Buffer('foo');
    const baseBuild = new Buffer('bar');
    const dependenciesBuild = new Buffer('roh');
    const settings = {
      ignoreDefaults: true,
      phases: {},
      webhooks: {},
    };

    it('Starts an analysis then returns the id and phases', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      const post = sinon.stub(components, 'post');

      start.returns(`${api}/analysis`);
      post.resolves({ id: '1234-ABCD', phases: settings.phases });

      const actualResponse = await startAnalysis(api, { build: build, settings: settings });
      const expectedResponse = { id: '1234-ABCD', phases: settings.phases };

      assert.calledOnceWith(start, [api]);
      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));

    it('Appends a base build file to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const start = sinon.stub(components, 'start');
      const post = sinon.stub(components, 'post');

      start.returns(`${api}/analysis`);
      post.resolves({ id: '1234-ABCD', phases: settings.phases });

      await startAnalysis(api, { build: build, settings: settings, baseBuild: baseBuild });

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'baseBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));

    it('Appends a dependencies build file to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const start = sinon.stub(components, 'start');
      const post = sinon.stub(components, 'post');

      start.returns(`${api}/analysis`);
      post.resolves({ id: '1234-ABCD', phases: settings.phases });

      await startAnalysis(api, { build: build, settings: settings, dependenciesBuild: dependenciesBuild });

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'dependenciesBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));

    it('Appends all files to the form before submitting a request', sinonTest(async (sinon) => {
      const append = sinon.stub(dependencies.FormData.prototype, 'append');
      const start = sinon.stub(components, 'start');
      const post = sinon.stub(components, 'post');

      start.returns(`${api}/analysis`);
      post.resolves({ id: '1234-ABCD', phases: settings.phases });

      await startAnalysis(api, {
        build: build,
        settings: settings,
        baseBuild: baseBuild,
        dependenciesBuild: dependenciesBuild,
      });

      const actualFiles = append.args.map((file: string[]) => file[0]);
      const expectedFiles = ['build', 'settings', 'baseBuild', 'dependenciesBuild'];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    }));
  });

  describe('getAnalysisResults', () => {
    it('Returns all results from the target analysis', sinonTest(async (sinon) => {
      const resultUrl = `${api}/analysis${analysisId}`;
      const result = sinon.stub(components, 'result');
      const get = sinon.stub(components, 'get');

      result.withArgs(api, analysisId).returns(resultUrl);
      get.withArgs(resultUrl).resolves({
        cursor: 1234,
        results: [{ testId: '12-34-56' }, { testId: '34-56-78' }],
        status: {
          status: 'COMPLETED',
          progress: 100,
        },
      });

      const actualResponse = await getAnalysisResults(api, analysisId);
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
      const resultUrl = `${api}/analysis${analysisId}`;
      const result = sinon.stub(components, 'result');
      const get = sinon.stub(components, 'get');
      const cursor = 1234;

      result.withArgs(api, analysisId).returns(resultUrl);
      get.withArgs(resultUrl).resolves({
        cursor: 5678,
        results: [{ testId: '34-56-78' }],
        status: {
          status: 'COMPLETED',
          progress: 100,
        },
      });

      const actualResponse = await getAnalysisResults(api, analysisId, cursor);
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
      const cancelUrl = `${api}/analysis${analysisId}/cancel`;
      const cancel = sinon.stub(components, 'cancel');
      const post = sinon.stub(components, 'post');

      cancel.withArgs(api, analysisId).returns(cancelUrl);
      post.withArgs(cancelUrl).resolves({
        message: 'Analysis successfully canceled',
        status: {
          status: 'CANCELED',
          progress: 50,
        },
      });

      const actualResponse = await cancelAnalysis(api, analysisId);
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
      const statusUrl = `${api}/analysis${analysisId}/status`;
      const status = sinon.stub(components, 'status');
      const get = sinon.stub(components, 'get');

      status.withArgs(api, analysisId).returns(statusUrl);
      get.withArgs(statusUrl).resolves({ status: { status: 'RUNNING', progress: 75 }});

      const actualResponse = await getAnalysisStatus(api, analysisId);
      const expectedResponse = { status: { status: 'RUNNING', progress: 75 }};

      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));
  });
});
