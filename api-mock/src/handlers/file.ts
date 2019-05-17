// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { NextFunction, Request, Response } from 'express';
import { isEmpty } from 'lodash';
import * as multer from 'multer';

// tslint:disable:no-magic-numbers

const uploadLimit = 1024 * 1024 * 1024 * 2; // bytes * kilobytes * megabytes * num of gigabytes
const uploadTimeout = 1000 * 60 * 20; // milliseconds * seconds * minutes
const multerUpload = multer({ dest: '/tmp/uploads/', limits: { fileSize: uploadLimit }});

export const uploadFiles = (filenames: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    multerUpload.fields(filenames.map((filename) => ({ name: filename })))(req, res, (err) => {
      if (err && err.code === 'LIMIT_FILE_SIZE') {
        return next(new Error(`The file provided is too large. Max 2GB: ${err.code} ${err.message}`));
      } else if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new Error(`An unexpected file was provided: ${err.code} ${err.message}`));
      } else if (err) {
        return next(new Error(`An unknown error occurred when uploading: ${err}`));
      }
      if (req.files && !isEmpty(req.files)) {
        res.setTimeout(uploadTimeout);
      }
      return next();
    });
  };
};
