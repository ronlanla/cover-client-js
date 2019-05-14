// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { clone } from 'lodash';

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import Analysis, { components } from '../../../src/analysis';
import { AnalysisError, AnalysisErrorCodes } from '../../../src/errors';
import { AnalysisObjectStatuses, AnalysisStatuses } from '../../../src/types/types';

const sinonTest = sinonTestFactory();

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
  testedFunction: 'func',
  sourceFilePath: './path',
  testBody: 'body',
  imports: ['import'],
  staticImports: ['static import'],
  classAnnotations: ['class annotation'],
  tags: ['tag'],
  phaseGenerated: 'phase',
  createdTime: 'created',
};

describe('src/analysis', () => {
  describe('Analysis object', () => {
    it('Can be instantiated', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      assert.strictEqual(analysis.status, AnalysisObjectStatuses.NOT_STARTED);
    }));

    it('Can get the api version', sinonTest(async (sinon) => {
      const getApiVersion = sinon.stub(components, 'getApiVersion');
      const versionResponse = { version: '1.2.3' };
      getApiVersion.resolves(versionResponse);
      const baseAnalysis = new Analysis(apiUrl);
      const analysis = clone(baseAnalysis);
      const returnValue = await analysis.getApiVersion();
      const changes = { apiVersion: returnValue.version };
      assert.deepStrictEqual(returnValue, versionResponse);
      assert.calledOnceWith(getApiVersion, [apiUrl]);
      assert.changedProperties(baseAnalysis, analysis, changes);
    }));

    it('Can start an analysis', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      const startResponse = { id: analysisId, phases: {}};
      startAnalysis.resolves(startResponse);
      const baseAnalysis = new Analysis(apiUrl);
      const analysis = clone(baseAnalysis);
      const returnValue = await analysis.start(settings, files);
      const changes = {
        analysisId: returnValue.id,
        settings: settings,
        status: AnalysisObjectStatuses.RUNNING,
        phases: returnValue.phases,
      };
      assert.deepStrictEqual(returnValue, startResponse);
      assert.calledOnceWith(startAnalysis, [apiUrl, settings, files]);
      assert.changedProperties(baseAnalysis, analysis, changes);
    }));

    it('Can start an analysis with all arguments', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const baseAnalysis = new Analysis(apiUrl);
      const analysis = clone(baseAnalysis);
      const allFiles = { build: build, dependenciesBuild: dependenciesBuild, baseBuild:baseBuild };
      const returnValue = await analysis.start(settings, allFiles);
      const changes = {
        analysisId: returnValue.id,
        settings: settings,
        status: AnalysisObjectStatuses.RUNNING,
        phases: returnValue.phases,
      };
      assert.calledOnceWith(startAnalysis, [apiUrl, settings, allFiles]);
      assert.changedProperties(baseAnalysis, analysis, changes);
    }));

    it('Fails to start an analysis, if api method throws', sinonTest(async (sinon) => {
      const startError = new Error('start api call failed');
      sinon.stub(components, 'startAnalysis').throws(startError);
      const baseAnalysis = new Analysis(apiUrl);
      const analysis = clone(baseAnalysis);
      await assert.rejects(async () => analysis.start(settings, files), startError);
      assert.changedProperties(baseAnalysis, analysis, {});
    }));

    it('Fails to start an analysis, if already started', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const analysis = new Analysis(apiUrl);
      await analysis.start(settings, files);
      assert.strictEqual(analysis.status, AnalysisObjectStatuses.RUNNING);
      await assert.rejects(
        async () => analysis.start(settings, files),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.ALREADY_STARTED;
        },
      );
    }));

    it('Fails to start an analysis, if already canceled', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const cancelAnalysis = sinon.stub(components, 'cancelAnalysis');
      const cancelStatus = { status: AnalysisStatuses.CANCELED, progress: { completed: 10, total: 20 }};
      const cancelMessage = 'Analysis cancelled successfully';
      const cancelResponse = { message: cancelMessage, status: cancelStatus };
      cancelAnalysis.resolves(cancelResponse);
      const analysis = new Analysis(apiUrl);
      await analysis.start(settings, files);
      await analysis.cancel();
      assert.strictEqual(analysis.status, AnalysisObjectStatuses.CANCELED);
      await assert.rejects(
        async () => analysis.start(settings, files),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.ALREADY_STARTED;
        },
      );
    }));

    it('Can cancel an analysis', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const cancelAnalysis = sinon.stub(components, 'cancelAnalysis');
      const cancelStatus = { status: AnalysisStatuses.CANCELED, progress: { completed: 10, total: 20 }};
      const cancelMessage = 'Analysis cancelled successfully';
      const cancelResponse = { message: cancelMessage, status: cancelStatus };
      cancelAnalysis.resolves(cancelResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(settings, files);
      const canceledAnalysis = clone(startedAnalysis);
      const returnValue = await canceledAnalysis.cancel();
      const changes = {
        status: returnValue.status.status,
        progress: returnValue.status.progress,
        error: undefined,
      };
      assert.deepStrictEqual(returnValue, cancelResponse);
      assert.calledOnceWith(cancelAnalysis, [apiUrl, analysisId]);
      assert.changedProperties(startedAnalysis, canceledAnalysis, changes);
    }));

    it('Fails to cancel an analysis, if api method throws', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const cancelError = new Error('cancel api call failed');
      const cancelAnalysis = sinon.stub(components, 'cancelAnalysis');
      cancelAnalysis.throws(cancelError);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(settings, files);
      const analysis = clone(startedAnalysis);
      await assert.rejects(async () => analysis.cancel(), cancelError);
      assert.changedProperties(startedAnalysis, analysis, {});
    }));

    it('Fails to cancel an analysis, if not started', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      assert.strictEqual(analysis.status, AnalysisObjectStatuses.NOT_STARTED);
      await assert.rejects(
        async () => analysis.cancel(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_RUNNING;
        },
      );
    }));

    it('Fails to cancel an analysis, if already completed', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      analysis.analysisId = analysisId;
      analysis.status = AnalysisObjectStatuses.COMPLETED;
      await assert.rejects(
        async () => analysis.cancel(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_RUNNING;
        },
      );
    }));

    it('Fails to cancel an analysis, if id not set', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      await analysis.start(settings, files);
      analysis.analysisId = '';
      await assert.rejects(
        async () => analysis.cancel(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NO_ID;
        },
      );
    }));

    it('Can get the status of an analysis', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const getAnalysisStatus = sinon.stub(components, 'getAnalysisStatus');
      const statusResponse = { status: AnalysisStatuses.COMPLETED, progress: { completed: 100, total: 100 }};
      getAnalysisStatus.resolves(statusResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(settings, files);
      const analysis = clone(startedAnalysis);
      const returnValue = await analysis.getStatus();
      const changes = {
        status: returnValue.status,
        progress: returnValue.progress,
        error: undefined,
      };
      assert.deepStrictEqual(returnValue, statusResponse);
      assert.calledOnceWith(getAnalysisStatus, [apiUrl, analysisId]);
      assert.changedProperties(startedAnalysis, analysis, changes);
    }));

    it('Can get the status of an errored analysis', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const getAnalysisStatus = sinon.stub(components, 'getAnalysisStatus');
      const statusResponse = {
        status: AnalysisStatuses.ERRORED,
        progress: { completed: 10, total: 20 },
        message: { code: 'analysis-not-found', message: 'Analysis not found' },
      };
      getAnalysisStatus.resolves(statusResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(settings, files);
      const analysis = clone(startedAnalysis);
      const returnValue = await analysis.getStatus();
      const changes = {
        status: returnValue.status,
        progress: returnValue.progress,
        error: returnValue.message,
      };
      assert.deepStrictEqual(returnValue, statusResponse);
      assert.calledOnceWith(getAnalysisStatus, [apiUrl, analysisId]);
      assert.changedProperties(startedAnalysis, analysis, changes);
    }));

    it('Fails to get the status of an analysis, if api method throws', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const statusError = new Error('get status api call failed');
      const getAnalysisStatus = sinon.stub(components, 'getAnalysisStatus');
      getAnalysisStatus.throws(statusError);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(settings, files);
      const analysis = clone(startedAnalysis);
      await assert.rejects(async () => analysis.getStatus(), statusError);
      assert.changedProperties(startedAnalysis, analysis, {});
    }));

    it('Fails to get the status of an analysis, if not started', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      assert.strictEqual(analysis.status, AnalysisObjectStatuses.NOT_STARTED);
      await assert.rejects(
        async () => analysis.getStatus(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_RUNNING;
        },
      );
    }));

    it('Fails to get the status of an analysis, if already completed', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      analysis.analysisId = analysisId;
      analysis.status = AnalysisObjectStatuses.COMPLETED;
      await assert.rejects(
        async () => analysis.getStatus(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_RUNNING;
        },
      );
    }));

    it('Fails to get the status an analysis, if id not set', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      await analysis.start(settings, files);
      analysis.analysisId = '';
      await assert.rejects(
        async () => analysis.getStatus(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NO_ID;
        },
      );
    }));

    it('Can get the paginated results of an analysis', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const getAnalysisResults = sinon.stub(components, 'getAnalysisResults');
      const responseStatus = { status: AnalysisStatuses.RUNNING, progress: { completed: 10, total: 20 }};
      const resultsResponse = {
        status: responseStatus,
        cursor: 12345,
        results: [sampleResult],
      };
      getAnalysisResults.resolves(resultsResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(settings, files);
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
      assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, startedAnalysis.cursor]);
      assert.changedProperties(startedAnalysis, analysis, changes);
    }));

    it('Can get the full results of an analysis', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const getAnalysisResults = sinon.stub(components, 'getAnalysisResults');
      const responseStatus = { status: AnalysisStatuses.RUNNING, progress: { completed: 10, total: 20 }};
      const resultsResponse = {
        status: responseStatus,
        cursor: 12345,
        results: [sampleResult],
      };
      getAnalysisResults.resolves(resultsResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(settings, files);
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
      assert.calledOnceWith(getAnalysisResults, [apiUrl, analysisId, undefined]);
      assert.changedProperties(startedAnalysis, analysis, changes);
    }));

    it('Fails to get the results of an analysis, if api method throws', sinonTest(async (sinon) => {
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      const resultsError = new Error('results api call failed');
      const getAnalysisResults = sinon.stub(components, 'getAnalysisResults');
      getAnalysisResults.throws(resultsError);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(settings, files);
      const analysis = clone(startedAnalysis);
      await assert.rejects(async () => analysis.getResults(), resultsError);
      assert.changedProperties(startedAnalysis, analysis, {});
    }));

    it('Fails to get the results of an analysis, if not started', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      assert.strictEqual(analysis.status, AnalysisObjectStatuses.NOT_STARTED);
      await assert.rejects(
        async () => analysis.getResults(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_RUNNING;
        },
      );
    }));

    it('Fails to get the results of an analysis, if already completed', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      analysis.analysisId = analysisId;
      analysis.status = AnalysisObjectStatuses.COMPLETED;
      await assert.rejects(
        async () => analysis.getResults(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NOT_RUNNING;
        },
      );
    }));

    it('Fails to get the results an analysis, if id not set', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      const startAnalysis = sinon.stub(components, 'startAnalysis');
      startAnalysis.resolves({ id: analysisId, phases: {}});
      await analysis.start(settings, files);
      analysis.analysisId = '';
      await assert.rejects(
        async () => analysis.getResults(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodes.NO_ID;
        },
      );
    }));

    it('Knows if its status is not started', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.NOT_STARTED;
      assert.strictEqual(analysis.isNotStarted(), true);
    });

    it('Knows if its status is not not started', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.RUNNING;
      assert.strictEqual(analysis.isNotStarted(), false);
    });

    it('Knows if its status is running', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.RUNNING;
      assert.strictEqual(analysis.isRunning(), true);
    });

    it('Knows if its status is not running', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.COMPLETED;
      assert.strictEqual(analysis.isRunning(), false);
    });

    it('Knows if its status is canceled', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.CANCELED;
      assert.strictEqual(analysis.isCanceled(), true);
    });

    it('Knows if its status is not canceled', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.ERRORED;
      assert.strictEqual(analysis.isCanceled(), false);
    });

    it('Knows if its status is errored', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.ERRORED;
      assert.strictEqual(analysis.isErrored(), true);
    });

    it('Knows if its status is not errored', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.COMPLETED;
      assert.strictEqual(analysis.isErrored(), false);
    });

    it('Knows if its status is completed', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.COMPLETED;
      assert.strictEqual(analysis.isCompleted(), true);
    });

    it('Knows if its status is not completed', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.RUNNING;
      assert.strictEqual(analysis.isCompleted(), false);
    });

    it('Knows if it has started', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.RUNNING;
      assert.strictEqual(analysis.isStarted(), true);
    });

    it('Knows if it has not started', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.NOT_STARTED;
      assert.strictEqual(analysis.isStarted(), false);
    });

    it('Knows if it has ended', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.CANCELED;
      assert.strictEqual(analysis.isEnded(), true);
    });

    it('Knows if it has not ended', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatuses.RUNNING;
      assert.strictEqual(analysis.isEnded(), false);
    });
  });
});
