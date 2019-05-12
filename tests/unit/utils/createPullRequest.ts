// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import { ExpectedError } from '../../../src/utils/commandLineRunner';
import sinonTestFactory from '../../../src/utils/sinonTest';

import createPullRequest, { dependencies } from '../../../src/utils/createPullRequest';

const sinonTest = sinonTestFactory();

describe('scripts/createReleaseTag', () => {
  it('Resolves when the Github request resolves', sinonTest(async (sinon) => {
    const post = sinon.stub(dependencies.axios, 'post').resolves();
    await createPullRequest('user/repo', 'abc123', 'Title', 'master', 'develop');
    assert.calledOnceWith(post, [
      'https://api.github.com/repos/user/repo/pulls',
      {
        base: 'develop',
        head: 'master',
        title: 'Title',
      },
      {
        headers: {
          Authorization: 'token abc123',
          'Content-Type': 'application/json',
        },
      },
    ]);
  }));

  it('Rejects when the Github request rejects', sinonTest(async (sinon) => {
    sinon.stub(dependencies.axios, 'post').rejects({ response: { data: [1, 2, 3] }});
    await assert.rejectsWith(
      createPullRequest('user/repo', 'abc123', 'Title', 'master', 'develop'),
      new Error('Github API error: [\n  1,\n  2,\n  3\n]'),
    );
  }));

  it('Rejects when the Github request authentication fails', sinonTest(async (sinon) => {
    sinon.stub(dependencies.axios, 'post').rejects({ response: { statusText: 'Unauthorized' }});
    await assert.rejectsWith(
      createPullRequest('user/repo', 'abc123', 'Title', 'master', 'develop'),
      new ExpectedError('Invalid authorization token'),
    );
  }));
});
