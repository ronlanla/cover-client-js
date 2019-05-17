// Copyright 2019 Diffblue Limited. All Rights Reserved.

import * as express from 'express';
import { Server } from 'http';

import logger from '../../src/utils/log';
import { MockApiApplication, Scenario } from '../types';
import { parseConfigFile } from './handlers/file';
import { setScenario } from './handlers/scenario';

/** Contains the mock API server for Platform Lite */
export default class MockApiServer {
  private app = express() as MockApiApplication;
  private apiPort = 3001;

  /**
   * Start the mock API server
   *
   * By default, the server will be started at http://localhost:3001
   */
  public startServer = async () => {
    const api = `http://localhost:${this.apiPort}`;
    try {
      await parseConfigFile(this.app);

      // Set default scenario
      setScenario(this.app, 'default');

      return new Promise((resolve) => this.app.listen(this.apiPort, () => {
        logger.info(`Running mock API on ${api}`);
        resolve();
      }));
    } catch (error) {
      logger.error(error);
    }
  }

  /** Close the mock API server */
  public closeServer = (server: Server) => {
    return new Promise((resolve, reject) => server.close((error) => {
      if (error) {
        logger.error(error);
        return reject();
      }
      resolve();
    }));
  }

  /**
   * Set the scenario that the server will use to return predefined sets of data
   *
   * Default: default
   *
   * NOTE: This must be set after creating the server
   */
  public setScenario = (scenario: Scenario) => setScenario(this.app, scenario);

  /**
   * Set the port that will be used to start the server
   *
   * Default: 3001
   *
   * NOTE: This must be set before creating the server
   */
  public setApiPort = (port: number) => {
    this.apiPort = port;
  }
}
