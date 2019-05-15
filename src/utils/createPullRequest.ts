// Copyright 2019 Diffblue Limited. All Rights Reserved.

import spawnProcess from '../utils/spawnProcess';

import { ExpectedError } from './commandLineRunner';

export const dependencies = {
  spawnProcess: spawnProcess,
};

/** Creates a pull request on Github */
export default async function createPullRequest(
  token: string, title: string, head: string, base: string, env: NodeJS.ProcessEnv,
) {
  await dependencies.spawnProcess('hub', [
    'pull-request',
    '--message', title,
    '--head', head,
    '--base', base,
  ], { env: { ...env, GITHUB_TOKEN: token }})
  .catch((error) => {
    if (error.message.match(/Unauthorized \(HTTP 401\)/)) {
      throw new ExpectedError('Invalid authorization token');
    }
    throw new Error(`Github API error: ${error.message}`);
  });
}
