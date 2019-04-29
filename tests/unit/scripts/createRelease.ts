// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';

import createRelease from '../../../src/scripts/createRelease';
import { Options } from '../../../src/utils/argvParser';

describe('scripts/createRelease', () => {
  describe('createRelease', () => {
    const options:Options = {};
    options.dryRun = true;

    it('Returns 0', () => {
      assert.deepStrictEqual(createRelease([], options), 0);
    });
  });
});
