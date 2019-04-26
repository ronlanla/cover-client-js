// Copyright 2018-2019 Diffblue Limited. All Rights Reserved.

import axios from 'axios';
import urljoin from 'url-join';

const request = {
  get: function(path: string, parameters?: any, headers?: { [key: string]: string }) {
    return axios.get(
      urljoin(process.env.API_HOST || '/', path),
      Object.assign({ withCredentials: Boolean(process.env.ENABLE_AUTH), params: parameters || {} }, headers ? { headers: headers } : undefined),
    );
  },
  post: function(path: string, data: any, headers?: { [key: string]: string }) {
    return axios.post(
      urljoin(process.env.API_HOST || '/', path),
      data,
      Object.assign({ withCredentials: Boolean(process.env.ENABLE_AUTH) }, headers ? { headers: headers } : undefined),
    );
  },
  delete: function(path: string, headers?: { [key: string]: string }) {
    return axios.delete(
      urljoin(process.env.API_HOST || '/', path),
      Object.assign({ withCredentials: Boolean(process.env.ENABLE_AUTH) }, headers ? { headers: headers } : undefined),
    );
  },
};

export default request;
