// Copyright 2019 Diffblue Limited. All Rights Reserved.

import Analysis from './src/analysis';
import { generateTestClass, groupResults, mergeIntoTestClass } from './src/combiner';
import * as types from './src/types/types';

exports = {
  Analysis: Analysis,
  generateTestClass: generateTestClass,
  groupResults: groupResults,
  mergeIntoTestClass: mergeIntoTestClass,
  types: types,
};
