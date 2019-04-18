// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';

import { containsCopyrightNotice, parseGitignore } from '../../../../src/scripts/copyright-checker';

describe('copyright-checker', () => {
  describe('parseGitignore', () => {
    it('Splits gitignore format files into lines', () => {
      const gitignore = '/foo\nbar.zim\ngir/*\n';

      assert.deepStrictEqual(parseGitignore(gitignore), ['/foo', 'bar.zim', 'gir/*']);
    });

    it('Ignores empty lines', () => {
      const gitignore = '\n/foo\n\nbar.zim\ngir/*\n\n';

      assert.deepStrictEqual(parseGitignore(gitignore), ['/foo', 'bar.zim', 'gir/*']);
    });

    it('Ignores comments', () => {
      const gitignore = '# Comment 1\n/foo\n# Comment 1\nbar.zim\ngir/*\n';

      assert.deepStrictEqual(parseGitignore(gitignore), ['/foo', 'bar.zim', 'gir/*']);
    });
  });

  describe('containsCopyrightNotice', () => {
    const currentYear = (new Date()).getFullYear();
    it('Returns true if a file contains a copyright notice for this year', () => {
      const file = `
      const hello = 'hi';
      // Copyright ${currentYear} Diffblue Limited. All Rights Reserved.
      `;
      assert.strictEqual(containsCopyrightNotice(file), true);
    });

    it('Returns false if a file does not contain a copyright notice for this year', () => {
      const file = `
      # Copyright ${currentYear - 1} Diffblue Limited. All Rights Reserved.

      Read this important documentation.
      `;
      assert.strictEqual(containsCopyrightNotice(file), false);
    });

    it('Returns true if a file contains a copyright notice up to this year', () => {
      const file = `
      const hello = 'hi';
      // Copyright 2000-${currentYear} Diffblue Limited. All Rights Reserved.
      `;
      assert.strictEqual(containsCopyrightNotice(file), true);
    });
  });

  // describe('getIgnoreRules', () => {
  //   it('Resolves with a list of all ignored files', sinonTest(async (sandbox) => {
  //     const readFile = sandbox.stub(dependencies, 'readFile');
  //     readFile.rejects(new Error('Read file called with unexpected argument(s)'));
  //     readFile.withArgs('/.gitignore').resolves(['*.json', '/node_modules'].join('\n'));
  //     readFile.withArgs('/.copyrightignore').resolves('/yarn.lock');

  //     return getIgnoreRules('/', baseIgnoreFiles).then((files) => {
  //       assert.deepStrictEqual(files, ['/.git', '.DS_Store', '*.json', '/node_modules', '/yarn.lock']);
  //     });
  //   }));
  // });

  /**
   * All below tests do not correctly stub functions.
   * Changes in the logic of the front-end vs platform copyright scripts
   * have caused some tests to infinitely loop due to the file structure.
   */
  // describe('checkCopyright', () => {
  //   const currentYear = (new Date()).getFullYear();

  //   it('Resolves when all files have valid copyright notices', sinonTest(async (sandbox) => {
  //     const getIgnoreListStub = sandbox.stub(dependencies, 'getIgnoreRules');
  //     getIgnoreListStub.resolves(['/node_modules']);

  //     const childProcess = sandbox.stub(dependencies, 'childProcess');
  //     childProcess.resolves({ stdout: '', stderr: '' });

  //     const listFiles = sandbox.stub(dependencies, 'listFiles');
  //     listFiles.resolves(['docs.txt', 'folder/config.yml', 'folder/subfolder/script.js']);

  //     const readFile = sandbox.stub(dependencies, 'readFile');
  //     readFile.resolves(`Copyright 2010-${currentYear} Diffblue Limited. All Rights Reserved.`);

  //     await checkCopyright();
  //     assertUtil.calledOnceWith(listFiles, ['**/*', { dot: true, ignore: ['/node_modules'], nodir: true }]);
  //     assertUtil.calledWith(readFile, [
  //       ['docs.txt'],
  //       ['folder/config.yml'],
  //       ['folder/subfolder/script.js'],
  //     ]);
  //   })).timeout(60000);

  //   it('Rejects when not all files have valid copyright notices', sinonTest(async (sandbox) => {
  //     const getIgnoreListStub = sandbox.stub(dependencies, 'getIgnoreRules');
  //     getIgnoreListStub.resolves(['/node_modules']);

  //     const listFiles = sandbox.stub(dependencies, 'listFiles');
  //     listFiles.resolves(['docs.txt', 'folder/config.yml', 'folder/subfolder/script.js']);

  //     const readFile = sandbox.stub(dependencies, 'readFile');
  //     readFile.withArgs('docs.txt').resolves(`Copyright 2000-${currentYear} Diffblue Limited. All Rights Reserved.`);
  //     readFile.withArgs('folder/config.yml').resolves(
  //       `# Copyright 2010-${currentYear} Diffblue Limited. All Rights Reserved.`,
  //     );
  //     readFile.withArgs('folder/subfolder/script.js').resolves("console.log('nope');");

  //     const expectedError = (
  //       `Error: No valid ${currentYear} copyright statement found in:\nfolder/subfolder/script.js`
  //     );
  //     await assertUtil.rejectsWith(checkCopyright(), expectedError);
  //     assertUtil.calledOnceWith(listFiles, ['**/*', { dot: true, ignore: ['/node_modules'], nodir: true }]);
  //     assertUtil.calledWith(readFile, [
  //       ['docs.txt'],
  //       ['folder/config.yml'],
  //       ['folder/subfolder/script.js'],
  //     ]);
  //   }));

  //   it('Rejects when listFiles rejects', sinonTest(async (sandbox) => {
  //     const listFiles = sandbox.stub(dependencies, 'listFiles');
  //     listFiles.rejects('Error message');

  //     const readFile = sandbox.stub(dependencies, 'readFile');
  //     readFile.resolves('/node_modules');

  //     return assertUtil.rejectsWith(checkCopyright(), 'Error message');
  //   }));

  //   it('Rejects when readFile rejects', sinonTest((sandbox) => {
  //     const listFiles = sandbox.stub(dependencies, 'listFiles');
  //     listFiles.resolves(['docs.txt']);

  //     const readFile = sandbox.stub(dependencies, 'readFile');
  //     readFile.rejects('Error message');

  //     return assertUtil.rejectsWith(checkCopyright(), 'Error message');
  //   }));
  // });
});
