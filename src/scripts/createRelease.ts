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
  patch_type: semver.ReleaseType;
};

export default async function beginRelease(args: string[], options: Options) {
  const git = simplegit();

  // make sure develop and master are up to date
  // also get all tags
  await git.fetch(['--tags']);
  await git.pull('origin', 'master');
  await git.pull('origin', 'develop');

  // generate changelog of develop:latest vs master:latest
  // show changelog to user
  // const changelog = await createChangelog();
  // console.log(renderChangelog(changelog));

  // ask user if this is major/minor/patch
  var answer: PatchTypeAnswer;
  answer = await inquirer.prompt({
    type: 'list',
    name: 'patch_type',
    message: 'What type of patch is this?',
    choices: ['Major', 'Minor', 'Patch'],
    default: 'Patch',
    filter: function(val) {
      return val.toLowerCase();
    }
  });

  // get version from package.json
  const packageFile = await dependencies.readFile(packageJSONFilename);
  const packageJSON = JSON.parse(packageFile.toString());
  var version = packageJSON.version;
  console.log(`Current package.json version is ${version}`);

  // bump version according to what user said earlier
  version = semver.inc(version, answer.patch_type);
  console.log(`New package.json version is ${version}`);

  // make a branch off develop called release/x.y.z
  const newBranchName = `release/${version}`;
  await git.checkoutBranch(newBranchName, 'develop');

  // commit new version to package.json
  packageJSON.version = version;
  await dependencies.writeFile(packageJSONFilename, JSON.stringify(packageJSON, null, 2));
  await git.add(packageJSONFilename);

  // push to origin
  await git.push('origin', newBranchName);

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
