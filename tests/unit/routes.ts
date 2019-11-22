// Copyright 2019 Diffblue Limited. All Rights Reserved.

import routes, { generateApiUrl, urlJoin } from '../../src/routes';
import assert, { errorEquals } from '../../src/utils/assertExtra';

describe('utils/routes', () => {
  const defaultApiUrl = 'http://localhost/api';

  describe('urlJoin', () => {
    it('Returns a string correctly joining URL parameters', () => {
      const actualString = urlJoin([defaultApiUrl, 'analysis', '1', 'cancel']);
      const expectedString = 'http://localhost/api/analysis/1/cancel';
      assert.deepStrictEqual(actualString, expectedString);
    });

    it('Returns a string correctly joining URL parameters with trailing slashes', () => {
      const actualString = urlJoin(['http://localhost/api/', 'analysis/', '1', 'cancel']);
      const expectedString = 'http://localhost/api/analysis/1/cancel';
      assert.deepStrictEqual(actualString, expectedString);
    });

    it('Returns a string correctly joining URL parameters with a trailing slash on the end', () => {
      const actualString = urlJoin([defaultApiUrl, 'analysis/']);
      const expectedString = 'http://localhost/api/analysis/';
      assert.deepStrictEqual(actualString, expectedString);
    });
  });

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

    it('Correctly generates a string for the get default settings route', () => {
      const actualString = routes.defaultSettings(defaultApiUrl);
      const expectedString = 'http://localhost/api/default-settings';
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
