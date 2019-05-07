// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { exec } from 'child_process';
import { unlink, writeFile } from 'fs';
import { promisify } from 'util';

import commandLineRunner, { ExpectedError } from '../utils/commandLineRunner';

/** Callback to be called when NPM authentication setup */
type AuthenticatedCallback = (environment: NodeJS.ProcessEnv) => Promise<string | undefined>;

export const dependencies = {
  writeFile: promisify(writeFile),
  unlink: promisify(unlink),
  exec: promisify(exec),
};

export const components = {
  authenticateNpm: authenticateNpm,
  getAuthUser: getAuthUser,
};

const description = 'Publishes this package to NPM, requires an NPM API token';

const npmConfig = '.npmrc';

/** Gets the username of the authorised user */
export async function getAuthUser(environment: NodeJS.ProcessEnv) {
  return dependencies.exec('npm whoami', { env: environment })
  .then((response) => response.stdout.trim())
  .catch(() => undefined);
}

/** Wrapper allowing authenticated NPM requests with a token */
export async function authenticateNpm(token: string, environment: NodeJS.ProcessEnv, callback: AuthenticatedCallback) {
  /** Environment variables without `npm_config_registry` variable injected by yarn */
  const callbackEnvironment: NodeJS.ProcessEnv = { ...environment, npm_config_registry: '' };
  await dependencies.writeFile(npmConfig, `//registry.npmjs.org/:_authToken=${token}`);
  try {
    return await callback(callbackEnvironment);
  } finally {
    await dependencies.unlink(npmConfig).catch(() => undefined);
  }
}

/** Extracts the error message from NPM output */
export function extractNpmError(output: string) {
  const lines = output.match(/npm ERR! [^\n]+/g) || [];
  return lines.map((line: string) => line.replace(/^npm ERR! /, '')).join('\n');
}

/** Publishes the package */
export default function publishPackage(environment: NodeJS.ProcessEnv) {
  return async (args: string[]) => {
    const token = args[0];
    if (!token) {
      throw new ExpectedError('Please provide a token to authenticate with NPM');
    }

    await dependencies.exec('yarn install');
    await dependencies.exec('npm shrinkwrap');

    return components.authenticateNpm(token, environment, async (environment) => {
      const username = await components.getAuthUser(environment);
      if (!username) {
        throw new ExpectedError('Invalid token to authenticate with NPM');
      }
      try {
        await dependencies.exec('npm publish --access public', { env: environment });
        return 'Successfully published';
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Could not publish package\n${extractNpmError(error.toString())}`);
        }
      }
    });
  };
}

if (require.main === module) {
  commandLineRunner(description, '<token>', publishPackage(process.env));
}
