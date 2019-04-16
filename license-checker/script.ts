// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile, writeFile } from 'fs';
import { padEnd } from 'lodash';
import { promisify } from 'util';

import * as logger from '../src/utils/log';

/** String dictionary */
interface SDictionary {
  [key: string]: string[];
}

const asyncExec = promisify(exec);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);

/** Get the license information from yarn and return this as a string containing json */
async function getLicenseInfo() {
  const data = await asyncExec('yarn licenses list --json --no-progress');
  return JSON.parse(data.stdout).data.body;
}

/**
 * Convert the license info returned from yarn into a readable
 * object containing the licenses for each module
 */
async function parseLicenseInfo() {
  const results: SDictionary = {};

  // Get the module names and licenses from the json data
  const data = (await getLicenseInfo()).map(([name, version, license]: string[]) => {
    return [name.toLowerCase(), license.toLowerCase()];
  });

  // Create a set from the modules and map the licenses to them
  // Some modules may have different license terms depending on how they are included
  const modules = new Set(data.map(([name]: string[]) => name));
  modules.forEach((moduleName: string) => {
    for (const [name, license] of data) {
      if (moduleName === name) {
        if (results[moduleName] && !results[moduleName].includes(license)) {
          results[moduleName].push(license);
        } else {
          results[moduleName] = [license];
        }
      }
    }
  });

  return results;
}

/**
 * Get the acceptable licenses from the file in the current working
 * directory. This is assumed to be the root of the repo
 */
async function loadJsonFile(filePath: string) {
  const data = await asyncReadFile(filePath);
  return JSON.parse(data.toString());
}

/** Check to see if the current license list is acceptable */
function checkLicenses(acceptableList: SDictionary, currentList: SDictionary) {
  let hasError = false;
  Object.keys(currentList).forEach((currentModule) => {
    if (Object.keys(acceptableList).includes(currentModule)) {
      currentList[currentModule].forEach((license: string) => {
        if (!acceptableList[currentModule].includes(license)) {
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
      const currentLicenses = await parseLicenseInfo();
      const acceptableLicenses = await loadJsonFile(filePath);

      checkLicenses(acceptableLicenses, currentLicenses);
    } else if (genArg) {
      const currentLicenses = await parseLicenseInfo();

      const padding = 2;
      const data = `${JSON.stringify(currentLicenses, null, padding)}\n`;

      await asyncWriteFile(filePath, data);
      logger.log(`File ${filePath} has been generated!`);
    } else {
      throw new Error('No valid command given');
    }
  } catch (error) {
    logger.error(error.toString());
    return process.exit(1);
  }
}

main();
