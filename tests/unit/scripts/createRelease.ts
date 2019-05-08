// Copyright 2019 Diffblue Limited. All Rights Reserved.

import createRelease, { dependencies } from '../../../src/scripts/createRelease';
import { Options } from '../../../src/utils/argvParser';
import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';
import sinon = require('sinon');

const sinonTest = sinonTestFactory();

describe('scripts/createRelease', () => {
  describe('createRelease', () => {
    const options:Options = {};
    options.dryRun = true;

    it('Returns "Release process began successfully"', () => {
      const writeFile = sinon.stub(dependencies.inquirer, 'prompt');
      assert.deepStrictEqual(createRelease(false), 'Release process began successfully');
    });
  });
});
