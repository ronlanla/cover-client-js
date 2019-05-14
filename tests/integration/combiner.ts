// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { readFileSync } from 'fs';
import { groupBy, mapValues } from 'lodash';
import { generateTestClass, mergeIntoTestClass } from '../../src/combiner';
import assert from '../../src/utils/assertExtra';


const resultsJson = readFileSync('./tests/integration/fixtures/sample-java-demo-results.json');
const { results: sampleResults } = JSON.parse(resultsJson.toString());
const resultsBySourceFilePath = groupBy(sampleResults, 'sourceFilePath');
const resultsBySourceFileAndFunction = mapValues(resultsBySourceFilePath, (resultGroup, key) => {
  return groupBy(resultGroup, 'testedFunction');
});

const sampleSourceFilePath = '/com/diffblue/javademo/UserAccess.java';
const sampleSingleTestFunction = 'java::com.diffblue.javademo.UserAccess.getCurrentUser:()Ljava/lang/String;';
const sampleMultiTestFunction = 'java::com.diffblue.javademo.UserAccess.loginUser:(Ljava/lang/String;Ljava/lang/String;)Z'; // tslint:disable-line:max-line-length

const expectedSingleTestClass = readFileSync(
  './tests/integration/fixtures/combiner/ExpectedSingleTestClass.java',
).toString();
const expectedMultiTestClass = readFileSync(
  './tests/integration/fixtures/combiner/ExpectedMultiTestClass.java',
).toString();
const expectedFirstTestClass = readFileSync(
  './tests/integration/fixtures/combiner/ExpectedFirstTestClass.java',
).toString();
const expectedMergedTestClass = readFileSync(
  './tests/integration/fixtures/combiner/ExpectedMergedTestClass.java',
).toString();


describe('src/combiner', () => {
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
