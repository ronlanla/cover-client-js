// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { Application, NextFunction, Request, Response } from 'express';
import { readFile } from 'fs';
import { isEmpty } from 'lodash';
import * as multer from 'multer';
import { promisify } from 'util';

// tslint:disable:no-magic-numbers

const uploadLimit = 1024 * 1024 * 1024 * 2; // bytes * kilobytes * megabytes * num of gigabytes
const uploadTimeout = 1000 * 60 * 20; // milliseconds * seconds * minutes
const multerUpload = multer({ dest: '/tmp/uploads/', limits: { fileSize: uploadLimit }});

const readFileAsync = promisify(readFile);

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

/** Gets a named file from a request */
export const getRequestFile = (request: Request, name: string) => {
  if (request.files && !Array.isArray(request.files) && request.files[name] && request.files[name].length) {
    return request.files[name][0];
  }
};

export const parseConfigFile = async (app: Application) => {
  const config = await readFileAsync('./api-mock/config.json');
  app.locals.config = JSON.parse(config.toString('utf8'));
};