// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import * as Bluebird from 'bluebird';
import { glob } from 'glob-gitignore';
import { exec } from 'child_process';
import { readFile } from 'fs';
import { join } from 'path';
import { flatten } from 'lodash';

const currentYear = (new Date()).getFullYear();
const copyrightPattern = new RegExp(`Copyright (20\\d\\d-)?${currentYear} Diffblue Limited. All Rights Reserved.`);
const baseIgnoreFiles = ['/.git', '.DS_Store'];

export const dependencies = {
  listFiles: glob,
  readFile: Bluebird.promisify(readFile),
  getIgnoreRules: getIgnoreRules,
  childProcess: Bluebird.promisify(exec),
};

export function parseGitignore(file: string) {
  return file.split(/\r\n|\r|\n/).filter((line) => line && !line.match(/^#/)).map((line) => line.trim());
}

export function containsCopyrightNotice(file: string) {
  return Boolean(file.match(copyrightPattern));
}

/** Catch file not found exceptions and return an empty string */
function catchMissingFile(error: any) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
  return '';
}

/** Maps ignore rules from a nested directory to a parent */
function mapRelativeRules(path: string, rules: string[]) {
  return rules.map((rule) => {
    if (rule.match(/^!?\//) && path !== '.') {
      return '/' + join(path, rule);
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
  return ignoreFiles.filter((file) => file !== '.gitignore');
}

/** Converts nested gitignore file paths into folder paths */
export function getNestedIgnoreRules(ignoreFiles: string[]) {
  return ignoreFiles.map((file) => '/' + file.replace(/\/[^\/]+$/, ''));
}

/** Recursively builds a list of files, checking nested ignore files */
export async function buildFileList(path: string, existingIgnoreRules: string[]): Promise<string[]> {
  const ignoreRules = await dependencies.getIgnoreRules(path, existingIgnoreRules);
  const directories = await dependencies.listFiles(join(path, '*/'), { ignore: ignoreRules, dot: true });
  const files = await dependencies.listFiles(join(path, '*'), { ignore: ignoreRules, nodir: true, dot: true });

  return files.concat(flatten(await Bluebird.mapSeries(directories, async (childDirectory) => {
    return await buildFileList(childDirectory, ignoreRules);
  })));
}

export async function checkCopyright() {
  try {
    const gitFiles = new Set((await dependencies.childProcess('git ls-files') as string).split('\n'));
    const files = (await buildFileList('./src', baseIgnoreFiles)).filter((file) => gitFiles.has(file));
    const fileData = await Bluebird.map(files, (file) => dependencies.readFile(file), { concurrency: 3 });

    const missingFiles = files.filter((data, i) => !containsCopyrightNotice(fileData[i].toString()));
    if (missingFiles.length > 0) {
      throw new Error(`No valid ${currentYear} copyright statement found in: \n${missingFiles.join('\n')}`);
    }

    console.log('Copyright statements up to date!');
  } catch (error) {
    console.error(error.toString());
    process.exit(1);
  }
}

checkCopyright();
