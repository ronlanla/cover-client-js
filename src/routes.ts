// Copyright 2018-2019 Diffblue Limited. All Rights Reserved.

/** Joins parts of a URL separated by slashes */
export function urlJoin(parts: string[]) {
  return parts.map((part, i) => i === parts.length - 1 ? part : part.replace(/\/$/, '')).join('/');
}

/** Generates an API URL */
export function generateApiUrl(params: string[]) {
  if (params.some((param) => param === '')) {
    throw new Error('Route parameter cannot be an empty string');
  }
  return urlJoin(params);
}

const routes = {
  version: (api: string) => generateApiUrl([api, 'version']),
  defaultSettings: (api: string) => generateApiUrl([api, 'default-settings']),
  start: (api: string) => generateApiUrl([api, 'analysis']),
  results: (api: string, identifier: string) => generateApiUrl([api, 'analysis', identifier]),
  status: (api: string, identifier: string) => generateApiUrl([api, 'analysis', identifier, 'status']),
  cancel: (api: string, identifier: string) => generateApiUrl([api, 'analysis', identifier, 'cancel']),
};

export default routes;
