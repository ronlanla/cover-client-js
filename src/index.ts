// Copyright 2019 Diffblue Limited. All Rights Reserved.

import FormData from 'form-data';

import { AnalysisFiles } from './types';
import request, { convertError } from './utils/request';
import { routes } from './utils/routes';

/** Gets the version used for the API */
export async function getApiVersion(api: string) {
  return request.get(routes.version(api)).catch(convertError);
}

/** Starts an analysis and returns the analysis id */
export async function startAnalysis(api: string, { baseBuild, build, dependenciesBuild, settings }: AnalysisFiles) {
  const options = (filename: string, type: 'java-archive' | 'json') => ({
    contentType: `application/${type}`,
    filename: filename,
  });

  const formData = new FormData();
  formData.append('build', build, options('build', 'java-archive'));
  formData.append('settings', settings, options('settings', 'json'));

  if (baseBuild) {
    formData.append('base-build', baseBuild, options('base-build', 'java-archive'));
  }

  if (dependenciesBuild) {
    formData.append('dependencies-build', dependenciesBuild, options('dependencies-build', 'java-archive'));
  }

  return request.post(routes.start(api), formData, formData.getHeaders()).catch(convertError);
}

/**
 * Download analysis results using a id for the target analysis
 * and an optional cursor to get the results since the last download
 */
export async function getAnalysisResults(api: string, id: string, cursor?: number) {
  return request.get(routes.result(api, id), { params: { cursor: cursor }}).catch(convertError);
}

/** Cancel the analysis tied to the specified id */
export async function cancelAnalysis(api: string, id: string) {
  return request.post(routes.cancel(api, id)).catch(convertError);
}

/** Get the status of the analysis tied to the specified id */
export async function getAnalysisStatus(api: string, id: string) {
  return request.get(routes.status(api, id)).catch(convertError);
}
