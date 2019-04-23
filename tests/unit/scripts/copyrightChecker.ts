// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';

import checkCopyright, {
  buildFileList,
  catchMissingFile,
  components,
  dependencies,
  getCommittedFiles,
  getIgnoreRules,
  mapRootRelativeRules,
  parseGitignore,
} from '../../../src/scripts/copyrightChecker';
import sinonTestFactory from '../../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

/** Error class for testing catchMissingFile */
class TestError extends Error implements NodeJS.ErrnoException {
  public code?: string;
}

describe('scripts/copyright-checker', () => {
  describe('parseGitignore', () => {
    it('Splits gitignore format files into lines', () => {
      const gitignore = '/foo\nbar.zim\ngir/*\n';
      assert.deepStrictEqual(parseGitignore(gitignore), ['/foo', 'bar.zim', 'gir/*']);
    });

    it('Splits gitignore format files into lines, ignoring empty lines', () => {
      const gitignore = '\n/foo\n\nbar.zim\ngir/*\n\n';
      assert.deepStrictEqual(parseGitignore(gitignore), ['/foo', 'bar.zim', 'gir/*']);
    });

    it('Splits gitignore format files into lines, ignoring comments', () => {
      const gitignore = '# Comment 1\n/foo\n# Comment 1\nbar.zim\ngir/*\n';
      assert.deepStrictEqual(parseGitignore(gitignore), ['/foo', 'bar.zim', 'gir/*']);
    });

    it('Splits gitignore format files into lines for any line separator', () => {
      const gitignore = '/foo\nbar.zim\r\ngir/*\r*.zim\n';
      assert.deepStrictEqual(parseGitignore(gitignore), ['/foo', 'bar.zim', 'gir/*', '*.zim']);
    });
  });

  describe('catchMissingFile', () => {
    it('Returns an empty string when given a file not found exception', () => {
      const error = new TestError('File not found');
      error.code = 'ENOENT';

      const result = catchMissingFile(error);

      assert.strictEqual(result, '');
    });

    it('Rethrows any other error it is passed', () => {
      const error = new TestError('Some error');
      error.code = 'OTHER';

      assert.throws(() => catchMissingFile(error), 'Some error');
    });
  });

  describe('mapRootRelativeRules', () => {
    it('Returns rules, mapping root-relative to include their full path ', () => {
      const result = mapRootRelativeRules('folder/subfolder', ['/node_modules', '*.log', '!test.log']);
      assert.deepStrictEqual(result, ['/folder/subfolder/node_modules', '*.log', '!test.log']);
    });

    it('Applies no mapping for the current directory', () => {
      const result = mapRootRelativeRules('./', ['/node_modules', '*.log', '!test.log']);
      assert.deepStrictEqual(result, ['/node_modules', '*.log', '!test.log']);
    });
  });

  describe('getCommittedFiles', () => {
    it('Gets the committed files from git', sinonTest(async (sinon) => {
      const files = [
        'file.txt',
        'folder/file.md',
        'folder/submodule/file.log',
      ];
      const exec = sinon.stub(dependencies, 'exec');
      exec.resolves({ stdout: files.join('\n'), stderr: '' });

      const result = await getCommittedFiles();

      assert.deepStrictEqual(result, new Set(files));
      assert.calledOnceWith(exec, ['git ls-files']);
    }));
  });

  describe('buildFileList', () => {
    it('Resolves with files having recursing through subfolders', sinonTest(async (sinon) => {
      const fileSettings = (ignore: string[]) => ({ ignore: ignore, nodir: true, dot: true });
      const folderSettings = (ignore: string[]) => ({ ignore: ignore, dot: true });

      const globGitignore = sinon.stub(dependencies, 'globGitignore');
      const getIgnoreRules = sinon.stub(components, 'getIgnoreRules');

      const baseIgnore = ['/node_modules'];
      const nestedIgnore = ['/node_modules', '*.md'];

      getIgnoreRules.withArgs('.', baseIgnore).resolves(baseIgnore);
      globGitignore.withArgs('*', fileSettings(baseIgnore)).resolves(['README.md']);
      globGitignore.withArgs('*/', folderSettings(baseIgnore)).resolves(['folder/']);

      getIgnoreRules.withArgs('folder/', baseIgnore).resolves(nestedIgnore);
      globGitignore.withArgs('folder/*', fileSettings(nestedIgnore)).resolves(['folder/test.log']);
      globGitignore.withArgs('folder/*/', folderSettings(nestedIgnore)).resolves(['folder/subfolder/']);

      getIgnoreRules.withArgs('folder/subfolder/', nestedIgnore).resolves(nestedIgnore);
      globGitignore.withArgs('folder/subfolder/*', fileSettings(nestedIgnore)).resolves(['folder/subfolder/temp.txt']);
      globGitignore.withArgs('folder/subfolder/*/', folderSettings(nestedIgnore)).resolves([]);

      assert.notOtherwiseCalled(globGitignore, 'globGitignore');
      assert.notOtherwiseCalled(getIgnoreRules, 'getIgnoreRules');

      const result = await buildFileList('.', ['/node_modules']);

      assert.deepStrictEqual(result, [
        'README.md',
        'folder/test.log',
        'folder/subfolder/temp.txt',
      ]);
    }));

    it('Resolves with no files if there are none, recursing through subfolders', sinonTest(async (sinon) => {
      const fileSettings = { ignore: ['/node_modules'], nodir: true, dot: true };
      const folderSettings = { ignore: ['/node_modules'], dot: true };

      const globGitignore = sinon.stub(dependencies, 'globGitignore');
      const getIgnoreRules = sinon.stub(components, 'getIgnoreRules');

      getIgnoreRules.withArgs('.', ['/node_modules']).resolves(['/node_modules']);
      globGitignore.withArgs('*', fileSettings).resolves([]);
      globGitignore.withArgs('*/', folderSettings).resolves(['folder/']);

      getIgnoreRules.withArgs('folder/', ['/node_modules']).resolves(['/node_modules']);
      globGitignore.withArgs('folder/*', fileSettings).resolves([]);
      globGitignore.withArgs('folder/*/', folderSettings).resolves([]);

      assert.notOtherwiseCalled(globGitignore, 'globGitignore');
      assert.notOtherwiseCalled(getIgnoreRules, 'getIgnoreRules');

      const result = await buildFileList('.', ['/node_modules']);

      assert.deepStrictEqual(result, []);
    }));
  });

  describe('getIgnoreRules', () => {
    it('Resolves with a list of all ignored files', sinonTest(async (sinon) => {
      const readFile = sinon.stub(dependencies, 'readFile');
      readFile.withArgs('.gitignore').resolves(['*.json', '/node_modules'].join('\n'));
      readFile.withArgs('.copyrightignore').resolves('/yarn.lock');

      assert.notOtherwiseCalled(readFile, 'readFile');

      const files = await getIgnoreRules('.', ['/foo', '.BAR']);

      assert.deepStrictEqual(files, ['/foo', '.BAR', '*.json', '/node_modules', '/yarn.lock']);
      assert.calledWith(readFile, [
        ['.gitignore'],
        ['.copyrightignore'],
      ]);
    }));
  });

  describe('checkCopyright', () => {
    const year = 2010;

    it('Resolves when all files have valid copyright notices', sinonTest(async (sinon) => {
      const buildFileList = sinon.stub(components, 'buildFileList');
      buildFileList.resolves(['docs.txt', 'folder/config.yml', 'folder/subfolder/script.js']);

      const getIgnoreRules = sinon.stub(components, 'getIgnoreRules');
      getIgnoreRules.resolves(['/node_modules']);

      const getCommittedFiles = sinon.stub(components, 'getCommittedFiles');
      getCommittedFiles.resolves(new Set(['folder/config.yml', 'folder/subfolder/script.js', 'other.txt']));

      const readFile = sinon.stub(dependencies, 'readFile');
      readFile.resolves(`Copyright ${year} Company`);

      const copyrightPattern = /Copyright 2010 Company/;
      const baseIgnoreFiles = ['/.git', '.DS_Store'];

      await checkCopyright(year, copyrightPattern, baseIgnoreFiles);

      assert.calledWith(readFile, [
        ['folder/config.yml'],
        ['folder/subfolder/script.js'],
      ]);
    }));

    it('Rejects when not all files have valid copyright notices', sinonTest(async (sinon) => {
      const buildFileList = sinon.stub(components, 'buildFileList');
      buildFileList.resolves(['docs.txt', 'folder/config.yml', 'folder/subfolder/script.js']);

      const getIgnoreRules = sinon.stub(components, 'getIgnoreRules');
      getIgnoreRules.resolves(['/node_modules']);

      const getCommittedFiles = sinon.stub(components, 'getCommittedFiles');
      getCommittedFiles.resolves(new Set(['docs.txt', 'folder/config.yml', 'folder/subfolder/script.js', 'other.txt']));

      const readFile = sinon.stub(dependencies, 'readFile');
      readFile.withArgs('docs.txt').resolves('Copyright 2000-2010 Company');
      readFile.withArgs('folder/config.yml').resolves('# Copyright 2010 Company ');
      readFile.withArgs('folder/subfolder/script.js').resolves("console.log('nope');");

      assert.notOtherwiseCalled(readFile, 'readFile');

      const copyrightPattern = /Copyright (\d{4}-)?2010 Company/;
      const baseIgnoreFiles = ['/.git', '.DS_Store'];
      const expectedError = new Error('No valid 2010 copyright statement found in:\nfolder/subfolder/script.js');

      await assert.rejectsWith(checkCopyright(year, copyrightPattern, baseIgnoreFiles), expectedError);

      assert.calledWith(readFile, [
        ['docs.txt'],
        ['folder/config.yml'],
        ['folder/subfolder/script.js'],
      ]);
    }));
  });
});
