
// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { Application, Request } from 'express';

/** Contains the configuration file that is passed to the mock API */
export interface RequestConfig extends Request {
  app: MockApiApplication;
}

/** Interface for consuming the API configuration and current API state */
export interface MockApiApplication extends Application {
  locals: {
    config: {
      presetScenarios: { [key in Scenario]: ApiState };
    };
    state: ApiState;
  };
}

/** Contains all state based properties for the mock API */
type ApiState = {
  analysisId: string;
  name: string;
  templateTests: string[];
  phases: { [name: string]: any }; // tslint:disable-line:no-any // TODO: Add stronger type
};

/** All predefined possible scenarios */
export type Scenario = 'default';
