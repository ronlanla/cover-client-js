// Copyright 2019 Diffblue Limited. All Rights Reserved.

import Analysis from './src/analysis';
import writeTests from './src/writeTests';

export {
  cancelAnalysis,
  getAnalysisResults,
  getAnalysisStatus,
  getApiVersion,
  startAnalysis,
} from './src/bindings';
export { generateTestClass, groupResults, mergeIntoTestClass } from './src/combiner';
export * from './src/types/types';
export { Analysis, writeTests };
export default Analysis;
