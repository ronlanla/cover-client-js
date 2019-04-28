import { exec } from 'child_process';
import { unlink, writeFile } from 'fs';
import { promisify } from 'util';

import argvParser, { Options } from '../utils/argvParser';
import logger from '../utils/log';

const dependencies = {
  writeFile: promisify(writeFile),
  unlink: promisify(unlink),
  exec: promisify(exec),
};

const npmConfig = '.npmrc';

/** Gets the username of the authorised user */
export async function getAuthUser(environment: NodeJS.ProcessEnv) {
  return dependencies.exec('npm whoami', { env: environment })
  .then((response) => response.stdout.trim())
  .catch(() => undefined);
}

/** Wrapper allowing authenticated NPM requests with a token */
export async function authenticateNpm(token: string, callback: (environment: NodeJS.ProcessEnv) => Promise<void>) {
  /** Environment variables without `npm_config_registry` variable injected by yarn */
  const environment: NodeJS.ProcessEnv = { ...process.env, npm_config_registry: '' };
  await dependencies.writeFile(npmConfig, `//registry.npmjs.org/:_authToken=${token}`);
  try {
    await callback(environment);
  } finally {
    await dependencies.unlink(npmConfig).catch();
  }
}

/** Returns the help message for the command */
export function helpMessage() {
  const isYarn = Boolean(process.env.npm_config_user_agent && process.env.npm_config_user_agent.match(/^yarn/));
  const command = process.env.npm_config_argv && JSON.parse(process.env.npm_config_argv).cooked.join(' ');
  return [
    'Description:',
    '  Publishes this package to NPM, requires an NPM API token\n',
    'Usage:',
    `  ${command ? `${isYarn ? 'yarn' : 'npm'} ${command}` : 'ts-node publishPackage.ts'} <token> [--help]\n`,
  ].join('\n');
}

/** Extracts the error message from NPM output */
export function extractNpmError(output: string) {
  const lines = output.match(/npm ERR! [^\n]+/g) || [];
  return lines.map((line: string) => line.replace(/^npm ERR! /, '')).join('\n');
}

/** Publishes the package */
export default async function publishPackage(args: string[] , options: Options) {
  if (options.help) {
    logger.log(helpMessage());
    return;
  }

  const token = args[0];
  if (!token) {
    throw new Error('Please provide a token to authenticate with NPM');
  }

  await dependencies.exec('yarn install');
  await dependencies.exec('npm shrinkwrap');

  await authenticateNpm(token, async (environment) => {
    await dependencies.writeFile(npmConfig, `//registry.npmjs.org/:_authToken=${token}`);
    const username = await getAuthUser(environment);
    if (!username) {
      throw new Error('Invalid token to authenticate with NPM');
    }
    try {
      await dependencies.exec('npm publish --access public', { env: environment });
      logger.log('Successfully published');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Could not publish package\n${extractNpmError(error.toString())}`);
      }
    }
  });
}

if (require.main === module) {
  const { args, options } = argvParser(process.argv);
  publishPackage(args, options).catch((error) => {
    logger.error(`${helpMessage()}\n${error.toString()}`);
    process.exit(1);
  });
}
