// Copyright 2018-2019 Diffblue Limited. All Rights Reserved.

import urljoin from 'url-join';

export const routes = {
  version: (api: string) => urljoin([api, 'version']),
  start: (api: string) => urljoin([api, 'analysis']),
  result: (api: string, identifier: string) => urljoin([api, 'analysis', identifier]),
  status: (api: string, identifier: string) => urljoin([api, 'analysis', identifier, 'status']),
  cancel: (api: string, identifier: string) => urljoin([api, 'analysis', identifier, 'cancel']),
};
