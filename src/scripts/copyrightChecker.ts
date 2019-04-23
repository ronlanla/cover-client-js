// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import { filter, mapSeries } from 'bluebird';
import { exec } from 'child_process';
import { readFile } from 'fs';
import { glob as globGitignore } from 'glob-gitignore';
import { flatten } from 'lodash';
import { join } from 'path';
import { promisify } from 'util';

import logger from '../utils/log';

/** Interface for the function to check copyright notices */
type CopyrightNoticeCheck = (year: number, content: string) => boolean;

const currentYear = (new Date()).getFullYear();
const baseIgnoreFiles = ['/.git', '.DS_Store'];

export const dependencies = {
  globGitignore: globGitignore,
  readFile: promisify(readFile),
  exec: promisify(exec),
};

export const components = {
  getCommittedFiles: getCommittedFiles,
  buildFileList: buildFileList,
  getIgnoreRules: getIgnoreRules,
};

/** Checks if a copyright notice is present in a document */
export function hasCopyrightNotice(year: number, content: string) {
  const startYearIndex = 1;
  const endYearIndex = 2;
  const copyrightPattern = new RegExp(`Copyright (?:(\\d{4})-)?(${year}) Diffblue Limited. All Rights Reserved.`);
  const match = content.match(copyrightPattern);
  if (!match) {
    return false;
  }
  // Check for impossible year ranges
  return !match[startYearIndex] || match[endYearIndex] >= match[startYearIndex];
}

/** Parse git ignore */
export function parseGitignore(file: string) {
  return file.split(/\r\n|\r|\n/).filter((line) => line && !line.match(/^#/)).map((line) => line.trim());
}

/** Catch file not found exceptions and return an empty string */
export function catchMissingFile(error: NodeJS.ErrnoException) {
  if (error.code === 'ENOENT') {
    return '';
  }
  throw error;
}

/**
 * Maps rules, rewriting root-relative rules to include their full path from a parent directory
 * This is needed because glob-gitignore applies gitignore rules from the root of the project
 */
export function mapRootRelativeRules(path: string, rules: string[]) {
  return rules.map((rule) => {
    if (rule.match(/^!?\//) && path !== '.') {
      return `/${join(path, rule)}`;
    }
    return rule;
  });
}

/** Gets the list of committed files from git */
export async function getCommittedFiles() {
  return new Set((await dependencies.exec('git ls-files')).stdout.split('\n'));
}

/** Gets ignore rules from .gitignore and .copyrightignore in a directory, and combines with existing rules */
export async function getIgnoreRules(path: string, existingIgnoreRules: string[]) {
  const gitData = await dependencies.readFile(join(path, '.gitignore')).catch(catchMissingFile);
  const copyrightData = await dependencies.readFile(join(path, '.copyrightignore')).catch(catchMissingFile);
  return [
    ...existingIgnoreRules,
    ...mapRootRelativeRules(path, parseGitignore(gitData.toString())),
    ...mapRootRelativeRules(path, parseGitignore(copyrightData.toString())),
  ];
}

/** Recursively builds a list of files, checking nested ignore files */
export async function buildFileList(path: string, existingIgnoreRules: string[]): Promise<string[]> {
  const ignoreRules = await components.getIgnoreRules(path, existingIgnoreRules);
  const directories = await dependencies.globGitignore(join(path, '*/'), { ignore: ignoreRules, dot: true });
  const files = await dependencies.globGitignore(join(path, '*'), { ignore: ignoreRules, nodir: true, dot: true });

  if (!files) {
    return [];
  }

  return files.concat(flatten(await mapSeries(directories, async (childDirectory) => {
    return buildFileList(childDirectory, ignoreRules);
  })));
}

/** Check for valid copyright statements in all files within current directory */
export default async function checkCopyright(
  currentYear: number,
  hasCopyrightNotice: CopyrightNoticeCheck,
  baseIgnoreFiles: string[],
) {
  const gitFiles = await components.getCommittedFiles();
  const files = (await components.buildFileList('.', baseIgnoreFiles)).filter((file) => gitFiles.has(file));
  const missingFiles = await filter(files, async (file) => {
    const fileData = (await dependencies.readFile(file)).toString();
    return !hasCopyrightNotice(currentYear, fileData);
  }, { concurrency: 3 });

  if (missingFiles.length > 0) {
    throw new Error(`No valid ${currentYear} copyright statement found in:\n${missingFiles.join('\n')}`);
  }
}

if (require.main === module) {
  checkCopyright(currentYear, hasCopyrightNotice, baseIgnoreFiles).then(() => {
    logger.log('Copyright statements up to date!');
  }).catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}
