// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { clone } from 'lodash';
import { assert as sinonAssert } from 'sinon';

import assert from '../../src/utils/assertExtra';
import sinonTestFactory from '../../src/utils/sinonTest';
import TestError from '../../src/utils/TestError';

import { WriterError, WriterErrorCode } from '../../src/errors';
import writeTests, { components, dependencies } from '../../src/writeTests';

const sinonTest = sinonTestFactory();

const sampleResult = {
  testId: 'id',
  testName: 'name',
  testedFunction: 'com.diffblue.javademo.TicTacToe.checkTicTacToePosition',
  sourceFilePath: '/com/diffblue/javademo/TicTacToe.java',
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
  testedFunction: 'com.diffblue.other.OtherClass.otherFunction',
  sourceFilePath: '/com/diffblue/other/OtherClass.java',
};
const testDirPath = '/test/path';
const sampleResultDirPath = `${testDirPath}/com/diffblue/javademo`;
const sampleResultFilePath = `${sampleResultDirPath}/TicTacToeTest.java`;
const otherResultDirPath = `${testDirPath}/com/diffblue/other`;
const otherResultFilePath = `${otherResultDirPath}/OtherClassTest.java`;
const enoentError = new TestError('File not found', 'ENOENT');

describe('writeTests', () => {
  it('Can write tests to new files', sinonTest(async (sinon) => {
    const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
    const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
    const generateTestClass = sinon.stub(components, 'generateTestClass').returns('test-class');
    const readFile = sinon.stub(dependencies, 'readFile').rejects(enoentError);
    const returnValue = await writeTests(testDirPath, [sampleResult, otherResult]);
    const expectedReturn = [sampleResultFilePath, otherResultFilePath];
    assert.deepStrictEqual(returnValue, expectedReturn);
    sinonAssert.calledThrice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
    sinonAssert.calledWithExactly(mkdirp, otherResultDirPath);
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
    const returnValue = await writeTests(testDirPath, [sampleResult, otherResult]);
    const expectedReturn = [sampleResultFilePath, otherResultFilePath];
    assert.deepStrictEqual(returnValue, expectedReturn);
    sinonAssert.calledThrice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
    sinonAssert.calledWithExactly(mkdirp, otherResultDirPath);
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

  it('Can write tests with matching file names and differing package paths', sinonTest(async (sinon) => {
    const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
    const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
    const generateTestClass = sinon.stub(components, 'generateTestClass').returns('test-class');
    const readFile = sinon.stub(dependencies, 'readFile').rejects(enoentError);
    const similarResult = clone(sampleResult);
    similarResult.sourceFilePath = '/com/diffblue/other/TicTacToe.java';
    const similarResultFilePath = '/test/path/com/diffblue/other/TicTacToeTest.java';
    const returnValue = await writeTests(testDirPath, [sampleResult, similarResult]);
    const expectedReturn = [sampleResultFilePath, similarResultFilePath];
    assert.deepStrictEqual(returnValue, expectedReturn);
    sinonAssert.calledThrice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
    sinonAssert.calledWithExactly(mkdirp, otherResultDirPath);
    sinonAssert.calledTwice(readFile);
    sinonAssert.calledWithExactly(readFile, sampleResultFilePath);
    sinonAssert.calledWithExactly(readFile, similarResultFilePath);
    sinonAssert.calledTwice(generateTestClass);
    sinonAssert.calledWithExactly(generateTestClass, [sampleResult]);
    sinonAssert.calledWithExactly(generateTestClass, [similarResult]);
    sinonAssert.calledTwice(writeFile);
    sinonAssert.calledWithExactly(writeFile, sampleResultFilePath, 'test-class');
    sinonAssert.calledWithExactly(writeFile, similarResultFilePath, 'test-class');
  }));

  it('Can accept options to set map concurrency', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'mkdirp').resolves();
    const map = sinon.stub(dependencies, 'map').resolves();
    await writeTests(testDirPath, [sampleResult], { concurrency: 1 });
    assert.deepStrictEqual(map.firstCall.args[2], { concurrency: 1 });
  }));

  it('Rejects if readFile rejects with non ENOENT error', sinonTest(async (sinon) => {
    const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
    const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
    const generateTestClass = sinon.stub(components, 'generateTestClass').returns('test-class');
    const readFileError = new Error('readFile threw');
    const readFile = sinon.stub(dependencies, 'readFile').rejects(readFileError);
    await assert.rejects(
      async () => writeTests(testDirPath, [sampleResult]),
      (err: Error) => {
        return (
          (err instanceof WriterError)
          && err.code === WriterErrorCode.WRITE_FAILED
          && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
          && err.message.includes(readFileError.message)
        );
      },
    );
    sinonAssert.calledTwice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
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
      async () => writeTests(testDirPath, [sampleResult]),
      (err: Error) => {
        return (
          (err instanceof WriterError)
          && err.code === WriterErrorCode.WRITE_FAILED
          && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
          && err.message.includes(generateTestClassError.message)
        );
      },
    );
    sinonAssert.calledTwice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
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
      async () => writeTests(testDirPath, [sampleResult]),
      (err: Error) => {
        return (
          (err instanceof WriterError)
          && err.code === WriterErrorCode.WRITE_FAILED
          && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
          && err.message.includes(mergeIntoTestClassError.message)
        );
      },
    );
    sinonAssert.calledTwice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
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
      async () => writeTests(testDirPath, [sampleResult]),
      (err: Error) => {
        return (
          (err instanceof WriterError)
          && err.code === WriterErrorCode.WRITE_FAILED
          && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
          && err.message.includes(writeFileError.message)
        );
      },
    );
    sinonAssert.calledTwice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
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
      async () => writeTests(testDirPath, [sampleResult]),
      (err: Error) => {
        return (
          (err instanceof WriterError)
          && err.code === WriterErrorCode.WRITE_FAILED
          && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
          && err.message.includes(writeFileError.message)
        );
      },
    );
    sinonAssert.calledTwice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
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
      async () => writeTests(testDirPath, [sampleResult]),
      (err: Error) => {
        return (
          (err instanceof WriterError)
          && err.code === WriterErrorCode.DIR_FAILED
        );
      },
    );
    sinonAssert.calledOnce(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
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
      async () => writeTests(testDirPath, [sampleResult]),
      (err: Error) => {
        return (
          (err instanceof WriterError)
          && err.code === WriterErrorCode.WRITE_FAILED
          && err.message.includes(`sourceFilePath: ${sampleResult.sourceFilePath}`)
          && err.message.includes(getFileNameForResultError.message)
        );
      },
    );
    sinonAssert.calledTwice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
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
      async () => writeTests(testDirPath, [sampleResult, otherResult]),
      (err: Error) => {
        return (
          (err instanceof WriterError)
          && err.code === WriterErrorCode.WRITE_FAILED
          && err.message.includes(`sourceFilePath: ${otherResult.sourceFilePath}`)
          && err.message.includes(mergeIntoTestClassError.message)
        );
      },
    );
    sinonAssert.calledThrice(mkdirp);
    sinonAssert.calledWithExactly(mkdirp, testDirPath);
    sinonAssert.calledWithExactly(mkdirp, sampleResultDirPath);
    sinonAssert.calledWithExactly(mkdirp, otherResultDirPath);
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
