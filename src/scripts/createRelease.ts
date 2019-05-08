// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile, writeFile } from 'fs';
import * as inquirer from 'inquirer';
import * as semver from 'semver';
import * as simpleGit from 'simple-git/promise';
import { promisify } from 'util';
import { createChangelog, renderChangelogVersion } from '../utils/changelog';
import commandLineRunner, { ExpectedError } from '../utils/commandLineRunner';
import logger from '../utils/log';


export const dependencies = {
  writeFile: promisify(writeFile),
  readFile: promisify(readFile),
  simpleGit: simpleGit(),
  exec: promisify(exec),
  inquirer: inquirer,
};

const packageJsonFilename = 'package.json';

/** Assurance that 'releaseType' will be a member of what inquirer.js will return */
type PatchTypeAnswer = {
  releaseType: semver.ReleaseType;
};

const description = [
  'Begins the release process for this module.',
  'Use --force argument to do a release even if the changelog is empty.',
].join('\n');

/**
 * Begins the release process
 *
 * Ensures the Git repo is up to date, bumps the version and creates a PR.
 */
export default function createRelease(
    forceRelease: boolean,
  ) {
  return async () => {
    // Make sure develop and master are up to date & get all tags
    logger.info('Pulling branches and tags...');
    await pullBranchesAndTags();

    // Generate changelog of develop:latest vs master:latest
    const changes = await getListOfUnreleasedChanges();

    if (changes.length === 0 && !forceRelease) {
      throw new ExpectedError('No changes detected in changelog. Is there anything to release?');
    }

    // Get version from package.json
    const packageJson = await loadPackageJson();
    const originalVersion = packageJson.version;
    logger.info(`Current ${packageJsonFilename} version is ${originalVersion}`);

    // Ask user if this is major/minor/patch
    const answer: PatchTypeAnswer = await dependencies.inquirer.prompt({
      type: 'list',
      name: 'releaseType',
      message: 'What type of release is this?',
      choices: ['Major', 'Minor', 'Patch'],
      default: 'Patch',
      filter: (val) => val.toLowerCase(),
    });

    // Bump version according to what user said earlier
    const newVersion = semver.inc(originalVersion, answer.releaseType) || '-1';
    if (newVersion === '-1') {
      throw new ExpectedError(`Unable to parse and increment version from ${packageJsonFilename}`);
    }

    // Update the version in the package.json representation
    packageJson.version = newVersion;
    logger.info(`New ${packageJsonFilename} version is ${newVersion}`);

    // Make a branch off develop called release/x.y.z
    const newBranchName: string = await createNewReleaseBranch(newVersion);

    // Commit new version to package.json
    await writeChangesToPackageJson(packageJsonFilename, packageJson);

    await commitPackageJsonChange(newVersion);

    // Push to origin and create PR using new branch
    await createReleasePR(newBranchName, newVersion, changes);

    return 'Release process began successfully';
  };
}

/**
 * Pushes the new branch up to GitHub and creates a new PR using the GitHub CLI tool.
 */
async function createReleasePR(newBranchName: string, newVersion: string, changes: string[]) {
  await dependencies.simpleGit.push('origin', newBranchName);
  // Generate PR using github API and put in changelog (optional)
  await dependencies.exec(
    [
      `hub pull-request -b master -m "Release ${newVersion}`,
      '',
      `${changes}"`,
    ].join('\n'),
  );
}

/**
 * Commits the changes to the package.json file to the new branch
 */
async function commitPackageJsonChange(newVersion: string) {
  await dependencies.simpleGit.add(packageJsonFilename);
  await dependencies.simpleGit.commit(`Bump version to ${newVersion}`);
}

/**
 * Writes the contents of packageJson to filename.
 */
async function writeChangesToPackageJson(filename: string, packageJson: JSON) {
  const indentSpacing = 2;
  await dependencies.writeFile(filename, JSON.stringify(packageJson, null, indentSpacing))
  .catch((err) => {
    throw new ExpectedError(`Unable to write ${filename}`);
  });
}

/**
 * Creates a new branch in the repo for the release.
 */
async function createNewReleaseBranch(newVersion: string) {
  const newBranchName = `release/${newVersion}`;
  await dependencies.simpleGit.checkoutBranch(newBranchName, 'develop');
  return newBranchName;
}

/**
 * Reads the contents of package.json and returns it as an object.
 */
async function loadPackageJson() {
  const packageFile = await dependencies.readFile(packageJsonFilename)
    .catch((err) => {
      throw new ExpectedError(`Unable to read ${packageJsonFilename}`);
    });
  const packageJson = JSON.parse(packageFile.toString());
  return packageJson;
}

/**
 * Uses changelog.ts to generate a string representation of the unreleased changes since the last release.
 */
async function getListOfUnreleasedChanges() {
  const changelog = await createChangelog();
  const changes = (changelog
    .filter((version) => version.version === 'Unreleased')
    .map((version) => renderChangelogVersion(version).trim()));
  return changes;
}

/**
 * Fetches a clean version of the relevant branches and tags with which to perform the release.
 */
async function pullBranchesAndTags() {
  await dependencies.simpleGit.fetch(['--tags']);
  await dependencies.simpleGit.pull('origin', 'master');
  await dependencies.simpleGit.pull('origin', 'develop');
  logger.info('Checking out \'develop\` and making sure branch is clean...');
  await dependencies.simpleGit.checkoutLocalBranch('develop');
  const developStatus = await dependencies.simpleGit.status();
  if (!developStatus.isClean()) {
    throw new ExpectedError([
      'Branch \'develop\' is not clean.',
      'Please stash or commit your changes before attempting release.',
    ].join(' '));
  }
}

if (require.main === module) {
  commandLineRunner(description, '', createRelease(forceRelease));
}
