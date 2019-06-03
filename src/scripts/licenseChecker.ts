// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile, writeFile } from 'fs';
import { groupBy, mapValues, maxBy, padEnd } from 'lodash';
import { promisify } from 'util';

import commandLineRunner, { ExpectedError } from '../utils/commandLineRunner';
import multiline from '../utils/multiline';

/** A dictionary for module licenses */
interface ModuleLicenses {
  [key: string]: Set<string>;
}

/** Details of a command */
export interface Command {
  name: string;
  /** Function to run the command */
  run(filePath: string): Promise<string | undefined | void>;
  help: string;
}

export const dependencies = {
  exec: promisify(exec),
  readFile: promisify(readFile),
  writeFile: promisify(writeFile),
};

export const components = {
  getLicenseInfo: getLicenseInfo,
};

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

/** Get the license information from yarn and return as a json object */
export async function getLicenseInfo(): Promise<string[][]> {
  const data = await dependencies.exec('yarn licenses list --json --no-progress --prod');
  return JSON.parse(data.stdout).data.body;
}

/**
 * Convert the license info returned from yarn into a readable
 * object containing the licenses for each module
 */
export function parseLicenseInfo(licenseInfo: string[][]) {
  const dataByModule = groupBy(licenseInfo, ([name]) => name.toLowerCase());
  return mapValues(dataByModule, (moduleData) => new Set(moduleData.map((data) => data[2].toLowerCase())));
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

  const fileData = mapValues(parseLicenseInfo(licenses), (info) => Array.from(info));

  await dependencies.writeFile(filePath, `${JSON.stringify(fileData, null, 2)}\n`);
  return `File ${filePath} has been generated!`;
}

/** Returns description for the command */
export function getDescription(commands: Command[]) {
  const longestName = maxBy(commands, (command) => command.name.length);
  const padding = longestName ? longestName.name.length : 0;
  const commandList = commands.map((option) => `  ${padEnd(option.name, padding)}  ${option.help}`).join('\n');
  return multiline`
    Generates an acceptable license file containing all licenses in
    npm dependencies by using the yarn command \`yarn licenses\`.
    Can compare this file against the current dependencies for discrepancies.

    Commands:
    ${commandList}
  `;
}

/** Generate or verify a license file */
export default function licenseChecker(commands: Command[]) {
  return async (args: string[]) => {
    const filePath = './acceptable-licenses.json';

    const command = commands.find((searchCommand) => args[0] === searchCommand.name);

    if (command) {
      return command.run(filePath);
    } else {
      throw new ExpectedError('No valid command given');
    }
  };
}

/* istanbul ignore next */
if (require.main === module) {
  commandLineRunner(getDescription(commands), '<command>', process, licenseChecker(commands));
}

