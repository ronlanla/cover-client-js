// Copyright 2019 Diffblue Limited. All Rights Reserved.


import commandLineRunner, { ExpectedError } from '../utils/commandLineRunner';
import createPullRequest from '../utils/createPullRequest';
import getPackageJson from '../utils/getPackageJson';

export const dependencies = {
  getPackageJson: getPackageJson,
};

/** Creates a pull request on Github from master back to develop */
export async function createPostReleasePullRequest(args: string[]) {
  const token = args[0];
  if (!token) {
    throw new ExpectedError('Please provide a token to authenticate with Github');
  }

  const packageJson = await dependencies.getPackageJson();
  const repositoryMatch = packageJson.repository.url.match(/^git@github\.com:(.+)\.git$/);

  if (!repositoryMatch) {
    throw new ExpectedError('Could not extract repository name from package.json repository.url');
  }

  await createPullRequest(
    repositoryMatch[1],
    token,
    `Test: Merge ${packageJson.version} back into develop`,
    packageJson.version,
    'develop',
  );
  return `Created pull request to merge version ${packageJson.version} back into develop`;
}

/* istanbul ignore next */
if (require.main === module) {
  commandLineRunner(
    'Creates and pushes a tag for the current version', '<token>', process, createPostReleasePullRequest,
  );
}
