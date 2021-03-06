// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { min } from 'lodash';

/** Gets the indent (in spaces) of a line */
function getIndent(line: string) {
  const match = line.match(/^ +/);
  return match ? match[0] : '';
}

/** Gets the indent (in spaces) at the end of a string */
function getFinalIndent(value: string) {
  const match = value.match(/(?<=(\r\n|\r|\n)) +$/);
  return match ? match[0] : '';
}

/**
 * Tag function which unindents a string and removes start/end newlines for cleaner code,
 * also indents each line of template variables.
 * See unit tests for examples
 */
export default function multiline(strings: TemplateStringsArray, ...inputs: string[]) {
  let currentIndent = '';
  // Iterate through each string and append input value to it, indenting if needed
  const lines = strings.map((value, i) => {
    // Compute current indent level from string
    if (value.match(/\r\n|\r|\n/)) {
      currentIndent = getFinalIndent(value) || currentIndent;
    }
    // Indent all lines in input by that indent level
    return value + (inputs[i] || '').replace(/\r\n|\r|\n/g, '\n' + currentIndent);
  }).join('').split(/\r\n|\r|\n/);
  // Find the minimum common indent
  const minIndent = min(lines.filter((line) => Boolean(line.match(/[^ ]/))).map((line) => getIndent(line).length));
  // Remove common indent from all lines, and start/end newline
  return lines.map((line) => line.slice(minIndent)).join('\n').replace(/^\n|\n *$/g, '');
}
