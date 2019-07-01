// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { basename } from 'path';

import argvParser, { Options } from './argvParser';
import logger from './log';
import multiline from './multiline';

export const dependencies = {
  processExit: process.exit,
  logger: logger,
};

export const components = {
  getCommandName: getCommandName,
  getHelpMessage: getHelpMessage,
};

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
  return text.replace(/(\n|^)(.)/g, `$1${indent}$2`);
}

/** Returns how to run this command, following the convention of the user */
export function getCommandName(process: { argv: string[], env: NodeJS.ProcessEnv }) {
  const isYarn = Boolean(process.env.npm_config_user_agent && process.env.npm_config_user_agent.match(/^yarn/));
  const command = process.env.npm_lifecycle_event;
  return command ? `${isYarn ? 'yarn' : 'npm run'} ${command}` : `ts-node ${basename(process.argv[1])}`;
}

/** Returns the help message for the command */
export function getHelpMessage(description: string, pattern: string, command: string) {
  const usage = `${command} ${pattern} [--help]`.replace(/ +/g, ' ');
  return multiline`
    Description:
    ${indent(description)}

    Usage:
    ${indent(usage)}

  `;
}

/** Runs an asynchronous command */
export default function commandLineRunner(
  description: string, pattern: string, process: { argv: string[], env: NodeJS.ProcessEnv }, command: Command,
) {
  const { args, options } = argvParser(process.argv);
  const commandName = components.getCommandName(process);
  const helpMessage = components.getHelpMessage(description, pattern, commandName);

  if (options.help) {
    logger.log(helpMessage);
    return;
  }

  return command(args, options).then((message) => {
    if (message) {
      logger.log(message);
    }
  }).catch((error) => {
    logger.error(helpMessage);
    // Only show the stack trace for unexpected errors
    logger.error(error instanceof ExpectedError ? error.toString() : error);
    // Newline to separate from npm/yarn output
    logger.error('');
    dependencies.processExit(1);
  });
}
