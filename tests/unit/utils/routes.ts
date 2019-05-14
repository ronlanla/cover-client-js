// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert, { errorEquals } from '../../../src/utils/assertExtra';
import routes, { generateApiUrl } from '../../../src/utils/routes';

describe('src/utils/routing', () => {
  const defaultApiUrl = 'http://localhost/api';

  describe('generateApiUrl', () => {
    it('Returns a string when provided with parameters', () => {
      const actualString = generateApiUrl([defaultApiUrl, 'version']);
      const expectedString = 'http://localhost/api/version';
      assert.deepStrictEqual(actualString, expectedString);
    });

    it('Throws when provided with an empty string parameter', () => {
      const expectedError = new Error('Route parameter cannot be an empty string');
      assert.throws(() => generateApiUrl([defaultApiUrl, '']), errorEquals(expectedError));
    });
  });

  describe('routes', () => {
    it('Correctly generates a string for the get API version route', () => {
      const actualString = routes.version(defaultApiUrl);
      const expectedString = 'http://localhost/api/version';
      assert.deepStrictEqual(actualString, expectedString);
    });

    it('Correctly generates a string for the API start analysis route', () => {
      const actualString = routes.start(defaultApiUrl);
      const expectedString = 'http://localhost/api/analysis';
      assert.deepStrictEqual(actualString, expectedString);
    });

    it('Correctly generates a string for the API analysis results route', () => {
      const actualString = routes.results(defaultApiUrl, '12340-ABCDE');
      const expectedString = 'http://localhost/api/analysis/12340-ABCDE';
      assert.deepStrictEqual(actualString, expectedString);
    });

    it('Correctly generates a string for the API analysis status route', () => {
      const actualString = routes.status(defaultApiUrl, 'ABCDE-12340');
      const expectedString = 'http://localhost/api/analysis/ABCDE-12340/status';
      assert.deepStrictEqual(actualString, expectedString);
    });

    it('Correctly generates a string for the API cancel analysis route', () => {
      const actualString = routes.cancel(defaultApiUrl, '12340-ABCDE');
      const expectedString = 'http://localhost/api/analysis/12340-ABCDE/cancel';
      assert.deepStrictEqual(actualString, expectedString);
    });
  });
});
