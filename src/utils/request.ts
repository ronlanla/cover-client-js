// Copyright 2018-2019 Diffblue Limited. All Rights Reserved.

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import FormData from 'form-data';

/** Platform Lite API error class */
export class ApiError extends Error {
  public constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
  public code: string;
}

/** Convert an axios error into the standard Platform Lite API format */
export const convertError = (error: AxiosError) => {
  const data = error.response && error.response.data;
  if (data && data.message && data.code) {
    throw new ApiError(data.message, data.code);
  }
  throw new ApiError('An unknown error occurred', 'unknown-error');
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
