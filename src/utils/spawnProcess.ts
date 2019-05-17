// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { spawn, SpawnOptions } from 'child_process';

export const dependencies = {
  spawn: spawn,
};

/** Spawns a process resolving with the stdout */
export default async function spawnProcess(command: string, args: string[] = [], options: SpawnOptions = {}) {
  return new Promise<string>((resolve, reject) => {
    const process = dependencies.spawn(command, args, options);

    const stdout: Buffer[] = [];
    if (process.stdout) {
      process.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    }
    const stderr: Buffer[] = [];
    if (process.stderr) {
      process.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    }

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(stderr).toString()));
      }
      resolve(Buffer.concat(stdout).toString());
    });
    process.on('error', reject);
  });
}
