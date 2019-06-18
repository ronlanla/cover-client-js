// Copyright 2019 Diffblue Limited. All Rights Reserved.

import commandLineRunner, { ExpectedError } from '../utils/commandLineRunner';
import createPullRequest from '../utils/createPullRequest';
import getPackageJson from '../utils/getPackageJson';
import spawn from '../utils/spawnProcess';

export const dependencies = {
  spawn: spawn,
  getPackageJson: getPackageJson,
};

export const components = {
  createPullRequest: createPullRequest,
};

/** Creates a pull request on Github from master back to develop */
export default function createPostReleasePullRequest(env: NodeJS.ProcessEnv) {
  return async (args: string[]) => {
    const token = env.GITHUB_TOKEN;
    if (!token) {
      throw new ExpectedError('Missing GITHUB_TOKEN environment variable to authenticate with Github');
    }

    const reviewers = args[0];

    const packageJson = await dependencies.getPackageJson();
    const branch = `post-release/${packageJson.version}`;

    await dependencies.spawn('git', ['checkout', '-b', branch]);
    await dependencies.spawn('git', ['push', '-u', 'origin', branch]);

    const title = `Merge ${packageJson.version} back into develop`;
    await components.createPullRequest(token, title, branch, 'develop', reviewers, env);
    return `Created pull request to merge version ${packageJson.version} back into develop`;
  };
}

/* istanbul ignore next */
if (require.main === module) {
  commandLineRunner(
    [
      'Creates a pull request from master to develop to be used after a release,',
      'optionally provide a comma separated list of reviewers',
    ].join('\n'),
    '[<reviewers>]',
    process,
    createPostReleasePullRequest(process.env),
  );
}
