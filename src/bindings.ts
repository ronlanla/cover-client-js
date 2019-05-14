// Copyright 2019 Diffblue Limited. All Rights Reserved.

import * as FormData from 'form-data';

import { BindingsError, BindingsErrorCodes } from './errors';
import {
  AnalysisCancelApiResponse,
  AnalysisFiles,
  AnalysisResultsApiResponse,
  AnalysisSettings,
  AnalysisStartApiResponse,
  AnalysisStatusApiResponse,
  ApiVersionApiResponse,
} from './types/types';
import request from './utils/request';
import routes from './utils/routes';

export const dependencies = { FormData: FormData, request: request, routes: routes };

/** Gets the version used for the API */
export async function getApiVersion(api: string): Promise<ApiVersionApiResponse> {
  return dependencies.request.get(dependencies.routes.version(api));
}

/** Starts an analysis and returns the analysis id */
export async function startAnalysis(
  api: string,
  settings: AnalysisSettings,
  { baseBuild, build, dependenciesBuild }: AnalysisFiles,
): Promise<AnalysisStartApiResponse> {
  if (!build) {
    throw new BindingsError('The required `build` JAR file was not supplied', BindingsErrorCodes.BUILD_MISSING);
  } else if (!settings) {
    throw new BindingsError('The required `settings` JSON file was not supplied', BindingsErrorCodes.SETTINGS_MISSING);
  }

  const options = (filename: string, type: 'java-archive' | 'json') => ({
    contentType: `application/${type}`,
    filename: filename,
  });

  const formData = new dependencies.FormData();
  formData.append('build', build, options('build.jar', 'java-archive'));

  try {
    formData.append('settings', JSON.stringify(settings), options('settings.json', 'json'));
  } catch (error) {
    throw new BindingsError(`The settings JSON was not valid:\n${error}`, BindingsErrorCodes.SETTINGS_INVALID);
  }

  if (baseBuild) {
    formData.append('baseBuild', baseBuild, options('baseBuild.jar', 'java-archive'));
  }

  if (dependenciesBuild) {
    formData.append('dependenciesBuild', dependenciesBuild, options('dependenciesBuild.jar', 'java-archive'));
  }

  return dependencies.request.post(dependencies.routes.start(api), formData, formData.getHeaders());
}

/**
 * Download analysis results using a id for the target analysis
 * and an optional cursor to get the results since the last download
 */
export async function getAnalysisResults(
  api: string,
  id: string,
  cursor?: number,
): Promise<AnalysisResultsApiResponse> {
  return dependencies.request.get(dependencies.routes.results(api, id), { params: { cursor: cursor }});
}

/** Cancel the analysis tied to the specified id */
export async function cancelAnalysis(api: string, id: string): Promise<AnalysisCancelApiResponse> {
  return dependencies.request.post(dependencies.routes.cancel(api, id));
}

/** Get the status of the analysis tied to the specified id */
export async function getAnalysisStatus(api: string, id: string): Promise<AnalysisStatusApiResponse> {
  return dependencies.request.get(dependencies.routes.status(api, id));
}
