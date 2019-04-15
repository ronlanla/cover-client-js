// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile } from 'fs';
import { padEnd } from 'lodash';
import { promisify, isArray } from 'util';


const asyncExec = promisify(exec);
const asyncReadFile = promisify(readFile);

// Get the license information from yarn and return this as a string containing json
async function getLicenseInfo() {
  const data = await asyncExec("yarn licenses list --json --no-progress");
  return JSON.parse(data.stdout).data;
}

async function parseLicenseInfo() {
  const results = {};

  // Get the module names and licenses from the json data
  const data = await getLicenseInfo();

  // Create a set from the modules and map the licenses to them
  // Some modules may have different license terms depending on how they are included
  const modules = new Set(data.body.map((item) => item[0].toLowerCase()));
  modules.forEach((moduleName: string) => {
    for (let i = 0; i < data.body.length; i++) {
      if (moduleName === data.body[i][0]) {
        const license = data.body[i][2].toLowerCase();
        if (isArray(results[moduleName])) {
          results[moduleName].push(license);
        } else {
          results[moduleName] = [license];
        }
      }
    }
  });

  return JSON.parse(JSON.stringify(results));
}

// Get the acceptable licenses from the file in the current working
// directory. This is assumed to be the root of the repo
async function loadJsonFile() {
  const data = await asyncReadFile('./acceptable_license_file.json');
  return JSON.parse(data.toString());
}

// Check to see if the current license list is acceptable
function checkLicenses(acceptableList, currentList) {
  let hasError = false;
  Object.keys(currentList).forEach((currentModule) => {
    if (Object.keys(acceptableList).includes(currentModule)) {
      currentList[currentModule].forEach((license) => {
        if (!acceptableList[currentModule].includes(license)) {
          hasError = true;
          console.error(`Error: Module "${currentModule}" using license "${license}" not in acceptable licenses`);
        }
      });
    } else {
      hasError = true;
      console.error(`Error: Module "${currentModule}" is not in acceptable licenses`);
    }
  })
    
  if (hasError) {
    throw new Error('License check generated error(s)');
  } else {
    console.log('Licenses OK!')
  }
}

// Main function
async function main() {
  const commands = [
    { command: 'verify-file', help: 'Check against reference file' },
    { command: 'generate-file', help: 'Print the license info' },
  ];

  // Valid arguments
  const helpArg = process.argv.includes('--help');
  const checkArg = process.argv.includes(commands[0].command);
  const genArg = process.argv.includes(commands[1].command);

  // Print out the usage
  try {
    if (helpArg) {
      console.log([
        "This script gets the license information for modules added by yarn",
        "The list can be compared against a reference list to see if there is additional licensing impact\n",
        "Usage: ts-node ./license-checker/script.ts [argument]\n",
        "Options:"
      ].join('\n'));
      return commands.forEach((option) => console.log(`  ${padEnd(option.command, 32)}${option.help}`));
    } else if (checkArg) {
      const acceptableLicenses = await loadJsonFile();
      const currentLicenses = await parseLicenseInfo();
      checkLicenses(acceptableLicenses, currentLicenses);
    } else if (genArg) {
      // Print out the current information. Useful for creating the reference file.
      // NOTE: printed out as pretty json to allow for easier code reviews
      const currentLicenses = JSON.stringify(await parseLicenseInfo(), null, 2);
      console.log(currentLicenses);
    } else {
      throw new Error('No valid arguments given');
    }
  } catch (error) {
    console.error(error);
  }
}
  
main();
