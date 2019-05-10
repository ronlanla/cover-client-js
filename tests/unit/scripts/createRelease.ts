// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { StatusResult } from 'simple-git/promise';
import createRelease, { commitPackageJsonChange, components, createNewReleaseBranch, createReleasePR, dependencies, incrementVersionNumber, loadPackageJson, repoIsClean, updateAndCheckBranch, writeChangesToPackageJson } from '../../../src/scripts/createRelease';
import assert from '../../../src/utils/assertExtra';
import { ExpectedError } from '../../../src/utils/commandLineRunner';
import sinonTestFactory from '../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

describe('scripts/createRelease', () => {
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
      const commit = sinon.stub(dependencies.simpleGit, 'commit');

      commit.resolves();

      const newVersion = "1.0.0";

      await commitPackageJsonChange(newVersion);

      assert.calledOnceWith(add, ['package.json']);
    }));
    it('Commit message is correct format', sinonTest(async (sinon) => {
      const add = sinon.stub(dependencies.simpleGit, 'add');
      const commit = sinon.stub(dependencies.simpleGit, 'commit');

      add.resolves();

      const newVersion = "1.0.0";
      const commitMessage = `Bump version to ${newVersion}`;

      await commitPackageJsonChange(newVersion);

      assert.calledOnceWith(commit, [commitMessage]);
    }));
  });

  describe('writeChangesToPackageJson', () => {
    it('Resolves after rewriting the package.json with the new version number', sinonTest(async (sinon) => {
      const writeFile = sinon.stub(dependencies, 'writeFile');

      await writeChangesToPackageJson('whatever', { version: '0.0.0' });

      assert.calledOnceWith(writeFile, ['whatever', '{\n  \"version\": \"0.0.0\"\n}']);
    }));
  });

  describe('createNewReleaseBranch', () => {
    it('Creates a new branch with the correct name', sinonTest(async (sinon) => {
      const checkoutLocalBranch = sinon.stub(dependencies.simpleGit, 'checkoutLocalBranch');

      const newVersion = '1.0.0';
      const expectedNewBranchName = `release/${newVersion}`;

      const newBranchName = await createNewReleaseBranch(newVersion);

      assert.calledOnceWith(checkoutLocalBranch, [expectedNewBranchName]);
      assert.deepEqual(newBranchName, expectedNewBranchName);
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
      const readFile = sinon.stub(dependencies, 'readFile');

      readFile.resolves(['{', '  "version": "1.0.0"', '}'].join('\n'));

      const packageJson = await loadPackageJson();

      assert.deepEqual(packageJson, { version: "1.0.0" });
    }));
  });

  describe('repoIsClean', () => {
    it('True if repo is clean', sinonTest(async (sinon) => {
      const status = sinon.stub(dependencies.simpleGit, 'status');
      // fake StatusResult
      status.resolves(
        {
          isClean: () => Boolean(true)
        } as StatusResult
      );

      const cleanRepo = await repoIsClean();
      assert.deepEqual(cleanRepo, true);
      assert.calledOnce(status);
    }));

    it('False if repo is dirty', sinonTest(async (sinon) => {

      const status = sinon.stub(dependencies.simpleGit, 'status');
      // fake StatusResult
      status.resolves(
        {
          isClean: () => Boolean(false)
        } as StatusResult
      );

      const cleanRepo = await repoIsClean();
      assert.deepEqual(cleanRepo, false);
      assert.calledOnce(status);
    }));
  });

  describe('incrementVersionNumber', () => {
    it('Updates 1.0.0 to 1.0.1 for patch', sinonTest(async (sinon) => {
      const version = '1.0.0';

      const newVersion = incrementVersionNumber(version, { releaseType: "patch" });
      assert.deepEqual(newVersion, '1.0.1');
    }));

    it('Updates 1.0.0 to 1.1.0 for minor', sinonTest(async (sinon) => {
      const version = '1.0.0';

      const newVersion = incrementVersionNumber(version, { releaseType: "minor" });
      assert.deepEqual(newVersion, '1.1.0');
    }));

    it('Updates 1.0.0 to 2.0.0 for major', sinonTest(async (sinon) => {
      const version = '1.0.0';

      const newVersion = incrementVersionNumber(version, { releaseType: "major" });
      assert.deepEqual(newVersion, '2.0.0');
    }));

    it('Throws an expected error for invalid version number', sinonTest(async (sinon) => {
      const version = '1';

      assert.throws(() => incrementVersionNumber(version, { releaseType: 'patch' }), ExpectedError);
    }));
  });

  describe('updateAndCheckBranch', () => {
    it('Throws expected error because branch is not clean', sinonTest(async (sinon) => {
      const fetch = sinon.stub(dependencies.simpleGit, 'fetch');
      const pull = sinon.stub(dependencies.simpleGit, 'pull');
      const checkout = sinon.stub(dependencies.simpleGit, 'checkout');
      const status = sinon.stub(dependencies.simpleGit, 'status');
      const repoIsClean = sinon.stub(components, 'repoIsClean');

      const fakeBranchName = 'feature/fake-branch';
      status.resolves(
        {
          isClean: () => Boolean(true),
          current: fakeBranchName,
        } as StatusResult
      );
      repoIsClean.resolves(false);

      const branchName = 'develop';
      const gitFetchOptions = ['--tags'];

      const expectedError = new Error([
          `Branch \'${branchName}\' is not clean.`,
          'Please stash or commit your changes before attempting release.',
        ].join(' ')
      );
      await assert.rejectsWith(updateAndCheckBranch(branchName), expectedError);
      // ensure that 'checkoutLocalBranch' is only called once because code fails early due to error
      assert.calledWith(checkout, [['develop']]);
      assert.calledOnce(pull);
      assert.calledOnceWith(fetch, ['origin', branchName, gitFetchOptions]);
    }));

    it('Resolves when git status confirmed clean', sinonTest(async (sinon) => {
      const fetch = sinon.stub(dependencies.simpleGit, 'fetch');
      const pull = sinon.stub(dependencies.simpleGit, 'pull');
      const checkout = sinon.stub(dependencies.simpleGit, 'checkout');
      const status = sinon.stub(dependencies.simpleGit, 'status');
      const repoIsClean = sinon.stub(components, 'repoIsClean');

      const fakeBranchName = 'feature/fake-branch';
      status.resolves(
        {
          isClean: () => Boolean(true),
          current: fakeBranchName,
        } as StatusResult
      );
      repoIsClean.resolves(true);

      const branchName = 'develop';
      const gitFetchOptions = ['--tags'];

      await updateAndCheckBranch(branchName);
      assert.calledOnceWith(fetch, ['origin', branchName, gitFetchOptions]);
      assert.calledWith(checkout, [['develop'], [fakeBranchName]]);
      assert.calledOnce(pull);
    }));
  });

  describe('createRelease', () => {
    it('Throws expected error due to no changes', sinonTest(async (sinon) => {
      const checkout = sinon.stub(dependencies.simpleGit, 'checkout');
      const updateAndCheckBranch = sinon.stub(components, 'updateAndCheckBranch');
      const getListOfUnreleasedChanges = sinon.stub(components, 'getListOfUnreleasedChanges');
      const loadPackageJson = sinon.stub(components, 'loadPackageJson');
      const createNewReleaseBranch = sinon.stub(components, 'createNewReleaseBranch');
      const writeChangesToPackageJson = sinon.stub(components, 'writeChangesToPackageJson');
      const commitPackageJsonChange = sinon.stub(components, 'commitPackageJsonChange');
      const createReleasePR = sinon.stub(components, 'createReleasePR');
      const askUserForPatchType = sinon.stub(components, 'askUserForPatchType');

      checkout.resolves();
      updateAndCheckBranch.resolves();
      getListOfUnreleasedChanges.resolves([]);

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
      const checkout = sinon.stub(dependencies.simpleGit, 'checkout');
      const updateAndCheckBranch = sinon.stub(components, 'updateAndCheckBranch');
      const getListOfUnreleasedChanges = sinon.stub(components, 'getListOfUnreleasedChanges');
      const loadPackageJson = sinon.stub(components, 'loadPackageJson');
      const createNewReleaseBranch = sinon.stub(components, 'createNewReleaseBranch');
      const writeChangesToPackageJson = sinon.stub(components, 'writeChangesToPackageJson');
      const commitPackageJsonChange = sinon.stub(components, 'commitPackageJsonChange');
      const createReleasePR = sinon.stub(components, 'createReleasePR');
      const askUserForPatchType = sinon.stub(components, 'askUserForPatchType');

      checkout.resolves();
      updateAndCheckBranch.resolves();
      getListOfUnreleasedChanges.resolves([]);
      loadPackageJson.resolves({ version: '1.0.0' });
      createNewReleaseBranch.resolves('release/1');
      writeChangesToPackageJson.resolves();
      commitPackageJsonChange.resolves();
      createReleasePR.resolves();
      askUserForPatchType.resolves({releaseType: 'minor'});

      const result = await createRelease()([], {force: true});
      assert.deepEqual(result, 'Release process began successfully');
    }));

    it('Resolves successfully!', sinonTest(async (sinon) => {
      const checkout = sinon.stub(dependencies.simpleGit, 'checkout');
      const updateAndCheckBranch = sinon.stub(components, 'updateAndCheckBranch');
      const getListOfUnreleasedChanges = sinon.stub(components, 'getListOfUnreleasedChanges');
      const loadPackageJson = sinon.stub(components, 'loadPackageJson');
      const createNewReleaseBranch = sinon.stub(components, 'createNewReleaseBranch');
      const writeChangesToPackageJson = sinon.stub(components, 'writeChangesToPackageJson');
      const commitPackageJsonChange = sinon.stub(components, 'commitPackageJsonChange');
      const createReleasePR = sinon.stub(components, 'createReleasePR');
      const askUserForPatchType = sinon.stub(components, 'askUserForPatchType');

      checkout.resolves();
      updateAndCheckBranch.resolves();
      getListOfUnreleasedChanges.resolves(['Change 1', 'Change 2']);
      loadPackageJson.resolves({ version: '1.0.0' });
      createNewReleaseBranch.resolves('release/1');
      writeChangesToPackageJson.resolves();
      commitPackageJsonChange.resolves();
      createReleasePR.resolves();
      askUserForPatchType.resolves({releaseType: 'minor'});

      const result = await createRelease()([], {});
      assert.deepEqual(result, 'Release process began successfully');
    }));
  });
});
