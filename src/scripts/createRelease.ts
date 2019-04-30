// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile, writeFile } from 'fs';
import * as inquirer from 'inquirer';
import * as semver from 'semver';
import * as simplegit from 'simple-git/promise';
import { promisify } from 'util';
import argvParser, { Options } from '../utils/argvParser';
import { createChangelog, renderChangelogVersion } from '../utils/changelog';
import logger from '../utils/log';


const dependencies = {
  writeFile: promisify(writeFile),
  readFile: promisify(readFile),
  git: simplegit(),
  exec: promisify(exec),
};

const packageJSONFilename = 'package.json';

/** Assurance that 'release_type' will be a member of what inquirer.js will return */
type PatchTypeAnswer = {
  release_type: semver.ReleaseType;
};

/**
 * Begins the release process
 *
 * Ensures the Git repo is up to date, bumps the version and creates a PR.
 *
 * @param {string[]} args - Array of command line arguments
 * @param {Options} options - Collection of arguments
 */
export default async function beginRelease(args: string[], options: Options) {
  if (options.help) {
    logger.log(helpMessage());
    return;
  }

  let dryRun = false;
  if (options.dry) {
    dryRun = true;
  }

  // make sure develop and master are up to date
  // also get all tags
  logger.info('Pulling branches and tags...');
  if (!dryRun) {
    await dependencies.git.fetch(['--tags']);
    await dependencies.git.pull('origin', 'master');
    await dependencies.git.pull('origin', 'develop');
  } else {
    logger.info('Would normally pull branches and tags, but skipping due to dry run');
  }

  // generate changelog of develop:latest vs master:latest
  // show changelog to user
  const changelog = await createChangelog();
  let changes = '';
  for (const version of changelog) {
    if (version.version === 'Unreleased') {
      changes = renderChangelogVersion(version).trim();
    }
  }

  // get version from package.json
  const packageFile = await dependencies.readFile(packageJSONFilename);
  const packageJSON = JSON.parse(packageFile.toString());
  let version = packageJSON.version;
  logger.info(`Current package.json version is ${version}`);

  // ask user if this is major/minor/patch
  let answer: PatchTypeAnswer;
  answer = await inquirer.prompt({
    type: 'list',
    name: 'release_type',
    message: 'What type of release is this?',
    choices: ['Major', 'Minor', 'Patch'],
    default: 'Patch',
    filter: (val) => {
      return val.toLowerCase();
    },
  });

  // bump version according to what user said earlier
  version = semver.inc(version, answer.release_type);
  logger.info(`New package.json version is ${version}`);

  // make a branch off develop called release/x.y.z
  const newBranchName = `release/${version}`;
  if (!dryRun) {
    await dependencies.git.checkoutBranch(newBranchName, 'develop');
  } else {
    logger.info('Would normally checkout branch, but skipping due to dry run.');
  }

  // commit new version to package.json
  packageJSON.version = version;
  if (!dryRun) {
    const indentSpacing = 2;
    await dependencies.writeFile(packageJSONFilename, JSON.stringify(packageJSON, null, indentSpacing));
    await dependencies.git.add(packageJSONFilename);
    await dependencies.git.commit(`Bump version to ${version}`);
  } else {
    logger.info('Would normally update package.json and commit it, but skipping due to dry run.');
  }

  // push to origin
  if (!dryRun) {
    await dependencies.git.push('origin', newBranchName);
  } else {
    logger.info('Would normally push release branch to origin, but skipping due to dry run.');
  }

  // generate PR using github API and put in changelog (optional)
  if (!dryRun) {
    await dependencies.exec(`hub pull-request -b master -m "${changes}"`);
  } else {
    logger.info('Would normally create pull request against master, but skipping due to dry run.');
    logger.info(`hub pull-request -b master -m "${changes}"`);
  }
}

/** Returns the help message for the command */
export function helpMessage() {
  return [
    'Description:',
    '  Begins the release process for this module.',
    '  Use --dry argument to avoid changing any files.\n',
    'Usage:',
    '  ts-node createRelease.ts [--dry]',
  ].join('\n');
}

if (require.main === module) {
  const { args, options } = argvParser(process.argv);
  beginRelease(args, options).catch((error) => {
    logger.error(`${helpMessage()}\n${error.toString()}`);
    process.exit(1);
  });
}
