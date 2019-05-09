// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { readFile } from 'fs';
import { promisify } from 'util';

export const dependencies = {
  readFile: promisify(readFile),
};

/** Loads and parses the package.json file */
export default async function getPackageJson() {
  return JSON.parse((await dependencies.readFile('./package.json')).toString());
}
