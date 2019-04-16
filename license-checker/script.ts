// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { readFile } from 'fs';
import { promisify } from 'util';

const asyncExec = promisify(exec);
const asyncReadFile = promisify(readFile);

// Get the license information from yarn and return this as a string containing json
async function getLicenseInfo() {
  const data = await asyncExec("yarn licenses list --json --no-progress");
  return JSON.parse(data.stdout);
}

async function parseLicenseInfo() {
  const licenseInfo = await getLicenseInfo();
  let found = false;

  if (licenseInfo == '') {
    throw new Error('Could not parse license - empty string provided');
  }

  for (const line in licenseInfo) {
    if (line && licenseInfo['type'] === "table") {
      found = true;
    }
  }

  if (!found) {
    throw new Error('Could not parse license - no line found of "type": "table"');
  }

  const results = {};

  // Get the module name and license out of the json data
  // Create a dictionary of the modules and their licenses
  licenseInfo.data.body.forEach((item) => {
    const module_name = String(item[0]).toLowerCase();
    const license_name = String(item[2]).toLowerCase();

    // Check to see if already listed (modules can appear multiple times if they are dependencies of multiple modules)
    // Some modules may have different license terms depending on how they are included
    if (module_name in results) {

      found = false;
      for (const license in results[module_name]) {
        if (license_name == license) {
          found = true;
        }
      }
      if (!found) {
        results[module_name] += [license_name];
      }
    } else {
      results[module_name] = [license_name];
    }
  });

  return JSON.parse(JSON.stringify(results));
}

// Get the acceptable licenses from the file in the current working
// directory. This is assumed to be the root of the repo
async function loadAcceptableLicenses() {
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
          console.log(`Error: Module "${currentModule}" using license "${license}" not in acceptable licenses`);
        }
      });
    } else {
      hasError = true;
      console.log(`Error: Module "${currentModule}" is not in acceptable licenses`);
    }
  })
    
  if (hasError) {
    throw new Error('License check generated error(s)');
  } else {
    console.log('Licenses OK!')
  }
}

const padRight = (str, length) => {
  let x = '';
  for (let i = 0; i < length; i++) {
    x += ' ';
  } 
  const padding = str.length < x.length ? x.length - str.length : 0;
  return str + x.substr(0, padding);
};

// Main function
async function main() {
  const usableCommands = [
    { command: 'licenses-verify', help: 'Check against reference file' },
    { command: 'licenses-generate-file', help: 'Print the license info' },
  ];

  // Valid arguments
  const helpArg = process.argv.includes('--help');
  const checkArg = process.argv.includes(usableCommands[0].command);
  const genArg = process.argv.includes(usableCommands[1].command);

  // Print out the usage
  try {
    if (helpArg) {
      console.log("This script gets the license information for modules added by yarn\n" +
        "The list can be compared against a reference list to see if there is additional licensing impact\n\n" +
        "Usage: ts-node ./license-checker/script.ts [argument]\n\nOptions:");
      return usableCommands.forEach((option) => console.log(`  ${padRight(option.command, 32)}${option.help}`));
    } else if (checkArg) {
      const acceptableLicenses = await loadAcceptableLicenses();
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
    console.log(error.toString());
  }
}
  
main();
