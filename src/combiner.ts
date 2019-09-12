// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { genTestClass, ITestData, mergeTests } from '@diffblue/java-combiner';
import { groupBy, isString } from 'lodash';

import { CombinerError, CombinerErrorCode } from './errors';
import { AnalysisResult } from './types/types';

export const dependencies = {
  genTestClass: genTestClass,
  mergeTests: mergeTests,
};

/**
 * Parses package name from function full name.
 *
 * Function name should be the fully qualified name of a Java function
 * e.g. 'com.diffblue.javademo.TicTacToe.checkTicTacToePosition'
 * => 'com.diffblue.javademo'
 * e.g. 'java::com.diffblue.javademo.TicTacToe.checkTicTacToePosition'
 * => 'com.diffblue.javademo'
 */
function parsePackageNameFromFunctionName(functionName: string): string {
  const prefixRegexp = /^java::/;
  return functionName
  .replace(prefixRegexp, '').split('.').slice(0, -2).join('.');
}

/**
 * Parses class name from function full name.
 *
 * Function name should be the fully qualified name of a Java function
 * e.g. java::com.diffblue.javademo.TicTacToe.checkTicTacToePosition
 * => 'TicTacToe'
 */
function parseClassNameFromFunctionName(functionName: string): string {
  const classNameRegexp = /([^.:]+)[.][^.]*$/;
  const classNameMatch = functionName.match(classNameRegexp);
  if (!classNameMatch) {
    throw new CombinerError(`Can't find classname in ${functionName}`, CombinerErrorCode.NO_CLASS_NAME);
  }
  return classNameMatch[1].replace(/\$/g, '_');
}

/** Validate the results parameter */
function checkResults(results: AnalysisResult[]): void {
  if (!results) {
    throw new CombinerError(
      'Missing required parameter "results"',
      CombinerErrorCode.RESULTS_MISSING,
    );
  }
  if (!Array.isArray(results)) {
    throw new CombinerError(
      '"results" must be an array',
      CombinerErrorCode.RESULTS_TYPE,
    );
  }
  if (!results.length) {
    throw new CombinerError(
      '"results" must not be empty',
      CombinerErrorCode.RESULTS_EMPTY,
    );
  }
  const sourceFilePaths = new Set();
  const classNames = new Set();
  const packageNames = new Set();
  results.forEach(({ testedFunction, sourceFilePath }) => {
    sourceFilePaths.add(sourceFilePath);
    classNames.add(parseClassNameFromFunctionName(testedFunction));
    packageNames.add(parsePackageNameFromFunctionName(testedFunction));
  });
  if (sourceFilePaths.size !== 1) {
    throw new CombinerError(
      'All "results" must have the same "sourceFilePath"',
      CombinerErrorCode.SOURCE_FILE_PATH_DIFFERS,
    );
  }
  if (classNames.size !== 1) {
    throw new CombinerError(
      'All "results" must have a "testedFunction" that produces the same "className" when parsed',
      CombinerErrorCode.CLASS_NAME_DIFFERS,
    );
  }
  if (packageNames.size !== 1) {
    throw new CombinerError(
      'All "results" must have a "testedFunction" that produces the same "packageName" when parsed',
      CombinerErrorCode.PACKAGE_NAME_DIFFERS,
    );
  }
}

/** Validate the existingClass parameter */
function checkExistingClass(existingClass: string): void {
  if (!existingClass) {
    throw new CombinerError(
      'Missing required parameter "existingClass"',
      CombinerErrorCode.EXISTING_CLASS_MISSING,
    );
  }
  if (!isString(existingClass)) {
    throw new CombinerError(
      '"existingClass" must be a string',
      CombinerErrorCode.EXISTING_CLASS_TYPE,
    );
  }
}

/** Map AnalysisResults to ITestData */
export function prepareTestData(results: AnalysisResult[]): ITestData[] {
  return results.map(({
      classAnnotations,
      coveredLines,
      imports,
      sourceFilePath,
      staticImports,
      testBody,
      testId ,
      testName,
    }) => {
    return {
      body: testBody,
      classAnnotations: classAnnotations,
      coveredLines: coveredLines,
      id: testId,
      imports: imports,
      name: testName,
      sourceFilePath: sourceFilePath,
      staticImports: staticImports,
    };
  });
}

/** Create a test class from an array of analysis results */
export function generateTestClass(results: AnalysisResult[]): string {
  checkResults(results);
  const { testedFunction } = results[0];
  const className = parseClassNameFromFunctionName(testedFunction);
  const packageName = parsePackageNameFromFunctionName(testedFunction);
  const testName = `${className}Test`;
  const testData = prepareTestData(results);
  try {
    return dependencies.genTestClass(testData, className, testName, packageName);
  } catch (error) {
    throw new CombinerError(`Unexpected error generating test class:\n${error}`, CombinerErrorCode.GENERATE_ERROR);
  }
}

/** Merge analysis results into an existing test class */
export async function mergeIntoTestClass(existingClass: string, results: AnalysisResult[]): Promise<string> {
  checkExistingClass(existingClass);
  checkResults(results);
  const testData = prepareTestData(results);
  try {
    return await dependencies.mergeTests(existingClass, testData);
  } catch (error) {
    throw new CombinerError(`Unexpected error merging tests:\n${error}`, CombinerErrorCode.MERGE_ERROR);
  }
}

/** AnalysisResults grouped by sourceFilePath */
export interface GroupedResults {
  [testedFunction: string]: AnalysisResult[];
}

/** Group AnalysisResults by sourceFilePath */
export function groupResults(results: AnalysisResult[]): GroupedResults {
  return groupBy(results, 'sourceFilePath');
}

/** Produce a file name from a class name */
export function getFileNameForResult(result: AnalysisResult): string {
  const className = parseClassNameFromFunctionName(result.testedFunction);
  return `${className}Test.java`;
}
