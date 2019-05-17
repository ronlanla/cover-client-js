// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { Router } from 'express';

const router = Router();

// Start analysis route
router.post('', (req, res, next) => {
  return res.send('start analysis');
});

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
