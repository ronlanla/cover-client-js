// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { Router } from 'express';

const router = Router();

// Get API version route
router.post('', (req, res, next) => {
  return res.send({ version: '1.2.3' });
});

export default router;
