// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { genTestClass, ITestData, mergeTests } from '@diffblue/java-combiner';

import { CombinerError, CombinerErrorCodes } from './errors';

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
  .replace(prefixRegexp, '').split('.').slice(0, -2).join('.');  // tslint:disable-line:no-magic-numbers
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
    throw new CombinerError(`Can't find classname in ${functionName}`, CombinerErrorCodes.NO_CLASS_NAME);
  }
  return classNameMatch[1].replace(/\$/g, '_');
}

/** Validate the results parameter */
function checkResults(results: any[]): void { // tslint:disable-line:no-any // TYPE AnalysisResult[]
  if (!results) {
    throw new CombinerError(
      'Missing required parameter "results"',
      CombinerErrorCodes.RESULTS_MISSING,
    );
  }
  if (!Array.isArray(results)) {
    throw new CombinerError(
      '"results" must be an array',
      CombinerErrorCodes.RESULTS_TYPE,
    );
  }
  if (!results.length) {
    throw new CombinerError(
      '"results" must not be empty',
      CombinerErrorCodes.RESULTS_EMPTY,
    );
  }
  const sourceFilePaths = new Set(results.map((result) => result.sourceFilePath));
  if (sourceFilePaths.size !== 1) {
    throw new CombinerError(
      'All "results" must have the same "sourceFilePath"',
      CombinerErrorCodes.SOURCE_FILE_DIFFERS,
    );
  }
  const testedFunctions = new Set(results.map((result) => result.testedFunction));
  if (testedFunctions.size !== 1) {
    throw new CombinerError(
      'All "results" must have the same "testedFunction"',
      CombinerErrorCodes.TESTED_FUNCTION_DIFFERS,
    );
  }
}

/** Validate the existingClass parameter */
function checkExistingClass(existingClass: string): void {
  if (!existingClass) {
    throw new CombinerError(
      'Missing required parameter "existingClass"',
      CombinerErrorCodes.EXISTING_CLASS_MISSING,
    );
  }
  if (typeof existingClass !== 'string') {  // tslint:disable-line:strict-type-predicates
    throw new CombinerError(
      '"existingClass" must be a string',
      CombinerErrorCodes.EXISTING_CLASS_TYPE,
    );
  }
}

/** Map AnalysisResults to ITestData */
export function prepareTestData(results: any[]): ITestData[] { // tslint:disable-line:no-any  max-line-length // TYPE AnalysisResult[]
  return results.map(({ classAnnotations, imports, staticImports, testName, testBody }) => {
    return {
      name: testName,
      test: testBody,
      classAnnotations: classAnnotations,
      imports: imports,
      staticImports: staticImports,
    };
  });
}

/** Create a test class from an array of analysis results */
export function generateTestClass(results: any[]): string { // tslint:disable-line:no-any // TYPE AnalysisResult[]
  checkResults(results);
  const testedFunction = results[0].testedFunction;
  const className = parseClassNameFromFunctionName(testedFunction);
  const packageName = parsePackageNameFromFunctionName(testedFunction);
  const testSuffix = 'Test';
  const testName = `${className}${testSuffix}`;
  const testData = prepareTestData(results);
  try {
    return dependencies.genTestClass(testData, className, testName, packageName);
  } catch (error) {
    throw new CombinerError(`Unexpected error generating test class:\n${error}`, CombinerErrorCodes.GENERATE_ERROR);
  }
}

/** Merge analysis results into a an existing test class */
export async function mergeIntoTestClass(existingClass: string, results: any[]): Promise<string> { // tslint:disable-line:no-any max-line-length // TYPE AnalysisResult[]
  checkExistingClass(existingClass);
  checkResults(results);
  const testData = prepareTestData(results);
  try {
    return await dependencies.mergeTests(existingClass, testData);
  } catch (error) {
    throw new CombinerError(`Unexpected error merging tests:\n${error}`, CombinerErrorCodes.MERGE_ERROR);
  }
}
