// Copyright 2019 Diffblue Limited. All Rights Reserved.

import logger from '../../../src/utils/log';
import { MockApiApplication, Scenario } from '../../types';

export const setScenario = (app: MockApiApplication, scenario: Scenario) => {
  if (!scenario) {
    return logger.error('Scenario is undefined\n');
  } else if (!app.locals.config.presetScenarios[scenario]) {
    return logger.error(`Scenario "${scenario}" does not exist\n`);
  }

  app.locals.state = { ...app.locals.config.presetScenarios[scenario] };
};
