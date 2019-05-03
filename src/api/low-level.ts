// Copyright 2019 Diffblue Limited. All Rights Reserved.

import FormData from 'form-data';

import { AnalysisFiles } from '../types/api';
import request from '../utils/request';
import { routes } from '../utils/routes';

export const components = {
  ...request,
  ...routes,
};

/** Gets the version used for the API */
export async function getApiVersion(api: string) {
  return components.get(components.version(api));
}

/** Starts an analysis and returns the analysis id */
export async function startAnalysis(api: string, { baseBuild, build, dependenciesBuild, settings }: AnalysisFiles) {
  const options = (filename: string, type: 'java-archive' | 'json') => ({
    contentType: `application/${type}`,
    filename: filename,
  });

  const formData = new FormData();
  formData.append('build', build, options('build.jar', 'java-archive'));
  formData.append('settings', JSON.stringify(settings), options('settings.json', 'json'));

  if (baseBuild) {
    formData.append('baseBuild', baseBuild, options('baseBuild.jar', 'java-archive'));
  }

  if (dependenciesBuild) {
    formData.append('dependenciesBuild', dependenciesBuild, options('dependenciesBuild.jar', 'java-archive'));
  }

  return components.post(components.start(api), formData, formData.getHeaders());
}

/**
 * Download analysis results using a id for the target analysis
 * and an optional cursor to get the results since the last download
 */
export async function getAnalysisResults(api: string, id: string, cursor?: number) {
  return components.get(components.result(api, id), { params: { cursor: cursor }});
}

/** Cancel the analysis tied to the specified id */
export async function cancelAnalysis(api: string, id: string) {
  return components.post(components.cancel(api, id));
}

/** Get the status of the analysis tied to the specified id */
export async function getAnalysisStatus(api: string, id: string) {
  return components.get(components.status(api, id));
}
