// Copyright 2019 Diffblue Limited. All Rights Reserved.

import axios, { AxiosError, AxiosResponse } from 'axios';

import assert, { errorEquals } from '../../../../src/utils/assertExtra';
import request, { ApiError, convertError } from '../../../../src/utils/request';
import sinonTestFactory from '../../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

describe('src/utils/request', () => {
  const templateResponse: AxiosResponse = { config: {}, data: {}, status: 0, statusText: '', headers: {}};
  const templateError: AxiosError = { config: {}, response: templateResponse, message: '', name: '' };

  describe('convertError', () => {
    it('Converts the axios error response in the Cover ApiError format', () => {
      const error: AxiosError = {
        ...templateError,
        response: {
          ...templateResponse,
          data: {
            message: 'Error',
            code: 'api-error',
          },
        },
      };

      const expectedError = new ApiError('Error', 'api-error');
      assert.throws(() => convertError(error), errorEquals(expectedError));
    });

    it('Throws an unknown error in the Cover ApiError format', () => {
      const error: AxiosError = {
        ...templateError,
        response: {
          ...templateResponse,
        },
      };

      const expectedError = new ApiError('An unknown error occurred', 'unknown-error');
      assert.throws(() => convertError(error), errorEquals(expectedError));
    });
  });

  describe('request', () => {
    it('Resolves an axios GET request', sinonTest(async (sinon) => {
      const testUrl = 'http://localhost/api/version';
      const get = sinon.stub(axios, 'get');
      get.withArgs(testUrl).resolves({ ...templateResponse, data: { version: '1.0.0' }});

      const actualResponse = await request.get(testUrl);
      const expectedResponse = { version: '1.0.0' };
      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));

    it('Resolves an axios POST request', sinonTest(async (sinon) => {
      const testUrl = 'http://localhost/api/cancel';
      const post = sinon.stub(axios, 'post');
      post.withArgs(testUrl).resolves({
        ...templateResponse,
        data: {
          message: 'Analysis successfully canceled',
          status: {
            status: 'CANCELED',
            progress: 50,
          },
        },
      });

      const actualResponse = await request.post(testUrl);
      const expectedResponse = {
        message: 'Analysis successfully canceled',
        status: {
          status: 'CANCELED',
          progress: 50,
        },
      };
      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));
  });
});
