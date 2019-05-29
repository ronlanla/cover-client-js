// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { stripIndent } from 'common-tags';

import changelog, {
  components,
  createChangelog,
  dependencies,
  firstLine,
  getFeatures,
  getReleaseVersion,
  getUnreleasedChanges,
  gitLog,
  GitLogEntry,
  LogVersion,
  normaliseTicketSyntax,
  renderChangelogVersion,
  renderEntries,
} from '../../../src/scripts/changelog';
import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

describe('scripts/changelog', () => {
  describe('gitLog', () => {
    const logFile = stripIndent`
      commit 7434e2255cc7aa8f85cda66eb2fc43ee463fb804
      Author: John Smith <john.smith@example.com>
      Date:   Wed Apr 10 14:33:39 2019 +0100

          Commit message A

      commit e50d34637eb58896916b3cf2529edda6d015bf97
      Merge: 028e51c 97a496f
      Author: Jane Jones <jane.jones@example.com>
      Date:   Mon Apr 15 15:06:20 2019 +0100

          Merge pull request #5 from example/branch/name

          Merge commit message

      commit bf2eef14c1c7365a0a7e879d9f56266df1f5fc63
      Author: John Smith <john.smith@example.com>
      Date:   Mon Apr 15 12:39:20 2019 +0100

          Commit message B
    `;

    const expectedLogData: GitLogEntry[] = [
      {
        id: '7434e2255cc7aa8f85cda66eb2fc43ee463fb804',
        files: [],
        author: { name: 'John Smith', email: 'john.smith@example.com' },
        date: new Date('2019-04-10T13:33:39.000Z'),
        comment: 'Commit message A',
      },
      {
        id: 'e50d34637eb58896916b3cf2529edda6d015bf97',
        files: [],
        author: { name: 'Jane Jones', email: 'jane.jones@example.com' },
        date: new Date('2019-04-15T14:06:20.000Z'),
        comment: 'Merge pull request #5 from example/branch/name\nMerge commit message',
        parents: ['028e51c', '97a496f'],
      },
      {
        id: 'bf2eef14c1c7365a0a7e879d9f56266df1f5fc63',
        files: [],
        author: { name: 'John Smith', email: 'john.smith@example.com' },
        date: new Date('2019-04-15T11:39:20.000Z'),
        comment: 'Commit message B',
      },
    ];

    it('Returns the log data for a branch for merges only', sinonTest(async (sinon) => {
      const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves(logFile);

      assert.deepStrictEqual(await gitLog(true, 'banana'), expectedLogData);
      assert.calledOnceWith(spawnProcess, ['git', ['--no-pager', 'log', '--name-only', 'banana', '--merges']]);
    }));

    it('Requests the log for all commits', sinonTest(async (sinon) => {
      const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves(logFile);

      assert.deepStrictEqual(await gitLog(false, 'develop'), expectedLogData);
      assert.calledOnceWith(spawnProcess, ['git', ['--no-pager', 'log', '--name-only', 'develop']]);
    }));

    it('Requests the log for a range of commits', sinonTest(async (sinon) => {
      const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves(logFile);

      assert.deepStrictEqual(await gitLog(false, 'develop', 'master'), expectedLogData);
      assert.calledOnceWith(spawnProcess, ['git', ['--no-pager', 'log', '--name-only', 'master..develop']]);
    }));
  });

  describe('getReleaseVersion', () => {
    it('Returns the release version from a merge commit', () => {
      assert.deepStrictEqual(getReleaseVersion('Merge pull request #5 from company/release/1.2.3'), '1.2.3');
    });

    it('Returns undefined if there is no valid release version ', () => {
      assert.deepStrictEqual(getReleaseVersion('Merge pull request #5 from random/branch'), undefined);
    });
  });

  describe('firstLine', () => {
    it('Returns the first line of a multiline string', () => {
      const multilineString = stripIndent`
        String which runs
        over two lines
      `;
      assert.deepStrictEqual(firstLine(multilineString), 'String which runs');
    });

    it('Returns all of a single line string', () => {
      assert.deepStrictEqual(firstLine('Single line string'), 'Single line string');
    });
  });

  describe('renderEntries', () => {
    it('Returns a string with each entry listed', () => {
      const expectedString = [
        '* One',
        '* Two',
        '* Three',
        '',
      ].join('\n');
      assert.deepStrictEqual(renderEntries(['One', 'Two', 'Three']), expectedString);
    });

    it('Returns an empty string for an empty list', () => {
      assert.deepStrictEqual(renderEntries([]), '');
    });
  });

  describe('renderChangelogVersion', () => {
    it('Returns a string with the version underlined and each entry', () => {
      const expectedString = [
        '1.2.3',
        '=====',
        '',
        '* One',
        '* Two',
        '* Three',
        '',
      ].join('\n');

      const version: LogVersion = { version: '1.2.3', entries: ['One', 'Two', 'Three'] };

      assert.deepStrictEqual(renderChangelogVersion(version), expectedString);
    });
  });

  describe('getFeatures', () => {
    it('Returns features with a normalised format', () => {
      const messages = [
        'Merge pull request #1 from company/release/1.2.3\n',
        'Merge pull request #2 from feature/name\nFirst feature name [TG-123]',
        'Merge pull request #3 from feature/name\nTG-4567: Second feature name',
        'Non-merge commit name',
        'Merge pull request #5 from feature/name\nThird feature name',
      ];
      assert.deepStrictEqual(getFeatures(messages), [
        'First feature name [TG-123] #2',
        'Second feature name [TG-4567] #3',
        'Third feature name #5',
      ]);
    });
  });

  describe('createChangelog', () => {
    it('Resolves with an empty changelog if there are no commits', sinonTest(async (sinon) => {
      sinon.stub(components, 'gitLog').resolves([]);

      const version: LogVersion = { version: 'Unreleased', entries: [] };

      assert.deepStrictEqual(await createChangelog(), [version]);
    }));

    it('Resolves with a correct changelog if there are versions and unreleased changes', sinonTest(async (sinon) => {
      const baseCommit = {
        id: 'e50d34637eb58896916b3cf2529edda6d015bf97',
        files: [],
        author: { name: 'Jane Jones', email: 'jane.jones@example.com' },
        date: new Date('2019-04-15T14:06:20.000Z'),
      };

      const mergeCommits: GitLogEntry[] = [
        {
          ...baseCommit,
          comment: 'Merge pull request #12 from company/release/1.2.3\nSecond release commit',
          parents: ['028e51c', '97a496f'],
        },
        {
          ...baseCommit,
          comment: 'Commit message A',
        },
        {
          ...baseCommit,
          comment: 'Merge pull request #9 from company/release/1.2.2\nFirst release commit',
          parents: ['4c1c736', '56266da'],
        },
      ];

      const versionBCommits: GitLogEntry[] = [
        {
          ...baseCommit,
          comment: 'Merge pull request #11 from company/some/branch/c\nFeature C',
          parents: ['96916b3', '6d015bf'],
        },
        {
          ...baseCommit,
          comment: 'Regular commit to be ignored',
        },
        {
          ...baseCommit,
          comment: 'Merge pull request #10 from company/some/branch/b\nFeature B',
          parents: ['96916b3', '6d015bf'],
        },
      ];

      const versionACommits: GitLogEntry[] = [
        {
          ...baseCommit,
          comment: 'Commit message B',
        },
        {
          ...baseCommit,
          comment: 'Commit message A',
        },
        {
          ...baseCommit,
          comment: 'Merge pull request #8 from company/some/branch/a\nFeature A',
          parents: ['d34637e', '015bf97'],
        },
        {
          ...baseCommit,
          comment: 'Regular commit to be ignored',
        },
      ];

      const unreleasedCommits: GitLogEntry[] = [
        {
          ...baseCommit,
          comment: 'Merge pull request #13 from company/some/branch/d\nFeature D',
        },
      ];

      const gitLog = sinon.stub(components, 'gitLog');
      gitLog.withArgs(true, 'develop').resolves(mergeCommits);
      gitLog.withArgs(false, '1.2.3^2', '1.2.2').resolves(versionBCommits);
      gitLog.withArgs(false, '1.2.2^2', undefined).resolves(versionACommits);
      gitLog.withArgs(true, 'develop', 'master').resolves(unreleasedCommits);

      const versions: LogVersion[] = [
        {
          version: '1.2.2',
          entries: [
            'Commit message B',
            'Commit message A',
            'Feature A #8',
          ],
        },
        {
          version: '1.2.3',
          entries: [
            'Feature C #11',
            'Feature B #10',
          ],
        },
        {
          version: 'Unreleased',
          entries: ['Feature D #13'],
        },
      ];

      assert.notOtherwiseCalled(gitLog, 'gitLog');
      assert.deepStrictEqual(await createChangelog(), versions);
    }));
  });

  describe('normaliseTicketSyntax', () => {
    const titleSingle = 'Feature name [TG-123]';
    const titleMultiple = 'Feature name [TG-123, TG-4567]';

    it('Returns the same string when already normalised', () => {
      assert.strictEqual(normaliseTicketSyntax(titleSingle), titleSingle);
      assert.strictEqual(normaliseTicketSyntax(titleMultiple), titleMultiple);
    });

    it('Returns the same string when there are no tickets', () => {
      const titleNone = 'Feature name with no tickets';
      assert.strictEqual(normaliseTicketSyntax(titleNone), titleNone);
    });

    it('Normalises other formats for a single ticket', () => {
      assert.strictEqual(normaliseTicketSyntax('[TG-123]: Feature name'), titleSingle);
      assert.strictEqual(normaliseTicketSyntax('[TG-123] Feature name'), titleSingle);
      assert.strictEqual(normaliseTicketSyntax('[ TG-123 ] Feature name'), titleSingle);
      assert.strictEqual(normaliseTicketSyntax('TG-123 Feature name'), titleSingle);
      assert.strictEqual(normaliseTicketSyntax('Feature name TG-123'), titleSingle);
    });

    it('Normalises other formats for a multiple tickets', () => {
      assert.strictEqual(normaliseTicketSyntax('TG-123, TG-4567 Feature name'), titleMultiple);
      assert.strictEqual(normaliseTicketSyntax('[TG-123 TG-4567] Feature name'), titleMultiple);
      assert.strictEqual(normaliseTicketSyntax('[TG-123, TG-4567] Feature name'), titleMultiple);
      assert.strictEqual(normaliseTicketSyntax('[TG-123, TG-4567]: Feature name'), titleMultiple);
      assert.strictEqual(normaliseTicketSyntax('[ TG-123 , TG-4567 ]: Feature name'), titleMultiple);
      assert.strictEqual(normaliseTicketSyntax('Feature name TG-123, TG-4567'), titleMultiple);
    });
  });

  describe('getUnreleasedChanges', () => {
    it('Returns the unreleased changes from the changelog data', () => {
      const changelogData: LogVersion[] = [
        { version: '1.2.9', entries: ['One'] },
        { version: '1.2.10', entries: [] },
        { version: 'Unreleased', entries: ['Two', 'Three'] },
      ];

      assert.deepStrictEqual(getUnreleasedChanges(changelogData), ['Two', 'Three']);
    });

    it('Returns the an empty array if there are no unreleased changes', () => {
      const changelogData: LogVersion[] = [
        { version: '1.2.9', entries: ['One'] },
        { version: '1.2.10', entries: ['Two', 'Three'] },
      ];

      assert.deepStrictEqual(getUnreleasedChanges(changelogData), []);
    });
  });

  describe('changelog', () => {
    const changelogData: LogVersion[] = [
      { version: '1.2.9', entries: ['One', 'Two'] },
      { version: '1.2.10', entries: ['Three', 'Four'] },
      { version: 'Unreleased', entries: ['Five'] },
    ];

    it('Resolves with a formatted changelog string when there are changes', sinonTest(async (sinon) => {
      sinon.stub(components, 'createChangelog').resolves(changelogData);

      const expectedChangelog = [
        '1.2.9',
        '=====',
        '',
        '* One',
        '* Two',
        '',
        '1.2.10',
        '======',
        '',
        '* Three',
        '* Four',
        '',
        'Unreleased',
        '==========',
        '',
        '* Five',
        '',
      ].join('\n');

      assert.strictEqual(await changelog()([], {}), expectedChangelog);
    }));

    it('Resolves with an unreleased changelog string when passed the unreleased option', sinonTest(async (sinon) => {
      sinon.stub(components, 'createChangelog').resolves(changelogData);

      assert.strictEqual(await changelog()([], { unreleased: true }), '* Five\n');
    }));

    it('Resolves with an empty changelog when there are no unreleased changes', sinonTest(async (sinon) => {
      sinon.stub(components, 'createChangelog').resolves([]);

      assert.strictEqual(await changelog()([], { unreleased: true }), '');
    }));
  });
});
