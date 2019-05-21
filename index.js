// Copyright 2019 Diffblue Limited. All Rights Reserved.

import Analysis from './src/analysis';
import {
  cancelAnalysis,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  startAnalysis,
} from './src/bindings';
import { generateTestClass, groupResults, mergeIntoTestClass } from './src/combiner';
import * as types from './src/types/types';
import writeTests from './src/writeTests';

exports = {
  Analysis: Analysis,
  cancelAnalysis: cancelAnalysis,
  getAnalysisResults: getAnalysisResults,
  getAnalysisStatus: getAnalysisStatus,
  getApiVersion: getApiVersion,
  startAnalysis: startAnalysis,
  generateTestClass: generateTestClass,
  groupResults: groupResults,
  mergeIntoTestClass: mergeIntoTestClass,
  types: types,
  writeTests: writeTests,
};
