// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { basename } from 'path';
import argvParser, { Options } from './argvParser';
import logger from './log';

/** Command line command interface */
export type Command = (args: string[], options: Options) => Promise<string | undefined | void>;

/** An error which is expected, so that we don't bother showing a stack trace  */
export class ExpectedError extends Error {
  public constructor(message: string) {
    super(message);
    // Work around TypeScript bug
    Object.setPrototypeOf(this, ExpectedError.prototype);
  }
}

/** Indents text by an amount */
export function indent(text: string, indent = '  ') {
  return text.split('\n').map((line) => indent + line).join('\n');
}

/** Returns how to run this command, following the convention of the user */
export function getCommand() {
  const isYarn = Boolean(process.env.npm_config_user_agent && process.env.npm_config_user_agent.match(/^yarn/));
  const command = process.env.npm_config_argv && JSON.parse(process.env.npm_config_argv).cooked.join(' ');
  return command ? `${isYarn ? 'yarn' : 'npm'} ${command}` : `ts-node ${basename(process.argv[1])}`;
}

/** Returns the help message for the command */
export function helpMessage(description: string, pattern: string) {
  const usage = `${getCommand()} ${pattern} [--help]\n`.replace(/ +/g, ' ');
  return [
    'Description:',
    `${indent(description)}\n`,
    'Usage:',
    `${indent(usage)}`,
  ].join('\n');
}

/** Runs an asynchronous command */
export default function commandLineRunner(description: string, pattern: string, command: Command) {
  const { args, options } = argvParser(process.argv);

  if (options.help) {
    logger.log(helpMessage(description, pattern));
    return;
  }

  command(args, options).then((message) => {
    if (message) {
      logger.log(message);
    }
  }).catch((error) => {
    logger.error(helpMessage(description, pattern));
    // Only show the stack trace for unexpected errors
    logger.error(error instanceof ExpectedError ? error.toString() : error);
    // Newline to separate from npm/yarn output
    logger.error('');
    process.exit(1);
  });
}
