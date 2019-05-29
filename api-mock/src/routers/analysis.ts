// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { Router } from 'express';
import * as StatusCode from 'http-status-codes';

import { ApiError } from '../../../src/errors';
import { AnalysisSettings } from '../../../src/types/types';
import { RequestConfig } from '../../types';
import { getRequestFile, uploadFiles } from '../handlers/file';

const router = Router();

// Start analysis route
router.post(
  '',
  uploadFiles(['build', 'dependenciesBuild', 'baseBuild', 'settings']),
  (req: RequestConfig, res, next) => {
    if (!getRequestFile(req, 'build')) {
      return next(new ApiError(
        'The required `build` JAR file was not supplied',
        'buildMissing',
        StatusCode.BAD_REQUEST,
      ));
    }

    const state = req.app.locals.state;
    let settings: AnalysisSettings;

    if (!state.analysisId) {
      return next(new ApiError(
        'Current state does not contain analysis id, please set a valid state',
        'stateInvalid',
        StatusCode.BAD_REQUEST,
      ));
    }

    try {
      settings = JSON.parse(req.body.settings);
    } catch (error) {
      return next(new ApiError(`Invalid analysis settings: ${error}`, 'settingsInvalid', StatusCode.BAD_REQUEST));
    }

    res.send({ id: state.analysisId, phases: settings.phases || state.phases });
    next();
  },
);

// Analysis results route
router.get('/:analysis', (req, res, next) => {
  return res.send('analysis results');
});

// Analysis results route
router.get('/:analysis/status', (req, res, next) => {
  return res.send('analysis status');
});

// Analysis results route
router.post('/:analysis/cancel', (req, res, next) => {
  return res.send('analysis cancel');
});

export default router;
