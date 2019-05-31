// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile, writeFile } from 'fs';
import * as inquirer from 'inquirer';
import * as semver from 'semver';
import * as simpleGit from 'simple-git/promise';
import { promisify } from 'util';

import { createChangelog, getUnreleasedChanges } from '../scripts/changelog';
import { Options } from '../utils/argvParser';
import commandLineRunner, { Command, ExpectedError } from '../utils/commandLineRunner';
import logger from '../utils/log';
import multiline from '../utils/multiline';

export const dependencies = {
  writeFile: promisify(writeFile),
  readFile: promisify(readFile),
  simpleGit: simpleGit(),
  exec: promisify(exec),
  inquirer: inquirer,
  logger: logger,
  createChangelog: createChangelog,
  getUnreleasedChanges: getUnreleasedChanges,
};

export const components = {
  repoIsClean: repoIsClean,
  updateAndCheckBranch: updateAndCheckBranch,
  loadPackageJson: loadPackageJson,
  createNewReleaseBranch: createNewReleaseBranch,
  writeChangesToPackageJson: writeChangesToPackageJson,
  commitPackageJsonChange: commitPackageJsonChange,
  createReleasePR: createReleasePR,
  askUserForPatchType: askUserForPatchType,
  checkPrerequisites: checkPrerequisites,
};

const packageJsonFilename = 'package.json';
export const gitFetchOptions = ['--tags'];

/** Assurance that 'releaseType' will be a member of what inquirer.js will return */
type PatchTypeAnswer = {
  releaseType: semver.ReleaseType;
};

/** Assurance that there is a version field */
type PartialPackageJson = {
  version: string;
};

const description = multiline`
  Begins the release process for this module.
  Use --force argument to do a release even if the changelog is empty.
`;

/**
 * Begins the release process
 *
 * Ensures the Git repo is up to date, bumps the version and creates a PR.
 */
export default function createRelease(): Command {
  return async (args: string[], options: Options) => {
    // check that hub is installed and configured correctly
    await components.checkPrerequisites();

    // Make sure develop and master are up to date & get all tags
    dependencies.logger.info('Pulling branches and tags...');
    await components.updateAndCheckBranch('master');
    await components.updateAndCheckBranch('develop');

    await dependencies.simpleGit.checkout('develop');

    // Generate changelog of develop:latest vs master:latest
    const changes = dependencies.getUnreleasedChanges(await dependencies.createChangelog());

    if (changes.length === 0 && !options.force) {
      throw new ExpectedError('No changes detected in changelog. Is there anything to release?');
    }

    // Get version from package.json
    const packageJson = await components.loadPackageJson();
    const originalVersion = packageJson.version;
    dependencies.logger.info(`Current ${packageJsonFilename} version is ${originalVersion}`);

    // Ask user if this is major/minor/patch
    const answer: PatchTypeAnswer = await components.askUserForPatchType();

    // Bump version according to what user said earlier
    const newVersion = incrementVersionNumber(originalVersion, answer);

    // Update the version in the package.json representation
    packageJson.version = newVersion;
    dependencies.logger.info(`New ${packageJsonFilename} version is ${newVersion}`);

    // Make a branch off develop called release/x.y.z
    const newBranchName: string = await components.createNewReleaseBranch(newVersion);

    // Update package.json with the new version and commit so it's included in release
    await components.writeChangesToPackageJson(packageJsonFilename, packageJson);
    await components.commitPackageJsonChange(newVersion);

    // Push to origin and create PR using new branch
    await components.createReleasePR(newBranchName, newVersion, changes);

    return 'Release process began successfully';
  };
}

/**
 * Uses inquirer.js to ask the user what level of release this is
 */
/* istanbul ignore next */
export async function askUserForPatchType(): Promise<PatchTypeAnswer> {
  // ignoring these lines because testing would involve mocking almost the entire function
  return dependencies.inquirer.prompt({
    type: 'list',
    name: 'releaseType',
    message: 'What type of release is this?',
    choices: ['Major', 'Minor', 'Patch'],
    default: 'Patch',
    filter: (val) => val.toLowerCase(),
  });
}

/**
 * Takes a version number and patch type then returns new version number incremented accordingly.
 */
export function incrementVersionNumber(originalVersion: string, patchLevel: PatchTypeAnswer): string {
  const newVersion = semver.inc(originalVersion, patchLevel.releaseType);
  if (newVersion === null) {
    throw new ExpectedError(`Unable to parse and increment version from ${packageJsonFilename}`);
  }
  return newVersion;
}

/**
 * Pushes the new branch up to GitHub and creates a new PR using the GitHub CLI tool.
 */
export async function createReleasePR(newBranchName: string, newVersion: string, changes: string[]): Promise<void> {
  await dependencies.simpleGit.push('origin', newBranchName);

  const title = multiline`
    Release ${newVersion}

    ${changes.join('\n')}
  `;
  // Generate PR using github API and put in changelog
  // Could replace this with an HTTP API request and get rid of the unlabelled dependency on Hub
  await dependencies.exec(`hub pull-request -b master -m "${title}"`);
}

/**
 * Commits the changes to the package.json file to the new branch
 */
export async function commitPackageJsonChange(newVersion: string): Promise<void> {
  await dependencies.simpleGit.add(packageJsonFilename);
  await dependencies.simpleGit.commit(`Bump version to ${newVersion}`);
}

/**
 * Writes the contents of packageJson
 */
export async function writeChangesToPackageJson(filepath: string, packageJson: PartialPackageJson): Promise<void> {
  await dependencies.writeFile(filepath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

/**
 * Creates a new branch in the repo for the release.
 */
export async function createNewReleaseBranch(newVersion: string): Promise<string> {
  const newBranchName = `release/${newVersion}`;
  await dependencies.simpleGit.checkoutLocalBranch(newBranchName);
  return newBranchName;
}

/**
 * Reads the contents of package.json and returns it as an object.
 */
export async function loadPackageJson(): Promise<PartialPackageJson> {
  const packageFile = await dependencies.readFile(packageJsonFilename);
  try {
    const packageJson: PartialPackageJson = JSON.parse(packageFile.toString());
    return packageJson;
  } catch (err) {
    throw new ExpectedError(`Unable to parse ${packageJsonFilename}: ${err}`);
  }
}

/**
 * Returns true if the repo is 'clean'
 */
export async function repoIsClean(): Promise<boolean> {
  const status = await dependencies.simpleGit.status();
  return status.isClean();
}

/**
 * Get the latest version of specified branch from origin, check it out and check if it's dirty.
 */
export async function updateAndCheckBranch(branchName: string): Promise<void> {
  const currentBranchStatus = await dependencies.simpleGit.status();
  if (currentBranchStatus.current === branchName) {
    await dependencies.simpleGit.fetch('origin', branchName, gitFetchOptions);
    dependencies.logger.info([
      `Already checked out '${branchName}'.`,
      'Pulling from origin and checking if dirty.',
    ].join(' '));
    await dependencies.simpleGit.pull();
    if (!await components.repoIsClean()) {
      throw new ExpectedError([
        `Branch '${branchName}' is not clean.`,
        'Please stash or commit your changes before attempting release.',
      ].join(' '));
    }
  } else {
    dependencies.logger.info(`Fetching '${branchName}'...`);
    await dependencies.simpleGit.fetch('origin', `${branchName}:${branchName}`, gitFetchOptions);
  }
}

/**
 * Checks that the script has the necessary prerequsities installed
 */
export async function checkPrerequisites(): Promise<void> {
  try {
    await dependencies.exec('hub status');
  } catch (err) {
    throw new ExpectedError(`Hub prerequisite not installed or not configured correctly: ${err}`);
  }
}

/* istanbul ignore next */
if (require.main === module) {
  commandLineRunner(description, '', process, createRelease());
}
