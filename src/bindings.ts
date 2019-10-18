// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { AxiosRequestConfig } from 'axios';
import * as FormData from 'form-data';
import { Agent } from 'https';

import { BindingsError, BindingsErrorCode } from './errors';
import {
  AnalysisCancelApiResponse,
  AnalysisFiles,
  AnalysisResultsApiResponse,
  AnalysisSettings,
  AnalysisStartApiResponse,
  AnalysisStatusApiResponse,
  ApiVersionApiResponse,
  BindingsOptions,
} from './types/types';
import request from './utils/request';
import routes from './routes';

export const dependencies = {
  FormData: FormData,
  request: request,
  routes: routes,
};

export const components = {
  permissiveHttpsAgent: new Agent({
    rejectUnauthorized: false,
  }),
};

const Gb = 1024 * 1024 * 1024;

/** Convert bindings options to an axios request config */
function convertOptions(options: BindingsOptions = {}): AxiosRequestConfig {
  const config: AxiosRequestConfig = {};
  if (options.allowUnauthorizedHttps) {
    config.httpsAgent = components.permissiveHttpsAgent;
  }
  return config;
}

/** Gets the version used for the API */
export async function getApiVersion(api: string, options?: BindingsOptions): Promise<ApiVersionApiResponse> {
  return dependencies.request.get(dependencies.routes.version(api), convertOptions(options));
}

/** Gets default analysis settings */
export async function getDefaultSettings(api: string, options?: BindingsOptions): Promise<AnalysisSettings> {
  return dependencies.request.get(dependencies.routes.defaultSettings(api), convertOptions(options));
}

/** Starts an analysis and returns the analysis id and computed settings */
export async function startAnalysis(
  api: string,
  { baseBuild, build, dependenciesBuild }: AnalysisFiles,
  settings: AnalysisSettings = {},
  options?: BindingsOptions,
): Promise<AnalysisStartApiResponse> {
  if (!build) {
    throw new BindingsError('The required `build` JAR file was not supplied', BindingsErrorCode.BUILD_MISSING);
  }

  const getOptions = (filename: string, type: 'java-archive' | 'json') => ({
    contentType: `application/${type}`,
    filename: filename,
  });

  const formData = new dependencies.FormData();
  formData.append('build', build, getOptions('build.jar', 'java-archive'));

  try {
    formData.append('settings', JSON.stringify(settings), getOptions('settings.json', 'json'));
  } catch (error) {
    throw new BindingsError(`The settings JSON was not valid:\n${error}`, BindingsErrorCode.SETTINGS_INVALID);
  }

  if (baseBuild) {
    formData.append('baseBuild', baseBuild, getOptions('baseBuild.jar', 'java-archive'));
  }

  if (dependenciesBuild) {
    formData.append('dependenciesBuild', dependenciesBuild, getOptions('dependenciesBuild.jar', 'java-archive'));
  }

  const axiosConfig: AxiosRequestConfig = {
    ...convertOptions(options),
    headers: formData.getHeaders(),
    maxContentLength: Gb * 2, // 2 Gb
  };

  return dependencies.request.post(dependencies.routes.start(api), formData, axiosConfig);
}

/**
 * Download analysis results using a id for the target analysis
 * and an optional cursor to get the results since the last download
 */
export async function getAnalysisResults(
  api: string,
  id: string,
  cursor?: number,
  options?: BindingsOptions,
): Promise<AnalysisResultsApiResponse> {
  const axiosConfig = { ...convertOptions(options), params: { cursor: cursor }};
  return dependencies.request.get(dependencies.routes.results(api, id), axiosConfig);
}

/** Cancel the analysis tied to the specified id */
export async function cancelAnalysis(
  api: string,
  id: string,
  options?: BindingsOptions,
): Promise<AnalysisCancelApiResponse> {
  return dependencies.request.post(dependencies.routes.cancel(api, id), undefined, convertOptions(options));
}

/** Get the status of the analysis tied to the specified id */
export async function getAnalysisStatus(
  api: string,
  id: string,
  options?: BindingsOptions,
): Promise<AnalysisStatusApiResponse> {
  return dependencies.request.get(dependencies.routes.status(api, id), convertOptions(options));
}
