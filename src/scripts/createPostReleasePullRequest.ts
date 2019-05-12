// Copyright 2019 Diffblue Limited. All Rights Reserved.


import commandLineRunner, { ExpectedError } from '../utils/commandLineRunner';
import createPullRequest from '../utils/createPullRequest';
import getPackageJson from '../utils/getPackageJson';

export const dependencies = {
  getPackageJson: getPackageJson,
};

export const components = {
  createPullRequest: createPullRequest,
};

/** Creates a pull request on Github from master back to develop */
export default async function createPostReleasePullRequest(args: string[]) {
  const token = args[0];
  if (!token) {
    throw new ExpectedError('Please provide a token to authenticate with Github');
  }

  const packageJson = await dependencies.getPackageJson();
  const repositoryMatch: RegExpMatchArray | undefined = (
    packageJson.repository &&
    packageJson.repository.url &&
    packageJson.repository.url.match(/^git@github\.com:(.+)\.git$/)
  );

  if (!repositoryMatch) {
    throw new ExpectedError('Could not extract repository name from package.json repository.url');
  }

  await components.createPullRequest(
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
