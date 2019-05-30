// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { assert as sinonAssert } from 'sinon';

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';
import TestError from '../../../src/utils/TestError';

import { WriterError, WriterErrorCodes } from '../../../src/errors';
import writeTests, { components, dependencies } from '../../../src/writeTests';

const sinonTest = sinonTestFactory();

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
const otherResult = {
  ...sampleResult,
  testedFunction: 'com.diffblue.javademo.OtherClass.otherFunction',
  sourceFilePath: '/other/path',
};
const sampleResultFilePath = '/test/path/TicTacToeTest.java';
const otherResultFilePath = '/test/path/OtherClassTest.java';
const enoentError = new TestError('File not found', 'ENOENT');

describe('writer', () => {
  describe('writeTests', () => {

    it('Can write tests to new files', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const generateTestClass = sinon.stub(components, 'generateTestClass').returns('test-class');
      const readFile = sinon.stub(dependencies, 'readFile').rejects(enoentError);
      const returnValue = await writeTests('/test/path', [sampleResult, otherResult]);
      const expectedReturn = [otherResultFilePath, sampleResultFilePath];
      assert.deepStrictEqual(returnValue, expectedReturn);
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.calledTwice(readFile);
      sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
      sinonAssert.calledWithExactly(readFile, otherResultFilePath);
      sinonAssert.calledTwice(generateTestClass);
      sinonAssert.calledWithExactly(generateTestClass, [sampleResult]);
      sinonAssert.calledWithExactly(generateTestClass, [otherResult]);
      sinonAssert.calledTwice(writeFile);
      sinonAssert.calledWithExactly(writeFile, sampleResultFilePath, 'test-class');
      sinonAssert.calledWithExactly(writeFile, otherResultFilePath, 'test-class');
    }));

    it('Can write tests to existing files', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const mergeIntoTestClass = sinon.stub(components, 'mergeIntoTestClass').resolves('test-class');
      const readFile = sinon.stub(dependencies, 'readFile').resolves('existing-test-class');
      const returnValue = await writeTests('/test/path', [sampleResult, otherResult]);
      const expectedReturn = [otherResultFilePath, sampleResultFilePath];
      assert.deepStrictEqual(returnValue, expectedReturn);
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.calledTwice(readFile);
      sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
      sinonAssert.calledWithExactly(readFile, otherResultFilePath);
      sinonAssert.calledTwice(mergeIntoTestClass);
      sinonAssert.calledWithExactly(mergeIntoTestClass, 'existing-test-class', [sampleResult]);
      sinonAssert.calledWithExactly(mergeIntoTestClass, 'existing-test-class', [otherResult]);
      sinonAssert.calledTwice(writeFile);
      sinonAssert.calledWithExactly(writeFile, sampleResultFilePath, 'test-class');
      sinonAssert.calledWithExactly(writeFile, otherResultFilePath, 'test-class');
    }));

    it('Can accept options to set map concurrency', sinonTest(async (sinon) => {
      sinon.stub(dependencies, 'mkdirp').resolves();
      const map = sinon.stub(dependencies, 'map').resolves();
      await writeTests('/test/path', [sampleResult], { concurrency: 1 });
      assert.deepStrictEqual(map.firstCall.args[2], { concurrency: 1 });
    }));

    it('Rejects if readFile rejects with non ENOENT error', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const generateTestClass = sinon.stub(components, 'generateTestClass').returns('test-class');
      const readFileError = new Error('readFile threw');
      const readFile = sinon.stub(dependencies, 'readFile').rejects(readFileError);
      await assert.rejects(
        async () => writeTests('/test/path', [sampleResult]),
        (err: Error) => {
          return (
            (err instanceof WriterError)
            && err.code === WriterErrorCodes.WRITE_FAILED
            && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
            && err.message.includes(readFileError.message)
          );
        },
      );
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.calledOnce(readFile);
      sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
      sinonAssert.notCalled(generateTestClass);
      sinonAssert.notCalled(writeFile);
    }));

    it('Rejects if generateTestClass throws', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const generateTestClassError = new Error('generateTestClass threw');
      const generateTestClass = sinon.stub(components, 'generateTestClass').throws(generateTestClassError);
      const readFile = sinon.stub(dependencies, 'readFile').rejects(enoentError);
      await assert.rejects(
        async () => writeTests('/test/path', [sampleResult]),
        (err: Error) => {
          return (
            (err instanceof WriterError)
            && err.code === WriterErrorCodes.WRITE_FAILED
            && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
            && err.message.includes(generateTestClassError.message)
          );
        },
      );
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.calledOnce(readFile);
      sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
      sinonAssert.calledOnce(generateTestClass);
      sinonAssert.calledWithExactly(generateTestClass, [sampleResult]);
      sinonAssert.notCalled(writeFile);
    }));

    it('Rejects if mergeIntoTestClass rejects', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const mergeIntoTestClassError = new Error('mergeIntoTestClass rejected');
      const mergeIntoTestClass = sinon.stub(components, 'mergeIntoTestClass').rejects(mergeIntoTestClassError);
      const readFile = sinon.stub(dependencies, 'readFile').resolves('existing-test-class');
      await assert.rejects(
        async () => writeTests('/test/path', [sampleResult]),
        (err: Error) => {
          return (
            (err instanceof WriterError)
            && err.code === WriterErrorCodes.WRITE_FAILED
            && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
            && err.message.includes(mergeIntoTestClassError.message)
          );
        },
      );
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.calledOnce(readFile);
      sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
      sinonAssert.calledOnce(mergeIntoTestClass);
      sinonAssert.calledWithExactly(mergeIntoTestClass, 'existing-test-class', [sampleResult]);
      sinonAssert.notCalled(writeFile);
    }));

    it('Rejects if writeFile throws when writing new files', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFileError = new Error('writeFile rejected');
      const writeFile = sinon.stub(dependencies, 'writeFile').rejects(writeFileError);
      const generateTestClass = sinon.stub(components, 'generateTestClass').returns('test-class');
      const readFile = sinon.stub(dependencies, 'readFile').rejects(enoentError);
      await assert.rejects(
        async () => writeTests('/test/path', [sampleResult]),
        (err: Error) => {
          return (
            (err instanceof WriterError)
            && err.code === WriterErrorCodes.WRITE_FAILED
            && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
            && err.message.includes(writeFileError.message)
          );
        },
      );
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.calledOnce(readFile);
      sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
      sinonAssert.calledOnce(generateTestClass);
      sinonAssert.calledWithExactly(generateTestClass, [sampleResult]);
      sinonAssert.calledOnce(writeFile);
      sinonAssert.calledWithExactly(writeFile, sampleResultFilePath, 'test-class');
    }));

    it('Rejects if writeFile throws when writing to existing files', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFileError = new Error('writeFile rejected');
      const writeFile = sinon.stub(dependencies, 'writeFile').rejects(writeFileError);
      const mergeIntoTestClass = sinon.stub(components, 'mergeIntoTestClass').resolves('test-class');
      const readFile = sinon.stub(dependencies, 'readFile').resolves('existing-test-class');
      await assert.rejects(
        async () => writeTests('/test/path', [sampleResult]),
        (err: Error) => {
          return (
            (err instanceof WriterError)
            && err.code === WriterErrorCodes.WRITE_FAILED
            && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
            && err.message.includes(writeFileError.message)
          );
        },
      );
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.calledOnce(readFile);
      sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
      sinonAssert.calledOnce(mergeIntoTestClass);
      sinonAssert.calledWithExactly(mergeIntoTestClass, 'existing-test-class', [sampleResult]);
      sinonAssert.calledOnce(writeFile);
      sinonAssert.calledWithExactly(writeFile, sampleResultFilePath, 'test-class');
    }));

    it('Rejects if there is an error creating the output directory', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').rejects();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const mergeIntoTestClass = sinon.stub(components, 'mergeIntoTestClass').resolves('test-class');
      const readFile = sinon.stub(dependencies, 'readFile').resolves('existing-test-class');
      await assert.rejects(
        async () => writeTests('/test/path', [sampleResult]),
        (err: Error) => {
          return (
            (err instanceof WriterError)
            && err.code === WriterErrorCodes.DIR_FAILED
          );
        },
      );
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.notCalled(readFile);
      sinonAssert.notCalled(mergeIntoTestClass);
      sinonAssert.notCalled(writeFile);
    }));

    it('Rejects if getFileNameForResult throws', sinonTest(async (sinon) => {
      const getFileNameForResultError = new Error('getFileNameForResult threw');
      sinon.stub(components, 'getFileNameForResult').throws(getFileNameForResultError);
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const mergeIntoTestClassError = new Error('mergeIntoTestClass rejected');
      const mergeIntoTestClass = sinon.stub(components, 'mergeIntoTestClass').rejects(mergeIntoTestClassError);
      const readFile = sinon.stub(dependencies, 'readFile').resolves('existing-test-class');
      await assert.rejects(
        async () => writeTests('/test/path', [sampleResult]),
        (err: Error) => {
          return (
            (err instanceof WriterError)
            && err.code === WriterErrorCodes.WRITE_FAILED
            && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
            && err.message.includes(getFileNameForResultError.message)
          );
        },
      );
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.notCalled(readFile);
      sinonAssert.notCalled(mergeIntoTestClass);
      sinonAssert.notCalled(writeFile);
    }));

    it('Writes some test files even if it rejects at least once when writing', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const mergeIntoTestClassError = new Error('mergeIntoTestClass rejected');
      const mergeIntoTestClass = sinon.stub(components, 'mergeIntoTestClass').resolves('test-class');
      const readFile = sinon.stub(dependencies, 'readFile').resolves('existing-test-class');
      // mergeIntoTestClass rejects when called for other result, but writeFile is still called for sampleResult
      mergeIntoTestClass.withArgs('existing-test-class', [otherResult]).rejects(mergeIntoTestClassError);
      await assert.rejects(
        async () => writeTests('/test/path', [sampleResult, otherResult]),
        (err: Error) => {
          return (
            (err instanceof WriterError)
            && err.code === WriterErrorCodes.WRITE_FAILED
            && err.message.includes(`sourceFilePath: ${otherResult.sourceFilePath}`)
            && err.message.includes(mergeIntoTestClassError.message)
          );
        },
      );
      sinonAssert.calledOnce(mkdirp);
      sinonAssert.calledWithExactly(mkdirp, '/test/path');
      sinonAssert.calledTwice(readFile);
      sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
      sinonAssert.calledWithExactly(readFile, otherResultFilePath);
      sinonAssert.calledTwice(mergeIntoTestClass);
      sinonAssert.calledWithExactly(mergeIntoTestClass, 'existing-test-class', [sampleResult]);
      sinonAssert.calledWithExactly(mergeIntoTestClass, 'existing-test-class', [otherResult]);
      sinonAssert.calledOnce(writeFile);
      sinonAssert.calledWithExactly(writeFile, sampleResultFilePath, 'test-class');
    }));
  });
});
