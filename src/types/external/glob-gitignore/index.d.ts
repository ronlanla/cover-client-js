// Copyright 2019 Diffblue Limited. All Rights Reserved.

declare module 'glob-gitignore' {
  export function glob(patterns: string | string[], options: { [key: string]: any }): Promise<string[]>;
}
