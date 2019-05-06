// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import { filter, mapSeries } from 'bluebird';
import { exec } from 'child_process';
import { readFile } from 'fs';
import { glob as globGitignore } from 'glob-gitignore';
import { flatten } from 'lodash';
import { join } from 'path';
import { promisify } from 'util';

import commandLineRunner, { ExpectedError } from '../utils/commandLineRunner';

/** Interface for the function to check copyright notices */
type CopyrightNoticeCheck = (year: number, content: string) => boolean;

const description = [
  'Checks up to date copyright statements are present in all required files',
  'Ignore files by adding gitignore rules to .copyrightignore',
].join('\n');

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
  const copyrightPattern = new RegExp(`Copyright (?:(\\d{4})-)?(${year}) Diffblue Limited. All Rights Reserved.`);
  const match = content.match(copyrightPattern);
  if (!match) {
    return false;
  }
  // Check for impossible year ranges
  return !match[1] || match[2] >= match[1];
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

  return files.concat(flatten(await mapSeries(directories, async (childDirectory) => {
    return buildFileList(childDirectory, ignoreRules);
  })));
}

/** Check for valid copyright statements in all files within current directory */
export default function copyrightChecker(
  currentYear: number,
  hasCopyrightNotice: CopyrightNoticeCheck,
  baseIgnoreFiles: string[],
) {
  return async () => {
    const gitFiles = await components.getCommittedFiles();
    const files = (await components.buildFileList('.', baseIgnoreFiles)).filter((file) => gitFiles.has(file));
    const missingFiles = await filter(files, async (file) => {
      const fileData = (await dependencies.readFile(file)).toString();
      return !hasCopyrightNotice(currentYear, fileData);
    }, { concurrency: 3 });

    if (missingFiles.length > 0) {
      const missing = missingFiles.map((file) => `  ${file}`).join('\n');
      throw new ExpectedError(`No valid ${currentYear} copyright statement found in:\n${missing}`);
    }

    return 'Copyright statements up to date!';
  };
}

if (require.main === module) {
  commandLineRunner(description, '', copyrightChecker(currentYear, hasCopyrightNotice, baseIgnoreFiles));
}
