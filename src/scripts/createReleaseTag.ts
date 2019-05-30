// Copyright 2019 Diffblue Limited. All Rights Reserved.

import commandLineRunner from '../utils/commandLineRunner';
import getPackageJson from '../utils/getPackageJson';
import spawn from '../utils/spawnProcess';

export const dependencies = {
  getPackageJson: getPackageJson,
  spawn: spawn,
};

/** Creates and pushes a tag for the current version */
export default async function createReleaseTag() {
  const version = (await dependencies.getPackageJson()).version;

  await dependencies.spawn('git', ['tag', '-a', version, '-m', `Release ${version}`]);
  await dependencies.spawn('git', ['push', 'origin', version]);
  return `Created tag for version ${version}`;
}

/* istanbul ignore next */
if (require.main === module) {
  commandLineRunner('Creates and pushes a tag for the current version', '', process, createReleaseTag);
}
