// Copyright 2019 Diffblue Limited. All Rights Reserved.

import * as FormData from 'form-data';

import { AnalysisFiles } from '../types/api';
import request, { ApiError } from '../utils/request';
import routes from '../utils/routes';

export const dependencies = { FormData: FormData, request: request, routes: routes };

/** Gets the version used for the API */
export async function getApiVersion(api: string) {
  return dependencies.request.get(dependencies.routes.version(api));
}

/** Starts an analysis and returns the analysis id */
export async function startAnalysis(api: string, { baseBuild, build, dependenciesBuild, settings }: AnalysisFiles) {
  if (!build) {
    throw new ApiError('The required `build` JAR file was not supplied', 'buildMissing');
  } else if (!settings) {
    throw new ApiError('The required `settings` JSON file was not supplied', 'settingsMissing');
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
    throw new ApiError(error, 'settingsInvalid');
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
export async function getAnalysisResults(api: string, id: string, cursor?: number) {
  return dependencies.request.get(dependencies.routes.results(api, id), { params: { cursor: cursor }});
}

/** Cancel the analysis tied to the specified id */
export async function cancelAnalysis(api: string, id: string) {
  return dependencies.request.post(dependencies.routes.cancel(api, id));
}

/** Get the status of the analysis tied to the specified id */
export async function getAnalysisStatus(api: string, id: string) {
  return dependencies.request.get(dependencies.routes.status(api, id));
}
