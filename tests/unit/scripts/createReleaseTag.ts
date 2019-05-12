// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import createReleaseTag, { dependencies } from '../../../src/scripts/createReleaseTag';

const sinonTest = sinonTestFactory();

describe('scripts/createReleaseTag', () => {
  it('Resolves with a success message when the tag was created successfully', sinonTest(async (sinon) => {
    const getPackageJson = sinon.stub(dependencies, 'getPackageJson').resolves({ version: '1.2.3' });
    const spawn = sinon.stub(dependencies, 'spawn').resolves();
    assert.strictEqual(await createReleaseTag(), 'Created tag for version 1.2.3');
    assert.calledOnceWith(getPackageJson, []);
    assert.calledWith(spawn, [
      ['git', ['tag', '-a', '1.2.3', '-m', 'Release 1.2.3']],
      ['git', ['push', 'origin', '1.2.3']],
    ]);
  }));

  it('Rejects if the package.json file could not be loaded', sinonTest(async (sinon) => {
    const getPackageJson = sinon.stub(dependencies, 'getPackageJson').rejects(new Error('File not found'));
    const spawn = sinon.stub(dependencies, 'spawn').resolves();
    await assert.rejectsWith(createReleaseTag(), new Error('File not found'));
    assert.calledOnceWith(getPackageJson, []);
    assert.notCalled(spawn);
  }));

  it('Rejects if the git commands fail', sinonTest(async (sinon) => {
    const getPackageJson = sinon.stub(dependencies, 'getPackageJson').resolves({ version: '1.2.3' });
    const spawn = sinon.stub(dependencies, 'spawn').rejects(new Error('Create tag failed'));
    await assert.rejectsWith(createReleaseTag(), new Error('Create tag failed'));
    assert.calledOnceWith(getPackageJson, []);
    assert.calledOnceWith(spawn, ['git', ['tag', '-a', '1.2.3', '-m', 'Release 1.2.3']]);
  }));
});
