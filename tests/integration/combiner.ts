// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { readFile as readFileCallback, writeFile as writeFileCallback } from 'fs';
import { groupBy, mapValues } from 'lodash';
import { promisify } from 'util';

import { generateTestClass, mergeIntoTestClass } from '../../src/combiner';
import { AnalysisResult } from '../../src/types/types';
import assert from '../../src/utils/assertExtra';
import logger from '../../src/utils/log';

const readFile = promisify(readFileCallback);
const writeFile = promisify(writeFileCallback);

// If the tests are failing, examine the diff.
// If it looks correct, set UPDATE_FILES to true and re-run the integration tests
// Check the contents of the files, and re-set UPDATE_FILES to false before committing.
const UPDATE_FILES = false;

describe('src/combiner', () => {
  let resultsBySourceFileAndFunction: { [sourceFilePath: string]: { [testedFunction: string]: AnalysisResult[] }};
  let expectedSingleTestClass: string;
  let expectedMultiTestClass: string;
  let expectedFirstTestClass: string;
  let expectedMergedTestClass: string;

  const sampleSourceFilePath = 'com/diffblue/javademo/UserAccess.java';
  const sampleSingleTestFunction = 'java::com.diffblue.javademo.UserAccess.getCurrentUser:()Ljava/lang/String;';
  const sampleMultiTestFunction = 'java::com.diffblue.javademo.UserAccess.loginUser:(Ljava/lang/String;Ljava/lang/String;)Z'; // tslint:disable-line:max-line-length

  const expectedSingleTestClassPath = './tests/integration/fixtures/combiner/ExpectedSingleTestClass.java';
  const expectedMultiTestClassPath = './tests/integration/fixtures/combiner/ExpectedMultiTestClass.java';
  const expectedFirstTestClassPath = './tests/integration/fixtures/combiner/ExpectedFirstTestClass.java';
  const expectedMergedTestClassPath = './tests/integration/fixtures/combiner/ExpectedMergedTestClass.java';

  before('', async () => {
    const resultsJson = await readFile('./tests/integration/fixtures/sample-java-demo-results.json');
    const { results: sampleResults } = JSON.parse(resultsJson.toString());
    const resultsBySourceFilePath = groupBy(sampleResults, 'sourceFilePath');
    resultsBySourceFileAndFunction = mapValues(resultsBySourceFilePath, (resultGroup) => {
      return groupBy(resultGroup, 'testedFunction');
    });

    expectedSingleTestClass = (
      await readFile(expectedSingleTestClassPath)
    ).toString();
    expectedMultiTestClass = (
      await readFile(expectedMultiTestClassPath)
    ).toString();
    expectedFirstTestClass = (
      await readFile(expectedFirstTestClassPath)
    ).toString();
    expectedMergedTestClass = (
      await readFile(expectedMergedTestClassPath)
    ).toString();
  });

  describe('generateTestClass', () => {
    it('Check fixtures', () => {
      assert.ok(
        sampleSourceFilePath in resultsBySourceFileAndFunction,
        `${sampleSourceFilePath} not found`,
      );
      assert.ok(
        sampleSingleTestFunction in resultsBySourceFileAndFunction[sampleSourceFilePath],
        `${sampleSingleTestFunction} not found`,
      );
      assert.ok(
        resultsBySourceFileAndFunction[sampleSourceFilePath][sampleSingleTestFunction].length === 1,
        'Too many tests for sampleSingleTestFunction',
      );
      assert.ok(
        sampleMultiTestFunction in resultsBySourceFileAndFunction[sampleSourceFilePath],
        `${sampleMultiTestFunction} not found`,
      );
      assert.ok(
        resultsBySourceFileAndFunction[sampleSourceFilePath][sampleMultiTestFunction].length > 1,
        'Not enough tests for sampleMultiTestFunction',
      );
      assert.ok(!UPDATE_FILES, 'UPDATE_FILES must be false for the integration tests to pass.');
    });

    it('Can generate a test class for a single test', async () => {
      const results = resultsBySourceFileAndFunction[sampleSourceFilePath][sampleSingleTestFunction];
      const testClass = generateTestClass(results);
      if (UPDATE_FILES) {
        logger.log(`Updating ${expectedSingleTestClassPath}`);
        await writeFile(expectedSingleTestClassPath, testClass);
      } else {
        assert.strictEqual(testClass, expectedSingleTestClass);
      }
    });

    it('Can generate a test class for multiple tests (including class annotations)', async () => {
      const results = resultsBySourceFileAndFunction[sampleSourceFilePath][sampleMultiTestFunction];
      const testClass = generateTestClass(results);
      if (UPDATE_FILES) {
        logger.log(`Updating ${expectedMultiTestClassPath}`);
        await writeFile(expectedMultiTestClassPath, testClass);
      } else {
        assert.strictEqual(testClass, expectedMultiTestClass);
      }
    });
  });

  describe('mergeIntoTestClass', () => {
    it('Can merge results into an existing test class', async () => {
      const [
        firstResult,
        ...results
      ] = resultsBySourceFileAndFunction[sampleSourceFilePath][sampleMultiTestFunction];
      const testClass = generateTestClass([firstResult]);
      if (UPDATE_FILES) {
        logger.log(`Updating ${expectedFirstTestClassPath}`);
        await writeFile(expectedFirstTestClassPath, testClass);
      } else {
        assert.strictEqual(testClass, expectedFirstTestClass);
      }
      const mergedTestClass = await mergeIntoTestClass(testClass, results);
      if (UPDATE_FILES) {
        logger.log(`Updating ${expectedMergedTestClassPath}`);
        await writeFile(expectedMergedTestClassPath, mergedTestClass);
      } else {
        assert.strictEqual(mergedTestClass, expectedMergedTestClass);
      }
    });
  });
});
