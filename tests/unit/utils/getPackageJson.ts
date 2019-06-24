// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import getPackageJson, { dependencies } from '../../../src/utils/getPackageJson';
import sinonTestFactory from '../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

describe('utils/getPackageJson', () => {
  it('Resolves with the package.json data', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'readFile').resolves('{"version":"123"}\n');
    assert.deepStrictEqual(await getPackageJson(), { version: '123' });
  }));

  it('Rejects when the package.json file could not be loaded', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'readFile').rejects(new Error('Could not load file'));
    await assert.rejectsWith(getPackageJson(), new Error('Could not load file'));
  }));

  it('Rejects when the package.json file could not be parsed', sinonTest(async (sinon) => {
    sinon.stub(dependencies, 'readFile').resolves('{"version":');
    await assert.rejectsWith(getPackageJson(), new SyntaxError('Unexpected end of JSON input'));
  }));
});

