// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile, writeFile } from 'fs';
import * as inquirer from 'inquirer';
import * as semver from 'semver';
import * as simpleGit from 'simple-git/promise';
import { promisify } from 'util';
import argvParser, { Options } from '../utils/argvParser';
import { createChangelog, renderChangelogVersion } from '../utils/changelog';
import logger from '../utils/log';


const dependencies = {
  writeFile: promisify(writeFile),
  readFile: promisify(readFile),
  simpleGit: simpleGit(),
  exec: promisify(exec),
};

const packageJsonFilename = 'package.json';

/** Assurance that 'release_type' will be a member of what inquirer.js will return */
type PatchTypeAnswer = {
  releaseType: semver.ReleaseType;
};

/**
 * Begins the release process
 *
 * Ensures the Git repo is up to date, bumps the version and creates a PR.
 */
export default async function createRelease(args: string[], options: Options) {
  if (options.help) {
    logger.log(helpMessage());
    return undefined;
  }
  const forceRelease = Boolean(options.force);

  // Make sure develop and master are up to date & get all tags
  logger.info('Pulling branches and tags...');
  await dependencies.simpleGit.fetch(['--tags']);
  await dependencies.simpleGit.pull('origin', 'master');
  await dependencies.simpleGit.pull('origin', 'develop');

  logger.info('Checking out \'develop\` and making sure branch is clean');
  await dependencies.simpleGit.checkoutLocalBranch('develop');
  const developStatus = await dependencies.simpleGit.status();
  if (!developStatus.isClean()) {
    logger.error('Branch \'develop\' is not clean. Please stash or commit your changes before attempting release');
    return 1;
  }

  // Generate changelog of develop:latest vs master:latest
  const changelog = await createChangelog();
  const changes = (
    changelog
    .filter((version) => version.version === 'Unreleased')
    .map((version) => renderChangelogVersion(version).trim())
  );

  if (changes.length === 0 && !forceRelease) {
    logger.error('No changes detected in changelog. Is there anything to release?');
    return 1;
  }

  // Get version from package.json
  const packageFile = await dependencies.readFile(packageJsonFilename)
  .catch((err) => {
    logger.error(`Unable to read ${packageJsonFilename}: ${err}`);
    return 1;
  });
  const packageJson = JSON.parse(packageFile.toString());
  const originalVersion = packageJson.version;
  logger.info(`Current ${packageJsonFilename} version is ${originalVersion}`);

  // Ask user if this is major/minor/patch
  const answer: PatchTypeAnswer = await inquirer.prompt({
    type: 'list',
    name: 'releaseType',
    message: 'What type of release is this?',
    choices: ['Major', 'Minor', 'Patch'],
    default: 'Patch',
    filter: (val) => val.toLowerCase(),
  });

  // Bump version according to what user said earlier
  const newVersion = semver.inc(originalVersion, answer.releaseType);
  logger.info(`New ${packageJsonFilename} version is ${newVersion}`);

  // Make a branch off develop called release/x.y.z
  const newBranchName = `release/${newVersion}`;
  await dependencies.simpleGit.checkoutBranch(newBranchName, 'develop');

  // Commit new version to package.json
  packageJson.version = newVersion;
  const indentSpacing = 2;
  await dependencies.writeFile(packageJsonFilename, JSON.stringify(packageJson, null, indentSpacing))
  .catch((err) => {
    logger.error(`Unable to write ${packageJsonFilename}: ${err}`);
    return 1;
  });
  await dependencies.simpleGit.add(packageJsonFilename);
  await dependencies.simpleGit.commit(`Bump version to ${newVersion}`);

  // Push to origin
  await dependencies.simpleGit.push('origin', newBranchName);

  // Generate PR using github API and put in changelog (optional)
  await dependencies.exec(
    `hub pull-request -b master -m "Release ${newVersion}

${changes}"`);

  return 0;
}

/** Returns the help message for the command */
export function helpMessage() {
  return [
    'Description:',
    '  Begins the release process for this module.',
    '  Use --force argument to do a release even if the changelog is empty.\n',
    'Usage:',
    '  ts-node createRelease.ts [--force]',
  ].join('\n');
}

if (require.main === module) {
  const { args, options } = argvParser(process.argv);
  createRelease(args, options).catch((error) => {
    logger.error(`${helpMessage()}\n${error.toString()}`);
    process.exit(1);
  });
}
