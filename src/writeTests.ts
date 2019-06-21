// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { map } from 'bluebird';
import { readFile, writeFile } from 'fs';
import { isEmpty } from 'lodash';
import * as mkdirp from 'mkdirp';
import { join, parse } from 'path';
import { promisify } from 'util';

import {
  generateTestClass,
  getFileNameForResult,
  groupResults,
  mergeIntoTestClass,
} from './combiner';
import { WriterError, WriterErrorCode } from './errors';
import { AnalysisResult, WriteTestsOptions } from './types/types';

export const dependencies = {
  map: map,
  mkdirp: promisify(mkdirp),
  readFile: promisify(readFile),
  writeFile: promisify(writeFile),
};

export const components = {
  generateTestClass: generateTestClass,
  getFileNameForResult: getFileNameForResult,
  mergeIntoTestClass: mergeIntoTestClass,
};

/**
 * Write test files to the specified directory.
 *
 * Checks if test file already exists in the directory for the tested class.
 * If it does, new tests are merged in, otherwise a new file is created.
 */
export default async function writeTests(
  directoryPath: string,
  results: AnalysisResult[],
  options: WriteTestsOptions = {},
): Promise<string[]> {
  const defaultConcurrency = 20;
  const concurrency = options.concurrency || defaultConcurrency;
  try {
    await dependencies.mkdirp(directoryPath);
  } catch (error) {
    throw new WriterError(
      `Could not create the directory ${directoryPath}:\n${error}.`,
      WriterErrorCode.DIR_FAILED,
    );
  }
  const groupedResults = groupResults(results);
  const successPaths: string[] = [];
  const errors: { [sourceFilePath: string]: Error } = {};
  await dependencies.map(Object.entries(groupedResults), async ([sourceFilePath, results]) => {
    try {
      const packagePath = parse(sourceFilePath).dir;
      const fileName = components.getFileNameForResult(results[0]);
      const filePath = join(directoryPath, packagePath, fileName);
      let existingClass: Buffer | undefined;
      let testClass: string;
      try {
        existingClass = await dependencies.readFile(filePath);
      } catch (error) {
        // Ignore the error if the file does not exist, and later call generateTestClass not mergeIntoTestClass
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      if (existingClass) {
        testClass = await components.mergeIntoTestClass(existingClass.toString(), results);
      } else {
        testClass = components.generateTestClass(results);
      }
      await dependencies.writeFile(filePath, testClass);
      successPaths.push(filePath);
    } catch (error) {
      errors[sourceFilePath] = error;
      return;
    }
  }, { concurrency: concurrency });
  if (!isEmpty(errors)) {
    const errorList = Object.entries(errors).map(([sourceFilePath, error]) => {
      return `sourceFilePath: ${sourceFilePath}\n${error}\n`;
    });
    throw new WriterError(
      `Test writing failed for some results:\n${errorList.join('\n')}.`,
      WriterErrorCode.WRITE_FAILED,
    );
  }
  return successPaths.sort();
}
