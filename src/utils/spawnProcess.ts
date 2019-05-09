// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { spawn, SpawnOptions } from 'child_process';

export const dependencies = {
  spawn: spawn,
};

/** Spawns a process resolving with the stdout */
export default async function spawnProcess(command: string, args: string[] = [], options: SpawnOptions = {}) {
  return new Promise<string>((resolve, reject) => {
    const process = dependencies.spawn(command, args, options);

    let output = '';
    if (process.stdout) {
      process.stdout.on('data', (chunk: Buffer) => output += chunk.toString());
    }
    process.on('close', () => resolve(output));
    process.on('error', reject);
  });
}
