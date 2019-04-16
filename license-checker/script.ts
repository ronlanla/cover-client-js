// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile, writeFile } from 'fs';
import { groupBy, mapValues, padEnd } from 'lodash';
import { promisify } from 'util';

import * as logger from '../src/utils/log';

/** A dictionary for module licenses */
interface ModuleLicenses {
  [key: string]: Set<string>;
}

const asyncExec = promisify(exec);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);

/** Get the license information from yarn and return as a json object */
async function getLicenseInfo() {
  const data = await asyncExec('yarn licenses list --json --no-progress');
  return JSON.parse(data.stdout).data.body;
}

/**
 * Convert the license info returned from yarn into a readable
 * object containing the licenses for each module
 */
function parseLicenseInfo(licenseInfo: string[][]) {
  const license = 2;
  const dataByModule = groupBy(licenseInfo, ([name]) => name.toLowerCase());
  return mapValues(dataByModule, (moduleData) => new Set(moduleData.map((data) => data[license].toLowerCase())));
}

/**
 * Get the acceptable licenses from the file in the current working
 * directory. This is assumed to be the root of the repo
 */
async function loadJsonFile(filePath: string) {
  const fileData = JSON.parse((await asyncReadFile(filePath)).toString());
  return mapValues(fileData, (licenses: string[]) => new Set(licenses));
}

/** Check to see if the current license list is acceptable */
function checkLicenses(acceptableList: ModuleLicenses, currentList: ModuleLicenses) {
  let hasError = false;
  Object.keys(currentList).forEach((currentModule) => {
    if (acceptableList[currentModule]) {
      currentList[currentModule].forEach((license: string) => {
        if (!acceptableList[currentModule].has(license)) {
          hasError = true;
          logger.error(`Missing: Module "${currentModule}" using license "${license}" not in acceptable licenses`);
        }
      });
    } else {
      hasError = true;
      logger.error(`Missing: Module "${currentModule}" is not in acceptable licenses`);
    }
  });
  if (hasError) {
    throw new Error('License check generated error(s)');
  } else {
    logger.log('Licenses OK!');
  }
}

/** Generate or verify a license file */
async function main() {
  const filePath = './acceptable_license_file.json';
  const commands = [
    { command: 'check-file', help: 'Check acceptable license file against npm dependencies' },
    { command: 'generate-file', help: 'Generate acceptable license file from npm dependencies' },
  ];

  // Valid arguments
  const helpArg = process.argv.includes('--help');
  const checkArg = process.argv.includes(commands[0].command);
  const genArg = process.argv.includes(commands[1].command);

  try {
    if (helpArg) {
      logger.log([
        'Generates an acceptable license file containing all licenses in ',
        'npm dependencies by using the yarn command `yarn licenses`.',
        'Can compare this file against the current dependencies for discrepancies.\n',
        'Usage: ts-node ./license-checker/script.ts <command> [--help]\n',
        'Commands:',
      ].join('\n'));

      const padding = 24;
      return commands.forEach((option) => logger.log(`  ${padEnd(option.command, padding)}${option.help}`));
    } else if (checkArg) {
      const licenses = await getLicenseInfo();
      const acceptableLicenses = await loadJsonFile(filePath);

      checkLicenses(acceptableLicenses, parseLicenseInfo(licenses));
    } else if (genArg) {
      const licenses = await getLicenseInfo();

      const padding = 2;
      const fileData = mapValues(parseLicenseInfo(licenses), (info) => Array.from(info));

      await asyncWriteFile(filePath, `${JSON.stringify(fileData, null, padding)}\n`);
      logger.log(`File ${filePath} has been generated!`);
    } else {
      throw new Error('No valid command given');
    }
  } catch (error) {
    logger.error(error);
    return process.exit(1);
  }
}

main();
