// Copyright 2018-2019 Diffblue Limited. All Rights Reserved.

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as FormData from 'form-data';

import { ApiError } from '../errors';
import { ApiErrorResponse } from '../types/types';

/** Convert an axios error into the standard Platform Lite API format */
export const convertError = (err: AxiosError) => {
  if (err.response) {
    const { data, status, statusText } = err.response;
    const { code, message }: ApiErrorResponse = data;

    if (message && code) {
      throw new ApiError(message, code, status);
    }

    throw new ApiError(statusText, 'requestError', status);
  }

  // Give up and just throw the Axios error
  throw err;
};

const request = {
  get: async (path: string, config?: AxiosRequestConfig) => {
    return axios.get(path, config).then((response: AxiosResponse) => response.data).catch(convertError);
  },
  post: async (path: string, data?: FormData, config?: AxiosRequestConfig) => {
    return axios.post(path, data, config).then((response: AxiosResponse) => response.data).catch(convertError);
  },
};

export default request;
