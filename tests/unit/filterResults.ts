// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { clone } from 'lodash';

import { FilterResultsError, FilterResultsErrorCode } from '../../src/errors';
import filterResults from '../../src/filterResults';
import { AnalysisResult, ResultTagFilterObject } from '../../src/types/types';
import assert from '../../src/utils/assertExtra';
import sinonTestFactory from '../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

const sampleResult = {
  testId: 'id',
  testName: 'sampleTest',
  testedFunction: 'com.diffblue.javademo.TicTacToe.checkTicTacToePosition',
  sourceFilePath: '/com/diffblue/javademo/TicTacToe.java',
  testBody: 'body',
  imports: ['import'],
  staticImports: ['static import'],
  classAnnotations: ['class annotation'],
  classRules: ['class rules'],
  tags: [] as string[],
  createdTime: 'created',
  coveredLines: ['com.diffblue.javademo.TicTacToe.checkTicTacToePosition:1-2,4-5'],
};

describe('filterResults', () => {
  it('Can return results unaltered if no filter is provided', sinonTest(async (sinon) => {
    const returnValue = filterResults([sampleResult]);
    const expectedReturn = [sampleResult];
    assert.deepStrictEqual(returnValue, expectedReturn);
  }));

  it('Can return results with matching tags if a tag array filter is provided', sinonTest(async (sinon) => {
    const verifiedResult = clone(sampleResult);
    verifiedResult.tags = ['verified'];
    const returnValue = filterResults([sampleResult, verifiedResult], ['verified']);
    const expectedReturn = [verifiedResult];
    assert.deepStrictEqual(returnValue, expectedReturn);
  }));

  it('Can return results with matching tags if a tag array object include is provided', sinonTest(async (sinon) => {
    const verifiedResult = clone(sampleResult);
    verifiedResult.tags = ['verified'];
    const returnValue = filterResults([sampleResult, verifiedResult], { include: ['verified'] });
    const expectedReturn = [verifiedResult];
    assert.deepStrictEqual(returnValue, expectedReturn);
  }));

  it('Can return results without matching tags if a tag array object exclude is provided', sinonTest(async (sinon) => {
    const verifiedResult = clone(sampleResult);
    verifiedResult.tags = ['verified'];
    const returnValue = filterResults([sampleResult, verifiedResult], { exclude: ['verified'] });
    const expectedReturn = [sampleResult];
    assert.deepStrictEqual(returnValue, expectedReturn);
  }));

  it('Can return results with that satisfy include and exclude filters', sinonTest(async (sinon) => {
    const verifiedResult = clone(sampleResult);
    verifiedResult.tags = ['verified'];
    const mockingResult = clone(sampleResult);
    mockingResult.tags = ['mocking', 'verified'];
    const returnValue = filterResults(
      [sampleResult, verifiedResult, mockingResult],
      {
        include: ['verified'],
        exclude: ['mocking'],
      },
    );
    const expectedReturn = [verifiedResult];
    assert.deepStrictEqual(returnValue, expectedReturn);
  }));

  it('Can return results that satisfy filter callback', sinonTest(async (sinon) => {
    const otherResult = clone(sampleResult);
    otherResult.testName = 'otherTest';
    const filterCallback = (result: AnalysisResult) => result.testName === 'sampleTest';
    const returnValue = filterResults([sampleResult, otherResult], filterCallback);
    const expectedReturn = [sampleResult];
    assert.deepStrictEqual(returnValue, expectedReturn);
  }));

  it('Throws if the filter has an unexpected data type', sinonTest(async (sinon) => {
    assert.throws(
      () => filterResults([sampleResult], 'invalid filter type' as any),
      (err: Error) => {
        return (
          (err instanceof FilterResultsError)
          && err.code === FilterResultsErrorCode.FILTER_INVALID
        );
      },
    );
  }));

  it('Throws if the filtering throws due to a bad callback', sinonTest(async (sinon) => {
    const badFilterCallback = (result: AnalysisResult) => {
      throw new Error('filter error');
    };
    assert.throws(
      () => filterResults([sampleResult], badFilterCallback),
      (err: Error) => {
        return (
          (err instanceof FilterResultsError)
          && err.code === FilterResultsErrorCode.FILTER_FAILED
        );
      },
    );
  }));

  it('Throws if the filtering throws due to a bad filter object', sinonTest(async (sinon) => {
    const badFilterObject = { include: 'string not an array' } as unknown as ResultTagFilterObject;
    assert.throws(
      () => filterResults([sampleResult], badFilterObject),
      (err: Error) => {
        return (
          (err instanceof FilterResultsError)
          && err.code === FilterResultsErrorCode.FILTER_FAILED
        );
      },
    );
  }));
});
