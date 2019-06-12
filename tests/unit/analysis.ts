// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { clone } from 'lodash';

import assert from '../../src/utils/assertExtra';
import sinonTestFactory from '../../src/utils/sinonTest';

import Analysis, { components } from '../../src/analysis';
import { AnalysisError, AnalysisErrorCodes } from '../../src/errors';
import { AnalysisStatuses } from '../../src/types/types';

const sinonTest = sinonTestFactory();
const sinonTestWithTimers = sinonTestFactory({ useFakeTimers: false });

const apiUrl = 'https://dummy-url.com';
const analysisId = 'analysis-id-12345';
const settings = {};
const build = Buffer.alloc(0);
const dependenciesBuild = Buffer.alloc(0);
const baseBuild = Buffer.alloc(0);
const files = { build: build };
const sampleResult = {
  testId: 'id',
  testName: 'name',
  testedFunction: 'com.diffblue.javademo.TicTacToe.checkTicTacToePosition',
  sourceFilePath: '/path',
  testBody: 'body',
  imports: ['import'],
  staticImports: ['static import'],
  classAnnotations: ['class annotation'],
  tags: ['tag'],
  phaseGenerated: 'phase',
  createdTime: 'created',
};
const sampleBindingOptions = { allowUnauthorizedHttps: true };

describe('analysis', () => {
  describe('Analysis object', () => {
    describe('instantiation', () => {
      it('Can be instantiated', sinonTest(async (sinon) => {
        const analysis = new Analysis(apiUrl);
        assert.strictEqual(analysis.status, undefined);
        assert.strictEqual(analysis.apiUrl, apiUrl);
      }));

      it('Can be instantiated with bindings options', sinonTest(async (sinon) => {
        const analysis = new Analysis(apiUrl, sampleBindingOptions);
        assert.strictEqual(analysis.status, undefined);
        assert.strictEqual(analysis.apiUrl, apiUrl);
        assert.strictEqual(analysis.bindingsOptions, sampleBindingOptions);
      }));
    });

    describe('getApiVersion', () => {
      const versionResponse = { version: '1.2.3' };

      it('Can get the api version', sinonTest(async (sinon) => {
        const getApiVersion = sinon.stub(components, 'getApiVersion').resolves(versionResponse);
        const baseAnalysis = new Analysis(apiUrl);
        const analysis = clone(baseAnalysis);
        const returnValue = await analysis.getApiVersion();
        const changes = { apiVersion: returnValue.version };
        assert.deepStrictEqual(returnValue, versionResponse);
        assert.calledOnceWith(getApiVersion, [apiUrl, {}]);
        assert.changedProperties(baseAnalysis, analysis, changes);
      }));

      it('Can pass through bindings options', sinonTest(async (sinon) => {
        const getApiVersion = sinon.stub(components, 'getApiVersion').resolves(versionResponse);
        const analysis = new Analysis(apiUrl, sampleBindingOptions);
        await analysis.getApiVersion();
        assert.calledOnceWith(getApiVersion, [apiUrl, sampleBindingOptions]);
      }));
    });

    describe('run', () => {
      const startResponse = { id: analysisId, phases: {}};
      const responseStatus = { status: AnalysisStatuses.CANCELED, progress: { completed: 10, total: 20 }};
      const resultsResponse = {
        status: responseStatus,
        cursor: 12345,
        results: [sampleResult],
      };

      it('Can run an analysis', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const baseAnalysis = new Analysis(apiUrl);
        const analysis = clone(baseAnalysis);
        const returnValue = await analysis.run(files, settings, { pollingInterval: 0.0001 });
        const changes = {
          analysisId: analysisId,
          settings: settings,
          status: AnalysisStatuses.CANCELED,
          phases: {},
          pollDelay: undefined,
          cursor: resultsResponse.cursor,
          progress: resultsResponse.status.progress,
          results: resultsResponse.results,
          pollingStopped: false,
          error: undefined,
        };
        assert.deepStrictEqual(returnValue, resultsResponse.results);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.changedProperties(baseAnalysis, analysis, changes);
      }));

      it('Can run an analysis without options or settings', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const baseAnalysis = new Analysis(apiUrl);
        const analysis = clone(baseAnalysis);
        setImmediate(() => analysis.pollDelay!.cancel());  // tslint:disable-line:no-non-null-assertion
        const returnValue = await analysis.run(files);
        const changes = {
          analysisId: analysisId,
          settings: settings,
          status: AnalysisStatuses.CANCELED,
          phases: {},
          pollDelay: undefined,
          cursor: resultsResponse.cursor,
          progress: resultsResponse.status.progress,
          results: resultsResponse.results,
          pollingStopped: false,
          error: undefined,
        };
        assert.deepStrictEqual(returnValue, resultsResponse.results);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.changedProperties(baseAnalysis, analysis, changes);
      }));

      it('Can run an analysis and write test files', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const analysis = new Analysis(apiUrl);
        const writeTests = sinon.stub(analysis, 'writeTests');
        const options = { pollingInterval: 0.0001, outputTests: '/test/path' };
        await analysis.run(files, settings, options);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.calledOnceWith(writeTests, ['/test/path', undefined]);
      }));

      it('Can run an analysis and write test files with concurrency option', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const analysis = new Analysis(apiUrl);
        const writeTests = sinon.stub(analysis, 'writeTests');
        const options = { pollingInterval: 0.0001, outputTests: '/test/path', writingConcurrency: 1 };
        await analysis.run(files, settings, options);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.calledOnceWith(writeTests, ['/test/path', { concurrency: 1 }]);
      }));

      it('Can pass new result groups to onResults callback when polling', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const otherResult = {
          ...sampleResult,
          testedFunction: 'com.diffblue.javademo.OtherClass.otherFunction',
          sourceFilePath: '/other/path',
        };
        const response = {
          ...resultsResponse,
          results: [sampleResult, otherResult],
        };
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(response);
        const onResults = sinon.spy();
        const analysis = new Analysis(apiUrl);
        await analysis.run(files, settings, { pollingInterval: 0.0001, onResults: onResults });
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.calledWith(
          onResults,
          [
            [[sampleResult], 'TicTacToeTest.java'],
            [[otherResult], 'OtherClassTest.java'],
          ],
        );
      }));

      it('Does not call the onResults callback when polling if no new results', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const response = {
          ...resultsResponse,
          results: [],
        };
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(response);
        const onResults = sinon.spy();
        const analysis = new Analysis(apiUrl);
        await analysis.run(files, settings, { pollingInterval: 0.0001, onResults: onResults });
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.notCalled(onResults);
      }));

      it('Calls the onError callback if provided, rather than rejecting', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const analysis = new Analysis(apiUrl);
        const writeTestsError = new Error('writeTests rejected');
        const writeTests = sinon.stub(analysis, 'writeTests').rejects(writeTestsError);
        const onError = sinon.spy();
        const options = { pollingInterval: 0.0001, outputTests: '/test/path', onError: onError };
        const returnValue = await analysis.run(files, settings, options);
        assert.deepStrictEqual(returnValue, resultsResponse.results);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.calledOnceWith(writeTests, ['/test/path', undefined]);
        assert.calledOnceWith(onError, [writeTestsError]);
      }));

      it('Rejects if analysis errors, and does not write test files', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const responseStatus = { status: AnalysisStatuses.ERRORED, progress: { completed: 10, total: 20 }};
        const response = {
          ...resultsResponse,
          status: responseStatus,
        };
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(response);
        const analysis = new Analysis(apiUrl);
        const writeTests = sinon.stub(analysis, 'writeTests');
        const options = { pollingInterval: 0.0001, outputTests: '/test/path' };
        await assert.rejects(
          async () => analysis.run(files, settings, options),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.RUN_ERRORED;
          },
        );
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.notCalled(writeTests);
      }));

      it('Calling forceStop stops polling (after polling occurs)', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults');
        const responseStatus = { status: AnalysisStatuses.RUNNING, progress: { completed: 10, total: 20 }};
        const response = {
          ...resultsResponse,
          status: responseStatus,
        };
        getAnalysisResults.resolves({ ...response, results: [] });
        getAnalysisResults.onFirstCall().resolves(response);
        const baseAnalysis = new Analysis(apiUrl);
        const analysis = clone(baseAnalysis);
        setTimeout(() => analysis.forceStop(), 10);
        const returnValue = await analysis.run(files, settings, { pollingInterval: 0.0001 });
        assert.deepStrictEqual(returnValue, resultsResponse.results);
        assert.strictEqual(analysis.status, AnalysisStatuses.RUNNING);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        sinon.assert.calledWith(getAnalysisResults, apiUrl, analysisId, undefined, {});
      }));

      it('Calling forceStop stops polling (before polling occurs)', sinonTestWithTimers(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const responseStatus = { status: AnalysisStatuses.RUNNING, progress: { completed: 10, total: 20 }};
        const response = {
          ...resultsResponse,
          status: responseStatus,
        };
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(response);
        const baseAnalysis = new Analysis(apiUrl);
        const analysis = clone(baseAnalysis);
        setImmediate(() => analysis.forceStop());
        const returnValue = await analysis.run(files, settings, { pollingInterval: 10 });
        assert.deepStrictEqual(returnValue, []);
        assert.strictEqual(analysis.status, AnalysisStatuses.QUEUED);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.notCalled(getAnalysisResults);
      }));
    });

    describe('writeTests', () => {
      it('Can write tests to files', sinonTest(async (sinon) => {
        const analysis = new Analysis(apiUrl);
        analysis.results = [sampleResult];
        const sampleResultFilePath = '/test/path/TicTacToeTest.java';
        const expectedReturn = [sampleResultFilePath];
        const writeTests = sinon.stub(components, 'writeTests').resolves(expectedReturn);
        const returnValue = await analysis.writeTests('/test/path');
        assert.deepStrictEqual(returnValue, expectedReturn);
        assert.calledOnceWith(writeTests, ['/test/path', analysis.results, undefined]);
      }));

      it('Can write tests to files with options', sinonTest(async (sinon) => {
        const analysis = new Analysis(apiUrl);
        analysis.results = [sampleResult];
        const sampleResultFilePath = '/test/path/TicTacToeTest.java';
        const expectedReturn = [sampleResultFilePath];
        const writeTests = sinon.stub(components, 'writeTests').resolves(expectedReturn);
        const returnValue = await analysis.writeTests('/test/path', { concurrency: 1 });
        assert.deepStrictEqual(returnValue, expectedReturn);
        assert.calledOnceWith(writeTests, ['/test/path', analysis.results, { concurrency: 1 }]);
      }));

      it('Rejects if test writing method rejects', sinonTest(async (sinon) => {
        const writeTestsError = new Error('writeTests failed');
        sinon.stub(components, 'writeTests').rejects(writeTestsError);
        const analysis = new Analysis(apiUrl);
        analysis.results = [sampleResult];
        await assert.rejects(async () => analysis.writeTests('/test/path'), writeTestsError);
      }));
    });

    describe('start', () => {
      const startResponse = { id: analysisId, phases: {}};

      it('Can start an analysis', sinonTest(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const baseAnalysis = new Analysis(apiUrl);
        const analysis = clone(baseAnalysis);
        const returnValue = await analysis.start(files);
        const changes = {
          analysisId: returnValue.id,
          settings: settings,
          status: AnalysisStatuses.QUEUED,
          phases: returnValue.phases,
        };
        assert.deepStrictEqual(returnValue, startResponse);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, {}]);
        assert.changedProperties(baseAnalysis, analysis, changes);
      }));

      it('Can start an analysis with all arguments', sinonTest(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const baseAnalysis = new Analysis(apiUrl);
        const analysis = clone(baseAnalysis);
        const allFiles = { build: build, dependenciesBuild: dependenciesBuild, baseBuild: baseBuild };
        const returnValue = await analysis.start(allFiles, settings);
        const changes = {
          analysisId: returnValue.id,
          settings: settings,
          status: AnalysisStatuses.QUEUED,
          phases: returnValue.phases,
        };
        assert.calledOnceWith(startAnalysis, [apiUrl, allFiles, settings, {}]);
        assert.changedProperties(baseAnalysis, analysis, changes);
      }));

      it('Can pass through bindings options', sinonTest(async (sinon) => {
        const startAnalysis = sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const analysis = new Analysis(apiUrl, sampleBindingOptions);
        await analysis.start(files);
        assert.calledOnceWith(startAnalysis, [apiUrl, files, {}, sampleBindingOptions]);
      }));

      it('Fails to start an analysis, if api method throws', sinonTest(async (sinon) => {
        const startError = new Error('start api call failed');
        sinon.stub(components, 'startAnalysis').throws(startError);
        const baseAnalysis = new Analysis(apiUrl);
        const analysis = clone(baseAnalysis);
        await assert.rejects(async () => analysis.start(files, settings), startError);
        assert.changedProperties(baseAnalysis, analysis, {});
      }));

      it('Fails to start an analysis, if already started', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const analysis = new Analysis(apiUrl);
        await analysis.start(files, settings);
        assert.strictEqual(analysis.status, AnalysisStatuses.QUEUED);
        await assert.rejects(
          async () => analysis.start(files, settings),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.ALREADY_STARTED;
          },
        );
      }));

      it('Fails to start an analysis, if already canceled', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const cancelAnalysis = sinon.stub(components, 'cancelAnalysis');
        const cancelStatus = { status: AnalysisStatuses.CANCELED, progress: { completed: 10, total: 20 }};
        const cancelMessage = 'Analysis cancelled successfully';
        const cancelResponse = { message: cancelMessage, status: cancelStatus };
        cancelAnalysis.resolves(cancelResponse);
        const analysis = new Analysis(apiUrl);
        await analysis.start(files, settings);
        await analysis.cancel();
        assert.strictEqual(analysis.status, AnalysisStatuses.CANCELED);
        await assert.rejects(
          async () => analysis.start(files, settings),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.ALREADY_STARTED;
          },
        );
      }));
    });

    describe('cancel', () => {
      const startResponse = { id: analysisId, phases: {}};
      const cancelStatus = { status: AnalysisStatuses.CANCELED, progress: { completed: 10, total: 20 }};
      const cancelMessage = 'Analysis cancelled successfully';
      const cancelResponse = { message: cancelMessage, status: cancelStatus };

      it('Can cancel an analysis', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const cancelAnalysis = sinon.stub(components, 'cancelAnalysis').resolves(cancelResponse);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const canceledAnalysis = clone(startedAnalysis);
        const returnValue = await canceledAnalysis.cancel();
        const changes = {
          status: returnValue.status.status,
          progress: returnValue.status.progress,
          error: undefined,
        };
        assert.deepStrictEqual(returnValue, cancelResponse);
        assert.calledOnceWith(cancelAnalysis, [apiUrl, analysisId, {}]);
        assert.changedProperties(startedAnalysis, canceledAnalysis, changes);
      }));

      it('Can pass through bindings options', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const cancelAnalysis = sinon.stub(components, 'cancelAnalysis').resolves(cancelResponse);
        const analysis = new Analysis(apiUrl, sampleBindingOptions);
        await analysis.start(files, settings);
        await analysis.cancel();
        assert.calledOnceWith(cancelAnalysis, [apiUrl, analysisId, sampleBindingOptions]);
      }));

      it('Can attempt to cancel an analysis if the analysis is ended', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const cancelAnalysis = sinon.stub(components, 'cancelAnalysis').resolves(cancelResponse);
        const analysis = new Analysis(apiUrl);
        await analysis.start(files, settings);
        analysis.status = AnalysisStatuses.COMPLETED;
        const returnValue = await analysis.cancel();
        assert.deepStrictEqual(returnValue, cancelResponse);
        assert.calledOnceWith(cancelAnalysis, [apiUrl, analysisId, {}]);
      }));

      it('Fails to cancel an analysis, if api method throws', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const cancelError = new Error('cancel api call failed');
        sinon.stub(components, 'cancelAnalysis').throws(cancelError);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const analysis = clone(startedAnalysis);
        await assert.rejects(async () => analysis.cancel(), cancelError);
        assert.changedProperties(startedAnalysis, analysis, {});
      }));

      it('Fails to cancel an analysis, if not started', sinonTest(async (sinon) => {
        const analysis = new Analysis(apiUrl);
        assert.strictEqual(analysis.status, undefined);
        await assert.rejects(
          async () => analysis.cancel(),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_STARTED;
          },
        );
      }));

      it('Fails to cancel an analysis, if id not set', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const analysis = new Analysis(apiUrl);
        await analysis.start(files, settings);
        analysis.analysisId = '';
        await assert.rejects(
          async () => analysis.cancel(),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NO_ID;
          },
        );
      }));
    });

    describe('getStatus', () => {
      const startResponse = { id: analysisId, phases: {}};
      const statusResponse = { status: AnalysisStatuses.COMPLETED, progress: { completed: 100, total: 100 }};

      it('Can get the status of an analysis', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisStatus = sinon.stub(components, 'getAnalysisStatus').resolves(statusResponse);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const analysis = clone(startedAnalysis);
        const returnValue = await analysis.getStatus();
        const changes = {
          status: returnValue.status,
          progress: returnValue.progress,
          error: undefined,
        };
        assert.deepStrictEqual(returnValue, statusResponse);
        assert.calledOnceWith(getAnalysisStatus, [apiUrl, analysisId, {}]);
        assert.changedProperties(startedAnalysis, analysis, changes);
      }));

      it('Can get the status of an errored analysis', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const response = {
          ...statusResponse,
          status: AnalysisStatuses.ERRORED,
          message: { code: 'analysis-not-found', message: 'Analysis not found' },
        };
        const getAnalysisStatus = sinon.stub(components, 'getAnalysisStatus').resolves(response);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const analysis = clone(startedAnalysis);
        const returnValue = await analysis.getStatus();
        const changes = {
          status: returnValue.status,
          progress: returnValue.progress,
          error: returnValue.message,
        };
        assert.deepStrictEqual(returnValue, response);
        assert.calledOnceWith(getAnalysisStatus, [apiUrl, analysisId, {}]);
        assert.changedProperties(startedAnalysis, analysis, changes);
      }));

      it('Can pass through bindings options', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisStatus = sinon.stub(components, 'getAnalysisStatus').resolves(statusResponse);
        const analysis = new Analysis(apiUrl, sampleBindingOptions);
        await analysis.start(files);
        await analysis.getStatus();
        assert.calledOnceWith(getAnalysisStatus, [apiUrl, analysisId, sampleBindingOptions]);
      }));

      it('Can get status if the analysis is ended', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisStatus = sinon.stub(components, 'getAnalysisStatus').resolves(statusResponse);
        const analysis = new Analysis(apiUrl);
        await analysis.start(files, settings);
        analysis.status = AnalysisStatuses.COMPLETED;
        const returnValue = await analysis.getStatus();
        assert.deepStrictEqual(returnValue, statusResponse);
        assert.calledOnceWith(getAnalysisStatus, [apiUrl, analysisId, {}]);
      }));

      it('Fails to get the status of an analysis, if api method throws', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const statusError = new Error('get status api call failed');
        sinon.stub(components, 'getAnalysisStatus').throws(statusError);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const analysis = clone(startedAnalysis);
        await assert.rejects(async () => analysis.getStatus(), statusError);
        assert.changedProperties(startedAnalysis, analysis, {});
      }));

      it('Fails to get the status of an analysis, if not started', sinonTest(async (sinon) => {
        const analysis = new Analysis(apiUrl);
        assert.strictEqual(analysis.status, undefined);
        await assert.rejects(
          async () => analysis.getStatus(),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_STARTED;
          },
        );
      }));

      it('Fails to get the status an analysis, if id not set', sinonTest(async (sinon) => {
        const analysis = new Analysis(apiUrl);
        const startAnalysis = sinon.stub(components, 'startAnalysis');
        startAnalysis.resolves({ id: analysisId, phases: {}});
        await analysis.start(files, settings);
        analysis.analysisId = '';
        await assert.rejects(
          async () => analysis.getStatus(),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NO_ID;
          },
        );
      }));
    });

    describe('getResults', () => {
      const startResponse = { id: analysisId, phases: {}};
      const responseStatus = { status: AnalysisStatuses.RUNNING, progress: { completed: 10, total: 20 }};
      const resultsResponse = {
        status: responseStatus,
        cursor: 12345,
        results: [sampleResult],
      };

      it('Can get the paginated results of an analysis', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const startingCursor = 98765;
        startedAnalysis.cursor = startingCursor;
        const extantResult = clone(sampleResult);
        extantResult.testId = 'extant-result';
        startedAnalysis.results = [extantResult];
        const analysis = clone(startedAnalysis);
        const returnValue = await analysis.getResults();
        const changes = {
          status: returnValue.status.status,
          progress: returnValue.status.progress,
          error: undefined,
          results: [...startedAnalysis.results, ...returnValue.results],
          cursor: returnValue.cursor,
        };
        assert.deepStrictEqual(returnValue, resultsResponse);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, startedAnalysis.cursor, {}]);
        assert.changedProperties(startedAnalysis, analysis, changes);
      }));

      it('Can get the full results of an analysis', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const extantResult = clone(sampleResult);
        extantResult.testId = 'overwritten';
        startedAnalysis.results = [extantResult];
        const analysis = clone(startedAnalysis);
        const returnValue = await analysis.getResults(false);
        const changes = {
          status: returnValue.status.status,
          progress: returnValue.status.progress,
          error: undefined,
          results: returnValue.results,
          cursor: returnValue.cursor,
        };
        assert.deepStrictEqual(returnValue, resultsResponse);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.changedProperties(startedAnalysis, analysis, changes);
      }));

      it('Can pass through bindings options', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const analysis = new Analysis(apiUrl, sampleBindingOptions);
        await analysis.start(files);
        await analysis.getResults();
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, sampleBindingOptions]);
      }));

      it('Can get the full results of an analysis', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const extantResult = clone(sampleResult);
        extantResult.testId = 'overwritten';
        startedAnalysis.results = [extantResult];
        const analysis = clone(startedAnalysis);
        const returnValue = await analysis.getResults(false);
        const changes = {
          status: returnValue.status.status,
          progress: returnValue.status.progress,
          error: undefined,
          results: returnValue.results,
          cursor: returnValue.cursor,
        };
        assert.deepStrictEqual(returnValue, resultsResponse);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
        assert.changedProperties(startedAnalysis, analysis, changes);
      }));

      it('Can get results if the analysis is ended', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const getAnalysisResults = sinon.stub(components, 'getAnalysisResults').resolves(resultsResponse);
        const analysis = new Analysis(apiUrl);
        await analysis.start(files, settings);
        analysis.status = AnalysisStatuses.COMPLETED;
        const returnValue = await analysis.getResults(false);
        assert.deepStrictEqual(returnValue, resultsResponse);
        assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined, {}]);
      }));

      it('Fails to get the results of an analysis, if api method throws', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const resultsError = new Error('results api call failed');
        sinon.stub(components, 'getAnalysisResults').throws(resultsError);
        const startedAnalysis = new Analysis(apiUrl);
        await startedAnalysis.start(files, settings);
        const analysis = clone(startedAnalysis);
        await assert.rejects(async () => analysis.getResults(), resultsError);
        assert.changedProperties(startedAnalysis, analysis, {});
      }));

      it('Fails to get the results of an analysis, if not started', sinonTest(async (sinon) => {
        const analysis = new Analysis(apiUrl);
        assert.strictEqual(analysis.status, undefined);
        await assert.rejects(
          async () => analysis.getResults(),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_STARTED;
          },
        );
      }));

      it('Fails to get the results an analysis, if id not set', sinonTest(async (sinon) => {
        sinon.stub(components, 'startAnalysis').resolves(startResponse);
        const analysis = new Analysis(apiUrl);
        await analysis.start(files, settings);
        analysis.analysisId = '';
        await assert.rejects(
          async () => analysis.getResults(),
          (err: Error) => {
            return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NO_ID;
          },
        );
      }));
    });

    describe('Lifecycle methods', () => {
      it('Knows if its status is not started', () => {
        const analysis = new Analysis(apiUrl);
        assert.strictEqual(analysis.isNotStarted(), true);
      });

      it('Knows if its status is not not started', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.RUNNING;
        assert.strictEqual(analysis.isNotStarted(), false);
      });

      it('Knows if its status is queued', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.QUEUED;
        assert.strictEqual(analysis.isQueued(), true);
      });

      it('Knows if its status is not queued', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.COMPLETED;
        assert.strictEqual(analysis.isQueued(), false);
      });


      it('Knows if its status is running', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.RUNNING;
        assert.strictEqual(analysis.isRunning(), true);
      });

      it('Knows if its status is not running', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.COMPLETED;
        assert.strictEqual(analysis.isRunning(), false);
      });

      it('Knows if its status is canceled', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.CANCELED;
        assert.strictEqual(analysis.isCanceled(), true);
      });

      it('Knows if its status is not canceled', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.ERRORED;
        assert.strictEqual(analysis.isCanceled(), false);
      });

      it('Knows if its status is errored', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.ERRORED;
        assert.strictEqual(analysis.isErrored(), true);
      });

      it('Knows if its status is not errored', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.COMPLETED;
        assert.strictEqual(analysis.isErrored(), false);
      });

      it('Knows if its status is completed', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.COMPLETED;
        assert.strictEqual(analysis.isCompleted(), true);
      });

      it('Knows if its status is not completed', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.RUNNING;
        assert.strictEqual(analysis.isCompleted(), false);
      });

      it('Knows if it has started', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.RUNNING;
        assert.strictEqual(analysis.isStarted(), true);
      });

      it('Knows if it has not started', () => {
        const analysis = new Analysis(apiUrl);
        assert.strictEqual(analysis.isStarted(), false);
      });

      it('Knows if it has ended', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.CANCELED;
        assert.strictEqual(analysis.isEnded(), true);
      });

      it('Knows if it has not ended', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.RUNNING;
        assert.strictEqual(analysis.isEnded(), false);
      });

      it('Knows if it has not ended if status is not set', () => {
        const analysis = new Analysis(apiUrl);
        assert.strictEqual(analysis.isEnded(), false);
      });

      it('Knows if it is in progress', () => {
        const analysis = new Analysis(apiUrl);
        analysis.status = AnalysisStatuses.QUEUED;
        assert.strictEqual(analysis.isInProgress(), true);
        analysis.status = AnalysisStatuses.RUNNING;
        assert.strictEqual(analysis.isInProgress(), true);
      });

      it('Knows if it is not in progress', () => {
        const analysis = new Analysis(apiUrl);
        assert.strictEqual(analysis.isInProgress(), false);
        analysis.status = AnalysisStatuses.ERRORED;
        assert.strictEqual(analysis.isInProgress(), false);
      });
    });
  });
});
