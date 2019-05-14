// Copyright 2018-2019 Diffblue Limited. All Rights Reserved.

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as FormData from 'form-data';

/** Platform Lite API error class */
export class ApiError extends Error {
  public constructor(message: string, code: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    // Work around TypeScript bug
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  public code: string;
  public status?: number;
}

/** Convert an axios error into the standard Platform Lite API format */
export const convertError = ({ response }: AxiosError) => {
  if (response) {
    const { data, status, statusText } = response;
    const { code, message } = data;

    if (message && code) {
      throw new ApiError(message, code, status);
    }

    throw new ApiError(statusText, 'axiosError', status);
  }

  throw new ApiError('An unknown error occurred', 'axiosError');
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
