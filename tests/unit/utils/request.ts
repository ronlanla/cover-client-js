// Copyright 2019 Diffblue Limited. All Rights Reserved.

import axios, { AxiosError, AxiosResponse } from 'axios';

import { ApiError } from '../../../src/errors';
import assert, { errorEquals } from '../../../src/utils/assertExtra';
import request, { convertError } from '../../../src/utils/request';
import sinonTestFactory from '../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

describe('utils/request', () => {
  const templateResponse: AxiosResponse = { config: {}, data: {}, status: 0, statusText: '', headers: {}};
  const templateError: AxiosError = {
    config: {},
    response: templateResponse,
    message: '',
    name: '',
    isAxiosError: true,
  };

  describe('convertError', () => {
    it('Converts the axios error response in the Cover ApiError format', () => {
      const status = 400;
      const error: AxiosError = {
        ...templateError,
        response: {
          ...templateResponse,
          data: {
            message: 'Error',
            code: 'apiError',
          },
          status: status,
        },
      };

      const expectedError = new ApiError('Error', 'apiError', status);
      assert.throws(() => convertError(error), errorEquals(expectedError));
    });

    it('Throws with statusText in the Cover ApiError format', () => {
      const error: AxiosError = { ...templateError, response: { ...templateResponse, statusText: 'Foo bar' }};
      const expectedError = new ApiError('Foo bar', 'requestError', 0);
      assert.throws(() => convertError(error), errorEquals(expectedError));
    });

    it('Throws an unknown error directly as the original Axios error', () => {
      const error: AxiosError = { ...templateError, response: undefined };
      assert.throws(() => convertError(error), errorEquals(error));
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
            status: 'STOPPING',
            progress: 50,
          },
        },
      });

      const actualResponse = await request.post(testUrl);
      const expectedResponse = {
        message: 'Analysis successfully canceled',
        status: {
          status: 'STOPPING',
          progress: 50,
        },
      };
      assert.deepStrictEqual(actualResponse, expectedResponse);
    }));
  });
});
