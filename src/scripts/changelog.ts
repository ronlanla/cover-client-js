// Copyright 2019 Diffblue Limited. All Rights Reserved.

import * as Bluebird from 'bluebird';
import { uniq } from 'lodash';
import { parseGit } from 'parse-git';

import { Options } from '../utils/argvParser';
import commandLineRunner from '../utils/commandLineRunner';
import multiline from '../utils/multiline';
import spawnProcess from '../utils/spawnProcess';

export const dependencies = {
  spawnProcess: spawnProcess,
};

export const components = {
  createChangelog: createChangelog,
  gitLog: gitLog,
};

/** A single entry in the Git log */
export type GitLogEntry = {
  id: string;
  parents?: string[];
  files: Array<{ type: string, path: string }>;
  author: { name: string, email: string };
  date: Date;
  comment: string;
};

/** A collection of Git entries, grouped by release status */
export type LogVersion = {
  version: string;
  entries: string[];
};

const description = multiline`
  Prints out the changelog, grouped by whether they have been included in a release or not.
  Use --unreleased argument to show only unreleased changes.
`;

/** Gets the commit log for the repo this file belongs to */
export async function gitLog(mergesOnly: boolean, commit: string, previousCommit?: string): Promise<GitLogEntry[]> {
  const range = previousCommit ? `${previousCommit}..${commit}` : commit;
  const logParameters = ['--no-pager', 'log', '--name-only', range];
  if (mergesOnly) {
    logParameters.push('--merges');
  }

  const log = await dependencies.spawnProcess('git', logParameters);
  return parseGit(log).map((entry: GitLogEntry) => {
    const match = log.match(new RegExp(`(?:\n|^)commit ${entry.id}\nMerge: (.+)`));
    if (match) {
      return { ...entry, parents: match[1].split(' ') };
    }
    return entry;
  });
}

/** Try to find the version of a release given a commit message */
export function getReleaseVersion(message: string): string | undefined {
  const releaseRegex = /from [^\/]+\/release\/(\d+\.\d+\.\d+)/;
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
export function firstLine(message: string) {
  return message.substr(0, undefinedOnFail(message.indexOf('\n')));
}


/** Get a list of features from a list of commit messages */
export function getFeatures(messages: string[]): string[] {
  const featureRegex = /Merge pull request (#\d+) from [^\n]+\n(.*)/;
  return messages
  .filter((message) => !getReleaseVersion(message))
  .map((message) => {
    const featureMatch = message.match(featureRegex);
    return featureMatch ? `${normaliseTicketSyntax(featureMatch[2])} ${featureMatch[1]}` : undefined;
  })
  .filter((feature): feature is string => Boolean(feature));
}

/** Gets all changes that were made on the release branch  */
export function getReleaseBranchFeatures(commits: GitLogEntry[]) {
  const versionBumpRegex = /^Bump version to \d+\.\d+\.\d+$/;
  // Find the first merge in order to get all commits in the release branch
  const mergeIndex = undefinedOnFail(
    commits.findIndex((commit) => Boolean(commit.parents && commit.parents.length > 1)),
  );
  return commits.slice(0, mergeIndex)
  .map((commit) => firstLine(commit.comment))
  .filter((message) => !message.match(versionBumpRegex)); // Remove "Bump version to X.X.X" commits
}

/** Gets the (unique) release versions from a set of merge commits */
export function getReleaseVersions(messages: string[]) {
  return uniq(messages.map(getReleaseVersion).filter((version): version is string => Boolean(version)));
}

/** Creates changelog data which can be consumed by `renderChangelog` and `renderEntries` */
export async function createChangelog(): Promise<LogVersion[]> {
  // First get a list of all the merge commits on develop
  const mergeCommits = await components.gitLog(true, 'develop');

  // Find all the unique release versions from these merge commits
  const releaseVersions = getReleaseVersions(mergeCommits.map((commit) => commit.comment));

  // Get the log for all commits between each version and its previous version, then filter down to features
  const releaseEntries = await Bluebird.mapSeries(releaseVersions, async (releaseVersion, i: number) => {
    // '^2' suffix gets the parent of the release commit on the feature branch
    const commits = await components.gitLog(false, `${releaseVersion}^2`, releaseVersions[i + 1]);
    const releaseBranchFeatures = getReleaseBranchFeatures(commits);
    const features = getFeatures(commits.map((commit) => commit.comment));
    return {
      version: releaseVersion,
      entries: releaseBranchFeatures.concat(features),
    };
  });

  // Get unreleased features
  const unreleasedCommits = await components.gitLog(true, 'develop', 'master');
  const unreleasedEntry = {
    version: 'Unreleased',
    entries: getFeatures(unreleasedCommits.map((commit) => commit.comment)),
  };

  return releaseEntries.reverse().concat([unreleasedEntry]);
}

/**
 * Makes ticket references consistent
 *
 * Move ticket references (e.g. TG-123) to the end of the description,
 * and ensure they use the correct format e.g. "[TG-123, TG-456]"
 */
export function normaliseTicketSyntax(feature: string) {
  const match = feature.match(/\[?\s*((TG-\d+)(\s*[, ]\s*TG-\d+)*)\s*\]?:?/i);
  if (match) {
    const comment = feature.replace(match[0], '').trim().replace(/[ \t]+/g, ' ');
    const tickets = match[1].replace(/[\s,]+/g, ' ').trim().split(' ');
    return `${comment} [${tickets.join(', ').toUpperCase()}]`;
  }
  return feature;
}

/** Returns a formatted string for a list of versions */
export function renderChangelog(changelog: LogVersion[]) {
  return changelog.map(renderChangelogVersion).join('\n');
}

/** Creates a formatted string which adds an underlined title to a LogVersion based on the version name */
export function renderChangelogVersion(version: LogVersion) {
  return multiline`
    ${version.version}
    ${Array(version.version.length + 1).join('=')}

    ${renderEntries(version.entries)}
  `;
}

/** Returns a formatted string showing Git log entries */
export function renderEntries(entries: string[]) {
  return entries.map((entry) => `* ${entry}\n`).join('');
}

/** Get unreleased changes, if there are any */
export function getUnreleasedChanges(changelog: LogVersion[]) {
  const unreleased = changelog.find((version) => version.version === 'Unreleased');
  return unreleased ? unreleased.entries : [];
}

/** Prints out the git log, grouped in to 'Released' and 'Unreleased' changes */
export default function changelog() {
  return async (args: string[], options: Options) => {
    const log = await components.createChangelog();
    if (options.unreleased) {
      return renderEntries(getUnreleasedChanges(log));
    } else {
      return renderChangelog(log);
    }
  };
}

/* istanbul ignore next */
if (require.main === module) {
  commandLineRunner(description, '', process, changelog());
}
