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
    const createPullRequest = sinon.stub(components, 'createPullRequest');
    assert.strictEqual(
      await createPostReleasePullRequest({ foo: 'bar' })(['abc123']),
      'Created pull request to merge version 1.2.3 back into develop',
    );
    assert.calledOnceWith(createPullRequest, [
      'abc123',
      'Merge 1.2.3 back into develop',
      '1.2.3',
      'develop',
      undefined,
      { foo: 'bar' },
    ]);
  }));

  it('Rejects when a token is not provided', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'getPackageJson').resolves({
      version: '1.2.3',
      repository: { url: 'git@github.com:company/project.git' },
    });
    const createPullRequest = sinon.stub(components, 'createPullRequest');
    await assert.rejectsWith(
      createPostReleasePullRequest({ foo: 'bar' })([]),
      new Error('Please provide a token to authenticate with Github'),
    );
    assert.notCalled(createPullRequest);
  }));

  it('Rejects when package.json does not contain a valid repository url', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'getPackageJson').resolves({
      version: '1.2.3',
    });
    const createPullRequest = sinon.stub(components, 'createPullRequest');
    await assert.rejectsWith(
      createPostReleasePullRequest({ foo: 'bar' })(['abc123']),
      new Error('Could not extract repository name from package.json repository.url'),
    );
    assert.notCalled(createPullRequest);
  }));
});
