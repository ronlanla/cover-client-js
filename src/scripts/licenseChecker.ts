// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile, writeFile } from 'fs';
import { groupBy, mapValues } from 'lodash';
import { promisify } from 'util';

import * as logger from '../utils/log';

/** A dictionary for module licenses */
interface ModuleLicenses {
  [key: string]: Set<string>;
}

/** Details of a command */
export interface Command {
  name: string;
  /** Function to run the command */
  run(filePath: string): Promise<string | void>;
  help: string;
}

/** An error which part of normal operation  */
class ExpectedError extends Error {
  public constructor(message: string) {
    super(message);
    // Work around TypeScript bug because we are transpiling to ES5
    Object.setPrototypeOf(this, ExpectedError.prototype);
  }
}

const commands: Command[] = [
  {
    name: 'check-file',
    run: checkLicenses,
    help: 'Check acceptable license file against npm dependencies',
  },
  {
    name: 'generate-file',
    run: generateAcceptableLicenses,
    help: 'Generate acceptable license file from npm dependencies',
  },
];

export const dependencies = {
  exec: promisify(exec),
  readFile: promisify(readFile),
  writeFile: promisify(writeFile),
};

export const components = {
  getLicenseInfo: getLicenseInfo,
};

/** Get the license information from yarn and return as a json object */
export async function getLicenseInfo(): Promise<string[][]> {
  const data = await dependencies.exec('yarn licenses list --json --no-progress');
  return JSON.parse(data.stdout).data.body;
}

/**
 * Convert the license info returned from yarn into a readable
 * object containing the licenses for each module
 */
export function parseLicenseInfo(licenseInfo: string[][]) {
  const licenseIndex = 2;
  const dataByModule = groupBy(licenseInfo, ([name]) => name.toLowerCase());
  return mapValues(dataByModule, (moduleData) => new Set(moduleData.map((data) => data[licenseIndex].toLowerCase())));
}

/**
 * Get the acceptable licenses from the file in the current working
 * directory. This is assumed to be the root of the repo
 */
export async function loadAcceptableLicenses(filePath: string) {
  const fileData = JSON.parse((await dependencies.readFile(filePath)).toString());
  return mapValues(fileData, (licenses: string[]) => new Set(licenses));
}

/** Check to see if the current license list is acceptable */
export function findMissingLicenses(acceptableList: ModuleLicenses, currentList: ModuleLicenses) {
  const missing: string[] = [];
  Object.keys(currentList).forEach((currentModule) => {
    if (acceptableList[currentModule]) {
      currentList[currentModule].forEach((license: string) => {
        if (!acceptableList[currentModule].has(license)) {
          missing.push(`Module "${currentModule}" using license "${license}" not in acceptable licenses`);
        }
      });
    } else {
      missing.push(`Module "${currentModule}" is not in acceptable licenses`);
    }
  });
  return missing;
}

/** Checks licenses against the acceptable license file */
export async function checkLicenses(filePath: string) {
  const licenses = parseLicenseInfo(await components.getLicenseInfo());
  const acceptableLicenses = await loadAcceptableLicenses(filePath);

  const missingLicenses = findMissingLicenses(acceptableLicenses, licenses);
  if (missingLicenses.length > 0) {
    const list = missingLicenses.map((missing) => `- ${missing}`).join('\n');
    throw new ExpectedError(`Licenses missing from acceptable list:\n ${list}`);
  }
}

/** Generates an acceptable license file */
export async function generateAcceptableLicenses(filePath: string) {
  const licenses = await components.getLicenseInfo();

  const padding = 2;
  const fileData = mapValues(parseLicenseInfo(licenses), (info) => Array.from(info));

  await dependencies.writeFile(filePath, `${JSON.stringify(fileData, null, padding)}\n`);
  return `File ${filePath} has been generated!`;
}

/** Returns the help message for the command */
export function helpMessage(commands: Command[]) {
  return [
    'Generates an acceptable license file containing all licenses in',
    'npm dependencies by using the yarn command `yarn licenses`.',
    'Can compare this file against the current dependencies for discrepancies.\n',
    'Usage: ts-node ./license-checker/script.ts <command> [--help]\n',
    'Commands:',
    ...commands.map((option) => `  ${option.name} - ${option.help}`),
  ].join('\n');
}

/** Generate or verify a license file */
export default async function licenseChecker(commands: Command[], args: string[]) {
  const filePath = './acceptable-licenses.json.json';

  const command = commands.find((searchCommand) => args.includes(searchCommand.name));

  if (args.includes('--help')) {
    return helpMessage(commands);
  }

  if (command) {
    return command.run(filePath);
  } else {
    throw new ExpectedError(`No valid command given\n\n${helpMessage(commands)}`);
  }
}

if (require.main === module) {
  licenseChecker(commands, process.argv).then((message) => {
    if (message) {
      logger.log(message);
    }
  }).catch((error) => {
    // Only show the stack trace for unexpected errors
    logger.error(error instanceof ExpectedError ? error.toString() : error);
    return process.exit(1);
  });
}
