// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { StatusResult } from 'simple-git/promise';
import createRelease, {
  checkPrerequisites,
  commitPackageJsonChange,
  components,
  createNewReleaseBranch,
  createReleasePR,
  dependencies,
  gitFetchOptions,
  incrementVersionNumber,
  loadPackageJson,
  repoIsClean,
  updateAndCheckBranch,
  writeChangesToPackageJson } from '../../../src/scripts/createRelease';
import assert from '../../../src/utils/assertExtra';
import { ExpectedError } from '../../../src/utils/commandLineRunner';
import sinonTestFactory from '../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

describe('scripts/createRelease', () => {
  describe('checkPrerequisites', () => {
    it('Resolves because prereqs are installed', sinonTest(async (sinon) => {
      // TODO: unstub this when hub is installed on circle
      sinon.stub(dependencies, 'exec').resolves();

      await checkPrerequisites();
    }));

    it('Throws an error because hub is not installed', sinonTest(async (sinon) => {
      const exec = sinon.stub(dependencies, 'exec');

      const error = new Error(
        [

          'Command failed: hub status',
          '/bin/sh: hub: command not found',
        ].join('\n'));
      exec.rejects(error);

      await assert.rejectsWith(checkPrerequisites(),
        new ExpectedError(`Hub prerequisite not installed or not configured correctly: Error: ${error.message}`));
    }));
  });

  describe('createReleasePR', () => {
    it('Pushes a branch and execs hub', sinonTest(async (sinon) => {
      const push = sinon.stub(dependencies.simpleGit, 'push');
      const exec = sinon.stub(dependencies, 'exec');

      const newVersion = '1.0.0';
      const newBranchName = `release/${newVersion}`;
      const changes = ['Change 1', 'Change 2'];

      await createReleasePR(newBranchName, newVersion, changes);

      assert.calledOnceWith(push, ['origin', newBranchName]);
      assert.calledOnceWith(exec, ['hub pull-request -b master -m \"Release 1.0.0\n\nChange 1\nChange 2\"']);
    }));
  });

  describe('commitPackageJsonChange', () => {
    it('package.json filename is correct', sinonTest(async (sinon) => {
      const add = sinon.stub(dependencies.simpleGit, 'add');
      sinon.stub(dependencies.simpleGit, 'commit').resolves();

      const newVersion = '1.0.0';

      await commitPackageJsonChange(newVersion);

      assert.calledOnceWith(add, ['package.json']);
    }));
    it('Commit message is correct format', sinonTest(async (sinon) => {
      sinon.stub(dependencies.simpleGit, 'add').resolves();
      const commit = sinon.stub(dependencies.simpleGit, 'commit');

      const newVersion = '1.0.0';
      const commitMessage = `Bump version to ${newVersion}`;

      await commitPackageJsonChange(newVersion);

      assert.calledOnceWith(commit, [commitMessage]);
    }));
  });

  describe('writeChangesToPackageJson', () => {
    it('Resolves after rewriting the package.json with the new version number', sinonTest(async (sinon) => {
      const writeFile = sinon.stub(dependencies, 'writeFile');

      await writeChangesToPackageJson('whatever', { version: '0.0.0' });

      assert.calledOnceWith(writeFile, ['whatever', '{\n  \"version\": \"0.0.0\"\n}\n']);
    }));
  });

  describe('createNewReleaseBranch', () => {
    it('Creates a new branch with the correct name', sinonTest(async (sinon) => {
      const checkoutLocalBranch = sinon.stub(dependencies.simpleGit, 'checkoutLocalBranch');

      const newVersion = '1.0.0';
      const expectedNewBranchName = `release/${newVersion}`;

      const newBranchName = await createNewReleaseBranch(newVersion);

      assert.calledOnceWith(checkoutLocalBranch, [expectedNewBranchName]);
      assert.deepStrictEqual(newBranchName, expectedNewBranchName);
    }));
  });

  describe('loadPackageJson', () => {
    it('package.json filename is correct', sinonTest(async (sinon) => {
      const readFile = sinon.stub(dependencies, 'readFile');

      // minimum to keep JSON parser happy
      readFile.resolves('true');

      const filename = 'package.json';

      await loadPackageJson();

      assert.calledOnceWith(readFile, [filename]);
    }));

    it('Returns an object containing a "version" property', sinonTest(async (sinon) => {
      sinon.stub(dependencies, 'readFile').resolves(['{', '  "version": "1.0.0"', '}'].join('\n'));

      const packageJson = await loadPackageJson();

      assert.deepStrictEqual(packageJson, { version: '1.0.0' });
    }));

    it('Throws exception due to invalid JSON in package.json', sinonTest(async (sinon) => {
      sinon.stub(dependencies, 'readFile').resolves('invalid');

      await assert.rejectsWith(loadPackageJson(), new ExpectedError(
        'Unable to parse package.json: SyntaxError: Unexpected token i in JSON at position 0',
        ));
    }));
  });

  describe('repoIsClean', () => {
    it('True if repo is clean', sinonTest(async (sinon) => {
      const status = sinon.stub(dependencies.simpleGit, 'status');

      const repoStatus = { isClean: () => true };
      status.resolves(repoStatus as StatusResult);

      const cleanRepo = await repoIsClean();
      assert.deepStrictEqual(cleanRepo, true);
      assert.calledOnce(status);
    }));

    it('False if repo is dirty', sinonTest(async (sinon) => {
      const status = sinon.stub(dependencies.simpleGit, 'status');

      const repoStatus = { isClean: () => false };
      status.resolves(repoStatus as StatusResult);

      const cleanRepo = await repoIsClean();
      assert.deepStrictEqual(cleanRepo, false);
      assert.calledOnce(status);
    }));
  });

  describe('incrementVersionNumber', () => {
    it('Updates 1.0.0 to 1.0.1 for patch', sinonTest(async (sinon) => {
      const version = '1.0.0';

      const newVersion = incrementVersionNumber(version, { releaseType: 'patch' });
      assert.deepStrictEqual(newVersion, '1.0.1');
    }));

    it('Updates 1.0.0 to 1.1.0 for minor', sinonTest(async (sinon) => {
      const version = '1.0.0';

      const newVersion = incrementVersionNumber(version, { releaseType: 'minor' });
      assert.deepStrictEqual(newVersion, '1.1.0');
    }));

    it('Updates 1.0.0 to 2.0.0 for major', sinonTest(async (sinon) => {
      const version = '1.0.0';

      const newVersion = incrementVersionNumber(version, { releaseType: 'major' });
      assert.deepStrictEqual(newVersion, '2.0.0');
    }));

    it('Throws an expected error for invalid version number', sinonTest(async (sinon) => {
      const version = '1';

      assert.throws(() => incrementVersionNumber(version, { releaseType: 'patch' }), ExpectedError);
    }));
  });

  describe('updateAndCheckBranch', () => {
    it('Attempts to fetch changes because requested branch not checked out', sinonTest(async (sinon) => {
      sinon.stub(dependencies.logger, 'info');
      const fetch = sinon.stub(dependencies.simpleGit, 'fetch');

      const currentBranchName = 'release/1.0.0';
      const requestBranchName = 'develop';
      const repoStatus = { current: currentBranchName };
      sinon.stub(dependencies.simpleGit, 'status').resolves(repoStatus as StatusResult);

      await updateAndCheckBranch(requestBranchName);
      assert.calledOnceWith(fetch, ['origin', `${requestBranchName}:${requestBranchName}`, gitFetchOptions]);
    }));

    it('Attempts to pull changes but fails because branch dirty', sinonTest(async (sinon) => {
      sinon.stub(dependencies.logger, 'info');
      const fetch = sinon.stub(dependencies.simpleGit, 'fetch');
      const pull = sinon.stub(dependencies.simpleGit, 'pull');

      const currentBranchName = 'develop';
      const repoStatus = { current: currentBranchName };
      sinon.stub(dependencies.simpleGit, 'status').resolves(repoStatus as StatusResult);
      sinon.stub(components, 'repoIsClean').resolves(false);

      const branchName = 'develop';
      const gitFetchOptions = ['--tags'];

      const expectedError = new Error([
          `Branch \'${branchName}\' is not clean.`,
          'Please stash or commit your changes before attempting release.',
        ].join(' '),
      );
      await assert.rejectsWith(updateAndCheckBranch(branchName), expectedError);
      // ensure that 'checkoutLocalBranch' is only called once because code fails early due to error
      assert.calledOnce(pull);
      assert.calledOnceWith(fetch, ['origin', branchName, gitFetchOptions]);
    }));

    it('Attempts to pull changes and succeeds', sinonTest(async (sinon) => {
      sinon.stub(dependencies.logger, 'info');
      const fetch = sinon.stub(dependencies.simpleGit, 'fetch');
      const pull = sinon.stub(dependencies.simpleGit, 'pull');

      const fakeBranchName = 'develop';
      const repoStatus = { current: fakeBranchName };
      sinon.stub(dependencies.simpleGit, 'status').resolves(repoStatus as StatusResult);
      sinon.stub(components, 'repoIsClean').resolves(true);

      const branchName = 'develop';
      const gitFetchOptions = ['--tags'];

      await updateAndCheckBranch(branchName);
      assert.calledOnceWith(fetch, ['origin', branchName, gitFetchOptions]);
      assert.calledOnce(pull);
    }));
  });

  describe('createRelease', () => {
    it('Throws expected error due to no changes', sinonTest(async (sinon) => {
      const loadPackageJson = sinon.stub(components, 'loadPackageJson');
      const createNewReleaseBranch = sinon.stub(components, 'createNewReleaseBranch');
      const writeChangesToPackageJson = sinon.stub(components, 'writeChangesToPackageJson');
      const commitPackageJsonChange = sinon.stub(components, 'commitPackageJsonChange');
      const createReleasePR = sinon.stub(components, 'createReleasePR');
      const askUserForPatchType = sinon.stub(components, 'askUserForPatchType');

      sinon.stub(dependencies.logger, 'info');
      sinon.stub(dependencies.simpleGit, 'checkout').resolves();
      sinon.stub(components, 'updateAndCheckBranch').resolves();
      sinon.stub(dependencies, 'createChangelog').resolves([]);
      sinon.stub(dependencies, 'getUnreleasedChanges').returns([]);
      // TODO: unstub this when hub is installed on circle
      sinon.stub(components, 'checkPrerequisites').resolves();

      const expectedError = new Error('No changes detected in changelog. Is there anything to release?');

      await assert.rejectsWith(createRelease()([], {}), expectedError);
      assert.notCalled(loadPackageJson);
      assert.notCalled(askUserForPatchType);
      assert.notCalled(createNewReleaseBranch);
      assert.notCalled(writeChangesToPackageJson);
      assert.notCalled(commitPackageJsonChange);
      assert.notCalled(createReleasePR);
    }));

    it('Posts a PR on GitHub despite no changes because flag is set', sinonTest(async (sinon) => {
      sinon.stub(dependencies.logger, 'info');
      sinon.stub(dependencies.simpleGit, 'checkout').resolves();
      sinon.stub(dependencies, 'createChangelog').resolves([]);
      sinon.stub(dependencies, 'getUnreleasedChanges').returns([]);
      sinon.stub(components, 'updateAndCheckBranch').resolves();
      sinon.stub(components, 'loadPackageJson').resolves({ version: '1.0.0' });
      sinon.stub(components, 'createNewReleaseBranch').resolves('release/1');
      sinon.stub(components, 'writeChangesToPackageJson').resolves();
      sinon.stub(components, 'commitPackageJsonChange').resolves();
      sinon.stub(components, 'createReleasePR').resolves();
      sinon.stub(components, 'askUserForPatchType').resolves({ releaseType: 'minor' });
      // TODO: unstub this when hub is installed on circle
      sinon.stub(components, 'checkPrerequisites').resolves();

      const result = await createRelease()([], { force: true });
      assert.deepStrictEqual(result, 'Release process began successfully');
    }));

    it('Resolves successfully!', sinonTest(async (sinon) => {
      sinon.stub(dependencies.logger, 'info');
      sinon.stub(dependencies.simpleGit, 'checkout').resolves();
      sinon.stub(dependencies, 'createChangelog').resolves([]);
      sinon.stub(dependencies, 'getUnreleasedChanges').returns(['Change 1', 'Change 2']);
      sinon.stub(components, 'updateAndCheckBranch').resolves();
      sinon.stub(components, 'loadPackageJson').resolves({ version: '1.0.0' });
      sinon.stub(components, 'createNewReleaseBranch').resolves('release/1');
      sinon.stub(components, 'writeChangesToPackageJson').resolves();
      sinon.stub(components, 'commitPackageJsonChange').resolves();
      sinon.stub(components, 'createReleasePR').resolves();
      sinon.stub(components, 'askUserForPatchType').resolves({ releaseType: 'minor' });
      // TODO: unstub this when hub is installed on circle
      sinon.stub(components, 'checkPrerequisites').resolves();

      const result = await createRelease()([], {});
      assert.deepStrictEqual(result, 'Release process began successfully');
    }));
  });
});
