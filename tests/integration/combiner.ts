// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { readFile as readFileCallback } from 'fs';
import { groupBy, mapValues } from 'lodash';
import { promisify } from 'util';

import { generateTestClass, mergeIntoTestClass } from '../../src/combiner';
import { AnalysisResult } from '../../src/types/types';
import assert from '../../src/utils/assertExtra';

const readFile = promisify(readFileCallback);

describe('src/combiner', () => {
  let resultsBySourceFileAndFunction: { [sourceFilePath: string]: { [testedFunction: string]: AnalysisResult[] }};
  let expectedSingleTestClass: string;
  let expectedMultiTestClass: string;
  let expectedFirstTestClass: string;
  let expectedMergedTestClass: string;

  const sampleSourceFilePath = '/com/diffblue/javademo/UserAccess.java';
  const sampleSingleTestFunction = 'java::com.diffblue.javademo.UserAccess.getCurrentUser:()Ljava/lang/String;';
  const sampleMultiTestFunction = 'java::com.diffblue.javademo.UserAccess.loginUser:(Ljava/lang/String;Ljava/lang/String;)Z'; // tslint:disable-line:max-line-length

  before('', async () => {
    const resultsJson = await readFile('./tests/integration/fixtures/sample-java-demo-results.json');
    const { results: sampleResults } = JSON.parse(resultsJson.toString());
    const resultsBySourceFilePath = groupBy(sampleResults, 'sourceFilePath');
    resultsBySourceFileAndFunction = mapValues(resultsBySourceFilePath, (resultGroup) => {
      return groupBy(resultGroup, 'testedFunction');
    });

    expectedSingleTestClass = (
      await readFile('./tests/integration/fixtures/combiner/ExpectedSingleTestClass.java')
    ).toString();
    expectedMultiTestClass = (
      await readFile('./tests/integration/fixtures/combiner/ExpectedMultiTestClass.java')
    ).toString();
    expectedFirstTestClass = (
      await readFile('./tests/integration/fixtures/combiner/ExpectedFirstTestClass.java')
    ).toString();
    expectedMergedTestClass = (
      await readFile('./tests/integration/fixtures/combiner/ExpectedMergedTestClass.java')
    ).toString();
  });

  describe('generateTestClass', () => {
    it('Check fixtures', () => {
      assert.ok(sampleSourceFilePath in resultsBySourceFileAndFunction);
      assert.ok(sampleSingleTestFunction in resultsBySourceFileAndFunction[sampleSourceFilePath]);
      assert.ok(resultsBySourceFileAndFunction[sampleSourceFilePath][sampleSingleTestFunction].length === 1);
      assert.ok(sampleMultiTestFunction in resultsBySourceFileAndFunction[sampleSourceFilePath]);
      assert.ok(resultsBySourceFileAndFunction[sampleSourceFilePath][sampleMultiTestFunction].length > 1);
    });

    it('Can generate a test class for a single test', () => {
      const results = resultsBySourceFileAndFunction[sampleSourceFilePath][sampleSingleTestFunction];
      const testClass = generateTestClass(results);
      assert.strictEqual(testClass, expectedSingleTestClass);
    });

    it('Can generate a test class for multiple tests (including class annotations)', () => {
      const results = resultsBySourceFileAndFunction[sampleSourceFilePath][sampleMultiTestFunction];
      const testClass = generateTestClass(results);
      assert.strictEqual(testClass, expectedMultiTestClass);
    });
  });

  describe('mergeIntoTestClass', () => {
    it('Can merge results into an existing test class', async () => {
      const [
        firstResult,
        ...results
      ] = resultsBySourceFileAndFunction[sampleSourceFilePath][sampleMultiTestFunction];
      const testClass = generateTestClass([firstResult]);
      assert.strictEqual(testClass, expectedFirstTestClass);
      const mergedTestClass = await mergeIntoTestClass(testClass, results);
      assert.strictEqual(mergedTestClass, expectedMergedTestClass);
    });
  });
});
