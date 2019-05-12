// Copyright 2019 Diffblue Limited. All Rights Reserved.

import axios from 'axios';

import { ExpectedError } from './commandLineRunner';

export const dependencies = {
  axios: axios,
};

/** Creates a pull request on Github */
export default async function createPullRequest(
  repo: string, token: string, title: string, head: string, base: string,
) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `token ${token}`,
  };
  await dependencies.axios.post(`https://api.github.com/repos/${repo}/pulls`, {
    title: title,
    head: head,
    base: base,
  }, { headers: headers })
  .catch((error) => {
    if (error.response.statusText === 'Unauthorized') {
      throw new ExpectedError('Invalid authorization token');
    }
    const errorData = error.response.data;
    throw new Error(`Github API error: ${JSON.stringify(errorData, null, '  ')}`);
  });
}
