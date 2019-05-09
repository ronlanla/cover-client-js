// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { spawn, SpawnOptions } from 'child_process';

/** Spawns a process resolving with the stdout */
export default async function spawnProcess(command: string, args?: string[], options?: SpawnOptions) {
  return new Promise<string>((resolve, reject) => {
    const process = spawn(command, args || [], options || {});

    let output = '';
    if (process.stdout) {
      process.stdout.on('data', (chunk: string) => output += chunk);
    }
    process.on('close', () => resolve(output));
    process.on('error', reject);
  });
}
