// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { readFile, writeFile } from 'fs';
import { promisify } from 'util';
import * as simplegit from 'simple-git/promise';
import * as inquirer from 'inquirer';
import * as semver from 'semver';

import argvParser, { Options } from '../utils/argvParser';
// import { createChangelog, renderChangelog } from '../utils/changelog';
import logger from '../utils/log';

const dependencies = {
  writeFile: promisify(writeFile),
  readFile: promisify(readFile),
};

const packageJSONFilename = 'package.json';

type PatchTypeAnswer = {
  release_type: semver.ReleaseType;
};

export default async function beginRelease(args: string[], options: Options) {
  if (options.help) {
    logger.log(helpMessage());
    return;
  }

  var dryRun:boolean = false;
  if(options.dry) {
    dryRun = true;
  }

  const git = simplegit();

  // make sure develop and master are up to date
  // also get all tags
  logger.info("Pulling branches and tags...");
  await git.fetch(['--tags']);
  await git.pull('origin', 'master');
  await git.pull('origin', 'develop');

  // generate changelog of develop:latest vs master:latest
  // show changelog to user
  // const changelog = await createChangelog();
  // console.log(renderChangelog(changelog));

  // get version from package.json
  const packageFile = await dependencies.readFile(packageJSONFilename);
  const packageJSON = JSON.parse(packageFile.toString());
  var version = packageJSON.version;
  logger.info(`Current package.json version is ${version}`);

  // ask user if this is major/minor/patch
  var answer: PatchTypeAnswer;
  answer = await inquirer.prompt({
    type: 'list',
    name: 'release_type',
    message: 'What type of release is this?',
    choices: ['Major', 'Minor', 'Patch'],
    default: 'Patch',
    filter: function(val) {
      return val.toLowerCase();
    }
  });

  // bump version according to what user said earlier
  version = semver.inc(version, answer.release_type);
  logger.info(`New package.json version is ${version}`);

  // make a branch off develop called release/x.y.z
  const newBranchName = `release/${version}`;
  if (!dryRun) {
    await git.checkoutBranch(newBranchName, 'develop');
  } else {
    logger.info('Would normally checkout branch, but skipping due to dry run.');
  }

  // commit new version to package.json
  packageJSON.version = version;
  if (!dryRun) {
    await dependencies.writeFile(packageJSONFilename, JSON.stringify(packageJSON, null, 2));
    await git.add(packageJSONFilename);
    await git.commit(`Bump package.json to ${version}`);
  } else {
    logger.info('Would normally update package.json and commit it, but skipping due to dry run.')
  }

  // push to origin
  if (!dryRun) {
    await git.push('origin', newBranchName);
  } else {
    logger.info('Would normally push release branch to origin, but skipping due to dry run.');
  }

  // generate PR using github API and put in changelog (optional)
}

/** Returns the help message for the command */
export function helpMessage() {
  return [
    'Description:',
    '  Begins the release process for this module.\n',
    'Usage:',
    `  ts-node createRelease.ts`,
  ].join('\n');
}

if (require.main === module) {
  const { args, options } = argvParser(process.argv);
  beginRelease(args, options).catch((error) => {
    logger.error(`${helpMessage()}\n${error.toString()}`);
    process.exit(1);
  });
}
