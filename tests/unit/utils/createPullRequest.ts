// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import { ExpectedError } from '../../../src/utils/commandLineRunner';
import sinonTestFactory from '../../../src/utils/sinonTest';

import createPullRequest, { dependencies } from '../../../src/utils/createPullRequest';

const sinonTest = sinonTestFactory();

describe('utils/createPullRequest', () => {
  it('Resolves when the Github request resolves', sinonTest(async (sinon) => {
    const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves();
    await createPullRequest('abc123', 'Title', 'master', 'develop', undefined, { foo: 'bar' });
    assert.calledOnceWith(spawnProcess, [
      'hub',
      [
        'pull-request',
        '--message', 'Title',
        '--head', 'master',
        '--base', 'develop',
        '--reviewer', '',
      ],
      { env: {
        GITHUB_TOKEN: 'abc123',
        foo: 'bar',
      }},
    ]);
  }));

  it('Resolves when the Github request resolves, posting reviewers', sinonTest(async (sinon) => {
    const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves();
    await createPullRequest('abc123', 'Title', 'master', 'develop', '@foo,@bar', { foo: 'bar' });
    assert.calledOnceWith(spawnProcess, [
      'hub',
      [
        'pull-request',
        '--message', 'Title',
        '--head', 'master',
        '--base', 'develop',
        '--reviewer', '@foo,@bar',
      ],
      { env: {
        GITHUB_TOKEN: 'abc123',
        foo: 'bar',
      }},
    ]);
  }));

  it('Rejects when the Github request rejects', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'spawnProcess').rejects(new Error('Unprocessable Entity (HTTP 422)'));
    await assert.rejectsWith(
      createPullRequest('abc123', 'Title', 'master', 'develop', undefined, { foo: 'bar' }),
      new Error('Github API error: Unprocessable Entity (HTTP 422)'),
    );
  }));

  it('Rejects when the Github request authentication fails', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'spawnProcess').rejects(new Error('Error getting current user: Unauthorized (HTTP 401)'));
    await assert.rejectsWith(
      createPullRequest('abc123', 'Title', 'master', 'develop', undefined, { foo: 'bar' }),
      new ExpectedError('Invalid authorization token'),
    );
  }));
});
