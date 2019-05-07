// Copyright 2018-2019 Diffblue Limited. All Rights Reserved.

import urlJoin from 'url-join';

export const generateApiUrl = (params: string[]) => {
  if (params.some((param) => param === '')) {
    throw new Error('Route parameter cannot be an empty string');
  }
  return urlJoin(params);
};

export const routes = {
  version: (api: string) => generateApiUrl([api, 'version']),
  start: (api: string) => generateApiUrl([api, 'analysis']),
  result: (api: string, identifier: string) => generateApiUrl([api, 'analysis', identifier]),
  status: (api: string, identifier: string) => generateApiUrl([api, 'analysis', identifier, 'status']),
  cancel: (api: string, identifier: string) => generateApiUrl([api, 'analysis', identifier, 'cancel']),
};
