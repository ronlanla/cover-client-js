// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { ReadStream } from 'fs';

/**
 * An interface that contains all the possible files for
 * submitting a request using the Platform Lite API
 */
export interface AnalysisFiles {
  build: Buffer | ReadStream;
  settings: Buffer | ReadStream;
  dependenciesBuild?: Buffer | ReadStream;
  baseBuild?: Buffer | ReadStream;
}
