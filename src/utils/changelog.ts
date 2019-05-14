// Copyright 2019 Diffblue Limited. All Rights Reserved.
/* istanbul ignore file */

import * as Bluebird from 'bluebird';
import { ChildProcess, spawn } from 'child_process';
import { uniq } from 'lodash';
import { parseGit } from 'parse-git';

import { Options } from '../utils/argvParser';
import commandLineRunner from '../utils/commandLineRunner';


export const dependencies = {
  spawn: spawn,
};

/** A single entry in the Git log */
type GitLogEntry = {
  id: string;
  parents: string[];
  files: Array<{ type: string, path: string }>;
  author: { name: string, email: string };
  date: Date;
  comment: string;
};

/** A collection of Git entries, grouped by release status */
type LogVersion = {
  version: string;
  entries: string[];
};

const description = [
  'Prints out the changelog, grouped by whether they have been included in a release or not.',
  'Use --unreleased argument to show only unreleased changes.',
].join('\n');

/** Consume the output for a process and convert to a promise */
async function consumeProcess(process: ChildProcess): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';
    let error = '';

    if (!process.stdout || !process.stderr) {
      return reject('Process not set up correctly.');
    }

    process.stdout.on('data', (data) => output += data);

    process.stderr.on('data', (data) => error += data);

    process.on('close', (code) => {
      if (code !== 0) {
        return reject(`Process exited with code: ${code}\n${error}`);
      }
      resolve(output);
    });
  });
}

/** Gets the commit log for the repo this file belongs to */
async function gitLog(commit = 'develop', previousCommit?: string, mergesOnly = true): Promise<GitLogEntry[]> {
  const range = previousCommit ? `${previousCommit}..${commit}` : commit;
  const logParameters = ['--no-pager', 'log', '--name-only', range, '--merges'];
  if (mergesOnly) {
    logParameters.push('--merges');
  }

  const log = await consumeProcess(dependencies.spawn('git', logParameters));
  return parseGit(log).map((entry: GitLogEntry) => {
    const match = log.match(new RegExp(`(?:\n|^)commit ${entry.id}\nMerge: (.+)`));
    if (match) {
      return { ...entry, parents: match[1].split(' ') };
    }
    return entry;
  });
}

const releaseRegex = /from diffblue\/release\/(\d+\.\d+\.\d+)/;
const featureRegex = /Merge pull request (#\d+) from [^\n]+\n(.*)/;
const versionBumpRegex = /^(Bump version?( number| to \d+\.\d+\.\d+)?|Creating the release for \d+\.\d+\.\d+)$/;

/** Try to find the version of a release given a commit message */
function getReleaseVersion(message: string): string | undefined {
  const versionMatch = message.match(releaseRegex);
  if (versionMatch) {
    return versionMatch[1];
  }
  return undefined;
}

/** Converts -1 to undefined */
function undefinedOnFail(value: number) {
  return value === -1 ? undefined : value;
}

/** Gets the first line of a string */
function firstLine(message: string) {
  return message.substr(0, undefinedOnFail(message.indexOf('\n')));
}

/** Get a list of features from a list of commits */
function getFeatures(commits: GitLogEntry[]): string[] {
  // regex group names to make ts-lint happy
  const prNumber = 1;
  const prTitle = 2;

  return commits.map((commit) => {
    const featureMatch = commit.comment.match(featureRegex);
    if (!getReleaseVersion(commit.comment) && featureMatch) {
      return `${normaliseTicketSyntax(featureMatch[prNumber])} ${featureMatch[prTitle]}`;
    }
    return '';
  })
  // disabling ts-lint rule due to this bug https://github.com/palantir/tslint/issues/2430
  // tslint:disable-next-line:no-unnecessary-callback-wrapper
  .filter<string>((feature): feature is string => Boolean(feature));
}

/** Creates changelog data which can be consumed by `renderChangelog` and `renderChangelogVersion` */
export async function createChangelog(): Promise<LogVersion[]> {
  return gitLog().then((mergeCommits) => {
    const releaseVersions = uniq(mergeCommits.map((commit) => getReleaseVersion(commit.comment))
    // disabling ts-lint rule due to this bug https://github.com/palantir/tslint/issues/2430
    // tslint:disable-next-line:no-unnecessary-callback-wrapper
    .filter<string>((version): version is string => Boolean(version)));

    return Bluebird.mapSeries(releaseVersions, async (version, i: number) => {
      // Log all commits between this version and the previous version

      // '^2' suffix gets the parent of the release merge commit
      return gitLog(`${version}^2`, releaseVersions[i + 1], false)
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
    .then(async (releaseFeatures) => {
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

/**
 * Makes ticket references consistent
 *
 * Move ticket references (e.g. TG-123) to the end of the description,
 * and ensure they use the correct format e.g. "[TG-123, TG-456]"
 */
export function normaliseTicketSyntax(feature: string) {
  const match = feature.match(/\[?\s*((TG-\d+)(\s*,\s*TG-\d+)*)\s*\]?:?/i);
  if (match) {
    const comment = feature.replace(match[0], '').trim().replace(/[ \t]+/g, ' ');
    const tickets = match[1].replace(/\s+/g, '').split(',');
    return `${comment} [${tickets.join(', ').toUpperCase()}]`;
  }
  return feature;
}

/**
 * Creates a formatted string which adds an underlined title to a LogVersion based on the version name.
 */
function addTitleToChangelogVersion(version: LogVersion) {
  return `${version.version}\n${Array(version.version.length + 1).join('=')}\n\n${renderChangelogVersion(version)}`;
}

/**
 * Returns a formatted string showing Git log entries, grouped by release status
 */
export function renderChangelog(changelog: LogVersion[]) {
  // disabling ts-lint rule due to this bug https://github.com/palantir/tslint/issues/2430
  // tslint:disable-next-line:no-unnecessary-callback-wrapper
  return changelog.map((version) => addTitleToChangelogVersion(version)).join('\n');
}

/**
 * Returns a formatted string showing Git log entries
 */
export function renderChangelogVersion(changelog: LogVersion) {
  return changelog.entries.map((entry) => `* ${entry}\n`).join('');
}

 /**
  * Returns an array of only the unreleased changes
  */
export async function getListOfUnreleasedChanges() {
  const changelog = await createChangelog();
  const changes = (changelog
    .filter((version) => version.version === 'Unreleased')
    .map((version) => renderChangelogVersion(version).trim()));
  return changes;
}

/**
 * Prints out the git log, grouped in to 'Released' and 'Unreleased' changes.
 */
export default function changelog() {
  return async (args: string[], options: Options) => {
    if (options.unreleased) {
      const changes = await getListOfUnreleasedChanges();
      return changes.join('\n');
    } else {
      const log = await createChangelog();
      return renderChangelog(log);
    }
  };
}

if (require.main === module) {
  commandLineRunner(description, '', changelog());
}
