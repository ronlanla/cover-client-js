// Copyright 2019 Diffblue Limited. All Rights Reserved.

import {
    AnalysisCancel, AnalysisFiles, AnalysisResultsApiResponse,
    AnalysisSettings, AnalysisStartApiResponse, AnalysisStatusApiResponse,
    AnalysisStatusEnum, ApiVersionApiResponse,
} from './types';

///////////////////////
// DUMMY API METHODS //
///////////////////////

const dummyStatus = { status: AnalysisStatusEnum.RUNNING, progress: { completed: 10, total: 20 }};
const dummyResult = {
  'test-id': 'string',
  'test-name': 'string',
  'tested-function': 'string',
  'source-file-path': 'string',
  'test-body': 'string',
  imports: [],
  'static-imports': [],
  'class-annotations': [],
  tags: [],
  'phase-generated': 'string',
  'created-time': 'string',
};

/** Dummy start */
/* istanbul ignore next */
export const start = async (
  apiUrl: string,
  settings: AnalysisSettings,
  {
    build,
    dependenciesBuild,
    baseBuild,
  }: AnalysisFiles,
): Promise<AnalysisStartApiResponse> => {
  return { id: 'analysis-id-12345', phases: {}};
};

/** Dummy get status */
/* istanbul ignore next */
export const getStatus = async (apiUrl: string, id: string): Promise<AnalysisStatusApiResponse> => {
  return dummyStatus;
};

/** Dummy cancel */
/* istanbul ignore next */
export const cancel = async (apiUrl: string, id: string): Promise<AnalysisCancel> => {
  return { message: 'message here', status: dummyStatus };
};

/** Dummy get results */
/* istanbul ignore next */
export const results = async (apiUrl: string, id: string, cursor?: number): Promise<AnalysisResultsApiResponse> => {
  return { cursor: 12345, status: dummyStatus, results: [dummyResult] };
};

/** Dummy version */
/* istanbul ignore next */
export const version = async (apiUrl: string): Promise<ApiVersionApiResponse> => {
  return { version: '1.2.3' };
};
