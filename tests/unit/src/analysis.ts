// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { clone } from 'lodash';
import { Readable, Writable } from 'readable-stream';

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import Analysis, { components } from '../../../src/analysis';
import { AnalysisError, AnalysisErrorCodeEnum } from '../../../src/errors';
import { AnalysisObjectStatusEnum, AnalysisStatusEnum } from '../../../src/types';

const sinonTest = sinonTestFactory();

const apiUrl = 'https://dummy-url.com';
const analysisId = 'analysis-id-12345';
const buildPath = './build.jar';
const settings = {};
const dependenciesBuildPath = './dependenciesBuild.jar';
const baseBuildPath = './baseBuild.jar';
const sampleResult = {
  'test-id': 'id',
  'test-name': 'name',
  'tested-function': 'func',
  'source-file-path': './path',
  'test-body': 'body',
  imports: ['import'],
  'static-imports': ['static import'],
  'class-annotations': ['class annotation'],
  tags: ['tag'],
  'phase-generated': 'phase',
  'created-time': 'created',
};

/** Create a dummy writable stream for testing */
function createTestWriteable() {
  const writeable = new Writable({ objectMode: true });
  (writeable as any).data = []; // tslint:disable-line:no-any
  writeable._write = (chunk) => {
    (writeable as any).data.push(chunk); // tslint:disable-line:no-any
  };
  return writeable;
}

describe('src/analysis', () => {
  describe('Analysis object', () => {
    it('Can be instantiated', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      assert.strictEqual(analysis.status, AnalysisObjectStatusEnum.NOT_STARTED);
    }));
    it('Can be instantiated with a writable results stream', sinonTest(async (sinon) => {
      const writableStream = new Writable({ objectMode: true });
      const analysis = new Analysis(apiUrl, writableStream);
      assert.strictEqual(analysis.results, writableStream);
    }));
    it('Cannot be instantiated with the wrong results data type', sinonTest(async (sinon) => {
      assert.throws(
        () => new Analysis(apiUrl, new Readable() as unknown as Writable),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.STREAM_NOT_WRITABLE;
        },
      );
    }));
    it('Cannot be instantiated with a non object mode results stream', sinonTest(async (sinon) => {
      const writableStream = new Writable();
      assert.throws(
        () => new Analysis(apiUrl, writableStream),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.STREAM_NOT_OBJECT_MODE;
        },
      );
    }));
    it('Can get the api version', sinonTest(async (sinon) => {
      const version = sinon.stub(components, 'version');
      const versionResponse = { version: '1.2.3' };
      version.resolves(versionResponse);
      const baseAnalysis = new Analysis(apiUrl);
      const analysis = clone(baseAnalysis);
      const returnValue = await analysis.getApiVersion();
      const changes = { apiVersion: returnValue.version };
      assert.deepStrictEqual(returnValue, versionResponse);
      assert.calledOnceWith(version, [apiUrl]);
      assert.changedProperties(baseAnalysis, analysis, changes);
    }));
    it('Can start an analysis', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      const startResponse = { id: analysisId, phases: {}};
      start.resolves(startResponse);
      const baseAnalysis = new Analysis(apiUrl);
      const analysis = clone(baseAnalysis);
      const returnValue = await analysis.start(buildPath, settings);
      const changes = {
        analysisId: returnValue.id,
        buildPath: buildPath,
        settings: settings,
        dependenciesBuildPath: undefined,
        baseBuildPath: undefined,
        status: AnalysisObjectStatusEnum.RUNNING,
        phases: returnValue.phases,
      };
      assert.deepStrictEqual(returnValue, startResponse);
      assert.calledOnceWith(start, [apiUrl, buildPath, settings, undefined, undefined]);
      assert.changedProperties(baseAnalysis, analysis, changes);
    }));
    it('Can start an analysis with all arguments', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const baseAnalysis = new Analysis(apiUrl);
      const analysis = clone(baseAnalysis);
      const returnValue = await analysis.start(buildPath, settings, dependenciesBuildPath, baseBuildPath);
      const changes = {
        analysisId: returnValue.id,
        buildPath: buildPath,
        settings: settings,
        dependenciesBuildPath: dependenciesBuildPath,
        baseBuildPath: baseBuildPath,
        status: AnalysisObjectStatusEnum.RUNNING,
        phases: returnValue.phases,
      };
      assert.calledOnceWith(start, [apiUrl, buildPath, settings, dependenciesBuildPath, baseBuildPath]);
      assert.changedProperties(baseAnalysis, analysis, changes);
    }));
    it('Fails to start an analysis, if api method throws', sinonTest(async (sinon) => {
      const startError = new Error('start api call failed');
      sinon.stub(components, 'start').throws(startError);
      const baseAnalysis = new Analysis(apiUrl);
      const analysis = clone(baseAnalysis);
      await assert.rejects(async () => analysis.start(buildPath, settings), startError);
      assert.changedProperties(baseAnalysis, analysis, {});
    }));
    it('Fails to start an analysis, if already started', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const analysis = new Analysis(apiUrl);
      await analysis.start(buildPath, settings);
      assert.strictEqual(analysis.status, AnalysisObjectStatusEnum.RUNNING);
      await assert.rejects(
        async () => analysis.start(buildPath, settings),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.ALREADY_STARTED;
        },
      );
    }));
    it('Fails to start an analysis, if already canceled', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const analysis = new Analysis(apiUrl);
      await analysis.start(buildPath, settings);
      await analysis.cancel();
      assert.strictEqual(analysis.status, AnalysisObjectStatusEnum.RUNNING);
      await assert.rejects(
        async () => analysis.start(buildPath, settings),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.ALREADY_STARTED;
        },
      );
    }));
    it('Can cancel an analysis', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const cancel = sinon.stub(components, 'cancel');
      const cancelStatus = { status: AnalysisStatusEnum.CANCELED, progress: { completed: 10, total: 20 }};
      const cancelMessage = 'Analysis cancelled successfully';
      const cancelResponse = { message: cancelMessage, status: cancelStatus };
      cancel.resolves(cancelResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(buildPath, settings);
      const canceledAnalysis = clone(startedAnalysis);
      const returnValue = await canceledAnalysis.cancel();
      const changes = {
        status: returnValue.status.status,
        progress: returnValue.status.progress,
        error: undefined,
      };
      assert.deepStrictEqual(returnValue, cancelResponse);
      assert.calledOnceWith(cancel, [apiUrl, analysisId]);
      assert.changedProperties(startedAnalysis, canceledAnalysis, changes);
    }));
    it('Can end the readable stream when canceling an analysis', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const cancel = sinon.stub(components, 'cancel');
      const cancelStatus = { status: AnalysisStatusEnum.CANCELED, progress: { completed: 10, total: 20 }};
      const cancelMessage = 'Analysis cancelled successfully';
      const cancelResponse = { message: cancelMessage, status: cancelStatus };
      cancel.resolves(cancelResponse);
      const writableStream = createTestWriteable();
      const analysis = new Analysis(apiUrl, writableStream);
      await analysis.start(buildPath, settings);
      await analysis.cancel();
      assert.ok((analysis._readable as Readable)._readableState.ended);
      assert.ok((analysis._readable as Readable)._readableState.destroyed);
    }));
    it('Fails to cancel an analysis, if api method throws', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const cancelError = new Error('cancel api call failed');
      const cancel = sinon.stub(components, 'cancel');
      cancel.throws(cancelError);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(buildPath, settings);
      const analysis = clone(startedAnalysis);
      await assert.rejects(async () => analysis.cancel(), cancelError);
      assert.changedProperties(startedAnalysis, analysis, {});
    }));
    it('Fails to cancel an analysis, if not started', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      assert.strictEqual(analysis.status, AnalysisObjectStatusEnum.NOT_STARTED);
      await assert.rejects(
        async () => analysis.cancel(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NOT_RUNNING;
        },
      );
    }));
    it('Fails to cancel an analysis, if already completed', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      analysis.analysisId = analysisId;
      analysis.status = AnalysisObjectStatusEnum.COMPLETED;
      await assert.rejects(
        async () => analysis.cancel(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NOT_RUNNING;
        },
      );
    }));
    it('Fails to cancel an analysis, if id not set', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      await analysis.start(buildPath, settings);
      analysis.analysisId = '';
      await assert.rejects(
        async () => analysis.cancel(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NO_ID;
        },
      );
    }));
    it('Can get the status of an analysis', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const getStatus = sinon.stub(components, 'getStatus');
      const statusResponse = { status: AnalysisStatusEnum.COMPLETED, progress: { completed: 100, total: 100 }};
      getStatus.resolves(statusResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(buildPath, settings);
      const analysis = clone(startedAnalysis);
      const returnValue = await analysis.getStatus();
      const changes = {
        status: returnValue.status,
        progress: returnValue.progress,
        error: undefined,
      };
      assert.deepStrictEqual(returnValue, statusResponse);
      assert.calledOnceWith(getStatus, [apiUrl, analysisId]);
      assert.changedProperties(startedAnalysis, analysis, changes);
    }));
    it('Can get the status of an errored analysis', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const getStatus = sinon.stub(components, 'getStatus');
      const statusResponse = {
        status: AnalysisStatusEnum.ERRORED,
        progress: { completed: 10, total: 20 },
        message: { code: 'analysis-not-found', message: 'Analysis not found' },
      };
      getStatus.resolves(statusResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(buildPath, settings);
      const analysis = clone(startedAnalysis);
      const returnValue = await analysis.getStatus();
      const changes = {
        status: returnValue.status,
        progress: returnValue.progress,
        error: returnValue.message,
      };
      assert.deepStrictEqual(returnValue, statusResponse);
      assert.calledOnceWith(getStatus, [apiUrl, analysisId]);
      assert.changedProperties(startedAnalysis, analysis, changes);
    }));
    it('Fails to get the status of an analysis, if api method throws', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const statusError = new Error('get status api call failed');
      const getStatus = sinon.stub(components, 'getStatus');
      getStatus.throws(statusError);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(buildPath, settings);
      const analysis = clone(startedAnalysis);
      await assert.rejects(async () => analysis.getStatus(), statusError);
      assert.changedProperties(startedAnalysis, analysis, {});
    }));
    it('Fails to get the status of an analysis, if not started', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      assert.strictEqual(analysis.status, AnalysisObjectStatusEnum.NOT_STARTED);
      await assert.rejects(
        async () => analysis.getStatus(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NOT_RUNNING;
        },
      );
    }));
    it('Fails to get the status of an analysis, if already completed', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      analysis.analysisId = analysisId;
      analysis.status = AnalysisObjectStatusEnum.COMPLETED;
      await assert.rejects(
        async () => analysis.getStatus(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NOT_RUNNING;
        },
      );
    }));
    it('Fails to get the status an analysis, if id not set', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      await analysis.start(buildPath, settings);
      analysis.analysisId = '';
      await assert.rejects(
        async () => analysis.getStatus(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NO_ID;
        },
      );
    }));
    it('Can get the paginated results of an analysis', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const results = sinon.stub(components, 'results');
      const responseStatus = { status: AnalysisStatusEnum.RUNNING, progress: { completed: 10, total: 20 }};
      const resultsResponse = {
        status: responseStatus,
        cursor: 'abcdef',
        results: [sampleResult],
      };
      results.resolves(resultsResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(buildPath, settings);
      startedAnalysis.cursor = '123456';
      const extantResult = clone(sampleResult);
      extantResult['test-id'] = 'extant-result';
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
      assert.calledOnceWith(results, [apiUrl, analysisId, startedAnalysis.cursor]);
      assert.changedProperties(startedAnalysis, analysis, changes);
    }));
    it('Can get the full results of an analysis', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const results = sinon.stub(components, 'results');
      const responseStatus = { status: AnalysisStatusEnum.RUNNING, progress: { completed: 10, total: 20 }};
      const resultsResponse = {
        status: responseStatus,
        cursor: 'abcdef',
        results: [sampleResult],
      };
      results.resolves(resultsResponse);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(buildPath, settings);
      const extantResult = clone(sampleResult);
      extantResult['test-id'] = 'overwritten';
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
      assert.calledOnceWith(results, [apiUrl, analysisId, undefined]);
      assert.changedProperties(startedAnalysis, analysis, changes);
    }));
    it('Can get the paginated results of an analysis with a results stream', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const results = sinon.stub(components, 'results');
      const responseStatus = { status: AnalysisStatusEnum.RUNNING, progress: { completed: 10, total: 20 }};
      const resultsResponse = {
        status: responseStatus,
        cursor: 'abcdef',
        results: [sampleResult],
      };
      results.resolves(resultsResponse);
      const writableStream = createTestWriteable();
      const startedAnalysis = new Analysis(apiUrl, writableStream);
      await startedAnalysis.start(buildPath, settings);
      startedAnalysis.cursor = '123456';
      const extantResult = clone(sampleResult);
      extantResult['test-id'] = 'extant-result';
      startedAnalysis.results = [extantResult];
      const analysis = clone(startedAnalysis);
      const returnValue = await analysis.getResults();
      const changes = {
        status: returnValue.status.status,
        progress: returnValue.status.progress,
        error: undefined,
        cursor: returnValue.cursor,
      };
      assert.deepStrictEqual(returnValue, resultsResponse);
      assert.calledOnceWith(results, [apiUrl, analysisId, startedAnalysis.cursor]);
      assert.changedProperties(startedAnalysis, analysis, changes);
      assert.deepStrictEqual((writableStream as any).data, resultsResponse.results); // tslint:disable-line:no-any
    }));
    it('Fails to get the full results of an analysis with a results stream', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const results = sinon.stub(components, 'results');
      const responseStatus = { status: AnalysisStatusEnum.RUNNING, progress: { completed: 10, total: 20 }};
      const resultsResponse = {
        status: responseStatus,
        cursor: 'abcdef',
        results: [sampleResult],
      };
      results.resolves(resultsResponse);
      const writableStream = createTestWriteable();
      const startedAnalysis = new Analysis(apiUrl, writableStream);
      await startedAnalysis.start(buildPath, settings);
      startedAnalysis.cursor = '123456';
      const extantResult = clone(sampleResult);
      extantResult['test-id'] = 'extant-result';
      startedAnalysis.results = [extantResult];
      const analysis = clone(startedAnalysis);
      await assert.rejects(
        async () => analysis.getResults(false),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.STREAM_MUST_PAGINATE;
        },
      );
    }));
    it('Fails to get the results of an analysis, if api method throws', sinonTest(async (sinon) => {
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      const resultsError = new Error('results api call failed');
      const results = sinon.stub(components, 'results');
      results.throws(resultsError);
      const startedAnalysis = new Analysis(apiUrl);
      await startedAnalysis.start(buildPath, settings);
      const analysis = clone(startedAnalysis);
      await assert.rejects(async () => analysis.getResults(), resultsError);
      assert.changedProperties(startedAnalysis, analysis, {});
    }));
    it('Fails to get the results of an analysis, if not started', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      assert.strictEqual(analysis.status, AnalysisObjectStatusEnum.NOT_STARTED);
      await assert.rejects(
        async () => analysis.getResults(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NOT_RUNNING;
        },
      );
    }));
    it('Fails to get the results of an analysis, if already completed', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      analysis.analysisId = analysisId;
      analysis.status = AnalysisObjectStatusEnum.COMPLETED;
      await assert.rejects(
        async () => analysis.getResults(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NOT_RUNNING;
        },
      );
    }));
    it('Fails to get the results an analysis, if id not set', sinonTest(async (sinon) => {
      const analysis = new Analysis(apiUrl);
      const start = sinon.stub(components, 'start');
      start.resolves({ id: analysisId, phases: {}});
      await analysis.start(buildPath, settings);
      analysis.analysisId = '';
      await assert.rejects(
        async () => analysis.getResults(),
        (err: Error) => {
          return (err instanceof AnalysisError) && err.code === AnalysisErrorCodeEnum.NO_ID;
        },
      );
    }));
    it('Knows if its status is not started', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.NOT_STARTED;
      assert.strictEqual(analysis.isNotStarted(), true);
    });
    it('Knows if its status is not not started', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.RUNNING;
      assert.strictEqual(analysis.isNotStarted(), false);
    });
    it('Knows if its status is running', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.RUNNING;
      assert.strictEqual(analysis.isRunning(), true);
    });
    it('Knows if its status is not running', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.COMPLETED;
      assert.strictEqual(analysis.isRunning(), false);
    });
    it('Knows if its status is canceled', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.CANCELED;
      assert.strictEqual(analysis.isCanceled(), true);
    });
    it('Knows if its status is not canceled', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.ERRORED;
      assert.strictEqual(analysis.isCanceled(), false);
    });
    it('Knows if its status is errored', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.ERRORED;
      assert.strictEqual(analysis.isErrored(), true);
    });
    it('Knows if its status is not errored', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.COMPLETED;
      assert.strictEqual(analysis.isErrored(), false);
    });
    it('Knows if its status is completed', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.COMPLETED;
      assert.strictEqual(analysis.isCompleted(), true);
    });
    it('Knows if its status is not completed', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.RUNNING;
      assert.strictEqual(analysis.isCompleted(), false);
    });
    it('Knows if it has started', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.RUNNING;
      assert.strictEqual(analysis.isStarted(), true);
    });
    it('Knows if it has not started', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.NOT_STARTED;
      assert.strictEqual(analysis.isStarted(), false);
    });
    it('Knows if it has ended', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.CANCELED;
      assert.strictEqual(analysis.isEnded(), true);
    });
    it('Knows if it has not ended', () => {
      const analysis = new Analysis(apiUrl);
      analysis.status = AnalysisObjectStatusEnum.RUNNING;
      assert.strictEqual(analysis.isEnded(), false);
    });
  });
});
