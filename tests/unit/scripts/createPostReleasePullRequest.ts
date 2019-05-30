// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import createPostReleasePullRequest, {
  components,
  dependencies,
} from '../../../src/scripts/createPostReleasePullRequest';

const sinonTest = sinonTestFactory();

describe('scripts/createPostReleasePullRequest', () => {
  it('Resolves with a success message when the pull request is created', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'getPackageJson').resolves({
      version: '1.2.3',
      repository: { url: 'git@github.com:company/project.git' },
    });
    const spawn = sinon.stub(dependencies, 'spawn');
    const createPullRequest = sinon.stub(components, 'createPullRequest');
    assert.strictEqual(
      await createPostReleasePullRequest({ foo: 'bar', GITHUB_TOKEN: 'abc123' })([]),
      'Created pull request to merge version 1.2.3 back into develop',
    );
    assert.calledWith(spawn, [
      ['git', ['checkout', '-b', 'post-release/1.2.3']],
      ['git', ['push', '-u', 'origin', 'post-release/1.2.3']],
    ]);
    assert.calledOnceWith(createPullRequest, [
      'abc123',
      'Merge 1.2.3 back into develop',
      'post-release/1.2.3',
      'develop',
      undefined,
      { foo: 'bar', GITHUB_TOKEN: 'abc123' },
    ]);
  }));

  it('Rejects when a token is not provided', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'getPackageJson').resolves({
      version: '1.2.3',
      repository: { url: 'git@github.com:company/project.git' },
    });
    const spawn = sinon.stub(dependencies, 'spawn');
    const createPullRequest = sinon.stub(components, 'createPullRequest');
    await assert.rejectsWith(
      createPostReleasePullRequest({ foo: 'bar' })([]),
      new Error('Missing GITHUB_TOKEN environment variable to authenticate with Github'),
    );
    assert.notCalled(spawn);
    assert.notCalled(createPullRequest);
  }));
});
