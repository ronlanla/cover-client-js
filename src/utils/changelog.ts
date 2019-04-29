// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { spawn, ChildProcess } from 'child_process';
import { parseGit } from 'parse-git';
import * as Bluebird from 'bluebird';
import { uniq } from 'lodash';

type GitLogEntry = {
  id: string;
  parents: string[];
  files: Array<{ type: string, path: string }>;
  author: { name: string, email: string };
  date: Date;
  comment: string;
};

type LogVersion = {
  version: string;
  entries: string[];
};

// Consume the output for a process and convert to a promise
function consumeProcess(process: ChildProcess): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';
    let error = '';

    if(!process.stdout || !process.stderr) {
      return reject("Process not set up correctly.")
    }

    process.stdout.on('data', (data) => {
      output += data;
    });

    process.stderr.on('data', (data) => {
      error += data;
    });

    process.on('close', (code) => {
      if (code !== 0) {
        return reject(`Process exited with code: ${code}\n${error}`);
      }
      resolve(output);
    });
  });
}

function gitLog(commit = 'master', previousCommit?: string, mergesOnly = true): Promise<GitLogEntry[]> {
  const range = previousCommit ? `${previousCommit}..${commit}` : commit;
  const logParameters = ['--no-pager', 'log', '--name-only', range];
  if (mergesOnly) {
    logParameters.push('--merges');
  }
  return consumeProcess(spawn('git', logParameters))
  .then((log) => {
    return parseGit(log).map((entry: GitLogEntry) => {
      const match = log.match(new RegExp(`(?:\n|^)commit ${entry.id}\nMerge: (.+)`));
      if (match) {
        return { ...entry, parents: match[1].split(' ') };
      }
      return entry;
    });
  });
}

const releaseRegex = /from diffblue\/release\/(\d+\.\d+\.\d+)/;
const featureRegex = /Merge pull request (#\d+) from [^\n]+\n(.*)/;
const versionBumpRegex = /^((Update|Bump) version( and changelog)?( number| to \d+\.\d+\.\d+)?|Creating the release for \d+\.\d+\.\d+)$/;

// Try to find the version of a release given a commit message
function getReleaseVersion(message: string): string | undefined {
  const versionMatch = message.match(releaseRegex);
  if (versionMatch) {
    return versionMatch[1];
  }
  return undefined;
}

// Converts -1 to undefined
function undefinedOnFail(value: number) {
  return value === -1 ? undefined : value;
}

// Gets the first line of a string
function firstLine(message: string) {
  return message.substr(0, undefinedOnFail(message.indexOf('\n')));
}

// Get a list of features from a list of commits
function getFeatures(commits: GitLogEntry[]): string[] {
  return commits.map((commit) => {
    const featureMatch = commit.comment.match(featureRegex);
    if (!getReleaseVersion(commit.comment) && featureMatch) {
      return `${normaliseTicketSyntax(featureMatch[2])} ${featureMatch[1]}`;
    }
  })
  .filter<string>((feature): feature is string => Boolean(feature));
}

// Creates changelog data which can be consumed by `renderChangelog` and `renderChangelogVersion`
export function createChangelog(): Promise<LogVersion[]> {
  return gitLog().then((mergeCommits) => {
    const releaseVersions = uniq(mergeCommits.map((commit) => getReleaseVersion(commit.comment))
    .filter<string>((version): version is string => Boolean(version)));

    return Bluebird.mapSeries(releaseVersions, (version, i) => {
      // Log all commits between this version and the previous version
      return gitLog(version + '^2', releaseVersions[i + 1], false) // '^2' suffix gets the parent of the release merge commit
      .then((commits) => {
        // Find the first merge in order to get all commits in the release branch
        const mergeIndex = undefinedOnFail(commits.findIndex((commit) => commit.parents && commit.parents.length > 1));
        const releaseChanges = commits.slice(0, mergeIndex)
        .map((commit) => firstLine(commit.comment))
        .filter((comment) => !comment.match(versionBumpRegex)); // Remove "Bump version to X.X.X" commits

        // Get a list of features from PRs
        const features = getFeatures(commits);

        // Combine commits from the release branch and features merged in PRs
        return releaseChanges.concat(features);
      });
    })
    .then((releaseFeatures) => {
      // Get unreleased commits to add to "Unreleased" section
      return gitLog('develop', 'master').then((commits) => {
        return [getFeatures(commits)].concat(releaseFeatures);
      });
    }).then((releaseFeatures) => {
      return ['Unreleased'].concat(releaseVersions).map((version, i) => {
        return { version: version, entries: releaseFeatures[i] };
      }).reverse();
    });
  });
}

// Move ticket references (e.g. TG-123) to the end of the description,
// and ensure they use the correct format e.g. "[TG-123, TG-456]"
export function normaliseTicketSyntax(feature: string) {
  const match = feature.match(/\[?\s*((TG-\d+)(\s*,\s*TG-\d+)*)\s*\]?:?/i);
  if (match) {
    const comment = feature.replace(match[0], '').trim().replace(/[ \t]+/g, ' ');
    const tickets = match[1].replace(/\s+/g, '').split(',');
    return `${comment} [${tickets.join(', ').toUpperCase()}]`;
  }
  return feature;
}

export function renderChangelog(changelog: LogVersion[]) {
  return changelog.map((version) => {
    return `${version.version}\n${Array(version.version.length + 1).join('=')}\n\n${renderChangelogVersion(version)}`;
  }).join('\n');
}

export function renderChangelogVersion(changelog: LogVersion) {
  return changelog.entries.map((entry) => `* ${entry}\n`).join('');
}
