// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import { mapSeries } from 'bluebird';
import { exec } from 'child_process';
import { readFile } from 'fs';
import { glob } from 'glob-gitignore';
import { flatten } from 'lodash';
import { join } from 'path';
import { promisify } from 'util';

import * as logger from '../../src/utils/log';

const currentYear = (new Date()).getFullYear();
const copyrightPattern = new RegExp(`Copyright (20\\d\\d-)?${currentYear} Diffblue Limited. All Rights Reserved.`);
const baseIgnoreFiles = ['/.git', '.DS_Store'];

export const dependencies = {
  listFiles: glob,
  readFile: promisify(readFile),
  getIgnoreRules: getIgnoreRules,
  childProcess: promisify(exec),
};

/** Parse git ignore */
export function parseGitignore(file: string) {
  return file.split(/\r\n|\r|\n/).filter((line) => line && !line.match(/^#/)).map((line) => line.trim());
}

/** Check for the existence of a copyright notice within a file */
export function containsCopyrightNotice(file: string) {
  return Boolean(file.match(copyrightPattern));
}

/** Catch file not found exceptions and return an empty string */
function catchMissingFile(error: NodeJS.ErrnoException) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
  return '';
}

/** Maps ignore rules from a nested directory to a parent */
function mapRelativeRules(path: string, rules: string[]) {
  return rules.map((rule) => {
    if (rule.match(/^!?\//) && path !== '.') {
      return `/${join(path, rule)}`;
    }
    return rule;
  });
}

/** Gets ignore rules from .gitignore and .copyrightignore in a directory, and combines with existing rules */
export async function getIgnoreRules(path: string, existingIgnoreRules: string[]) {
  const gitData = await dependencies.readFile(join(path, '.gitignore')).catch(catchMissingFile);
  const copyrightData = await dependencies.readFile(join(path, '.copyrightignore')).catch(catchMissingFile);
  return [
    ...existingIgnoreRules,
    ...mapRelativeRules(path, parseGitignore(gitData.toString())),
    ...mapRelativeRules(path, parseGitignore(copyrightData.toString())),
  ];
}

/** Gets a list of nested gitignore file paths */
export async function getNestedIgnoreFiles(ignoreList: string[]) {
  const ignoreFiles = await dependencies.listFiles('**/.gitignore', {
    ignore: ignoreList,
    nodir: true,
    dot: true,
  });
  return ignoreFiles.filter((file: string) => file !== '.gitignore');
}

/** Converts nested gitignore file paths into folder paths */
export function getNestedIgnoreRules(ignoreFiles: string[]) {
  return ignoreFiles.map((file) => `/${file.replace(/\/[^\/]+$/, '')}`);
}

/** Recursively builds a list of files, checking nested ignore files */
export async function buildFileList(path: string, existingIgnoreRules: string[]): Promise<string[]> {
  const ignoreRules = await dependencies.getIgnoreRules(path, existingIgnoreRules);
  const directories = await dependencies.listFiles(join(path, '*/'), { ignore: ignoreRules, dot: true });
  const files = await dependencies.listFiles(join(path, '*'), { ignore: ignoreRules, nodir: true, dot: true });

  if (!files) {
    return [];
  }

  return files.concat(flatten(await mapSeries(directories, async (childDirectory) => {
    return buildFileList(childDirectory, ignoreRules);
  })));
}

/** Check for valid copyright statements in all files within ./src */
export async function checkCopyright() {
  try {
    const gitFiles = new Set((await dependencies.childProcess('git ls-files')).stdout.split('\n'));
    const files = (await buildFileList('./src', baseIgnoreFiles)).filter((file) => gitFiles.has(file));
    const fileData = await mapSeries(files, async (file) => dependencies.readFile(file));

    const missingFiles = files.filter((data, i) => fileData[i] && !containsCopyrightNotice(fileData[i].toString()));
    if (missingFiles.length > 0) {
      throw new Error(`No valid ${currentYear} copyright statement found in: \n${missingFiles.join('\n')}`);
    }

    logger.log('Copyright statements up to date!');
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

checkCopyright();
