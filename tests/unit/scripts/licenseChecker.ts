// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import licenseChecker, {
  checkLicenses,
  Command,
  components,
  dependencies,
  findMissingLicenses,
  generateAcceptableLicenses,
  getDescription,
  getLicenseInfo,
  loadAcceptableLicenses,
  parseLicenseInfo,
} from '../../../src/scripts/licenseChecker';

const sinonTest = sinonTestFactory();

const sampleLicenseData = {
  type: 'table',
  data: {
    head: ['Name', 'Version', 'License', 'URL', 'VendorUrl', 'VendorName'],
    body: [
      ['lodash', '4.17.11', 'MIT', 'https://lodash.git', 'https://lodash.com', 'John-David Dalton'],
      ['bluebird', '3.5.4', 'MIT', 'git://bluebird.git', 'https://bluebird.com', 'Petka Antonov'],
      ['lodash', '5.17.11', 'isc', 'https://lodash.git', 'https://lodash.com', 'John-David Dalton'],
    ],
  },
};

const sampleBadLicenseData = {
  type: 'table',
  data: {
    head: ['Name', 'Version', 'License', 'URL', 'VendorUrl', 'VendorName'],
    body: [
      ['lodash', '4.17.11', 'MIT', 'https://lodash.git', 'https://lodash.com', 'John-David Dalton'],
      ['bluebird', '3.5.4', 'MIT', 'git://bluebird.git', 'https://bluebird.com', 'Petka Antonov'],
      ['lodash', '5.17.11', 'isc', 'https://lodash.git', 'https://lodash.com', 'John-David Dalton'],
      ['lodash', '6.17.11', 'wtf', 'https://lodash.git', 'https://lodash.com', 'John-David Dalton'],
    ],
  },
};

const missingLicenseError = new Error(
  `Licenses missing from acceptable list:
 - Module "lodash" using license "wtf" not in acceptable licenses`,
);

const sampleAcceptableLicenseFile = `{
  "lodash": [
    "mit",
    "isc"
  ],
  "bluebird": [
    "mit"
  ]
}
`;

const sampleCommands: Command[] = [
  {
    name: 'success-command',
    run: async () => 'Success message',
    help: 'Command to test success',
  },
  {
    name: 'error-command',
    run: async () => { throw new Error('Error message'); },
    help: 'Command to test error',
  },
];

describe('scripts/licenseChecker', () => {
  describe('getLicenseInfo', () => {
    it('Loads and parses license information from yarn', sinonTest(async (sinon) => {
      const exec = sinon.stub(dependencies, 'exec');
      exec.resolves({ stdout: JSON.stringify(sampleLicenseData), stderr: '' });

      assert.deepStrictEqual(await getLicenseInfo(), sampleLicenseData.data.body);
    }));

    it('Rejects if yarn errors', sinonTest(async (sinon) => {
      const exec = sinon.stub(dependencies, 'exec');
      exec.rejects(new Error('Yarn error'));

      await assert.rejectsWith(getLicenseInfo(), new Error('Yarn error'));
    }));

    it('Rejects if the license information is malformed', sinonTest(async (sinon) => {
      const exec = sinon.stub(dependencies, 'exec');
      exec.resolves({ stdout: '{"foo":', stderr: '' });

      await assert.rejectsWith(getLicenseInfo(), new SyntaxError('Unexpected end of JSON input'));
    }));
  });

  describe('parseLicenseInfo', () => {
    it('Groups data by module', () => {
      const licenseData = [
        ['lodash', '1.2.3', 'mit'],
        ['bluebird', '2.3.4', 'mit'],
        ['lodash', '4.5.6', 'isc'],
      ];
      const moduleLicenses = parseLicenseInfo(licenseData);
      assert.deepStrictEqual(moduleLicenses, {
        lodash: new Set(['mit', 'isc']),
        bluebird:  new Set(['mit']),
      });
    });

    it('De-duplicates licenses', () => {
      const licenseData = [
        ['lodash', '1.2.3', 'mit'],
        ['bluebird', '2.3.4', 'mit'],
        ['lodash', '4.5.6', 'mit'],
      ];
      const moduleLicenses = parseLicenseInfo(licenseData);

      assert.deepStrictEqual(moduleLicenses, {
        lodash: new Set(['mit']),
        bluebird:  new Set(['mit']),
      });
    });
  });

  describe('loadAcceptableLicenses', () => {
    it('Loads and parses the acceptable license file', sinonTest(async (sinon) => {
      const readFile = sinon.stub(dependencies, 'readFile');
      const acceptableLicenses = {
        lodash: ['mit', 'isc'],
        bluebird: ['mit'],
      };
      readFile.resolves(JSON.stringify(acceptableLicenses));
      const filePath = 'file.json';

      assert.deepStrictEqual(await loadAcceptableLicenses(filePath), {
        lodash: new Set(['mit', 'isc']),
        bluebird: new Set(['mit']),
      });
      assert.calledOnceWith(readFile, [filePath]);
    }));

    it('Rejects if readFile errors', sinonTest(async (sinon) => {
      const readFile = sinon.stub(dependencies, 'readFile');
      readFile.rejects(new Error('File error'));
      const filePath = 'file.json';

      await assert.rejectsWith(loadAcceptableLicenses(filePath), new Error('File error'));
    }));

    it('Rejects if the file is malformed', sinonTest(async (sinon) => {
      const readFile = sinon.stub(dependencies, 'readFile');
      readFile.resolves('{"foo":');
      const filePath = 'file.json';

      await assert.rejectsWith(loadAcceptableLicenses(filePath), new SyntaxError('Unexpected end of JSON input'));
    }));
  });

  describe('findMissingLicenses', () => {
    it('Succeeds if all current licenses are listed in the acceptable list', () => {
      const acceptableLicenses = {
        lodash: new Set(['mit', 'isc']),
        bluebird:  new Set(['mit']),
      };
      const currentLicenses = {
        lodash: new Set(['mit', 'isc']),
        bluebird:  new Set(['mit']),
      };

      const missing = findMissingLicenses(acceptableLicenses, currentLicenses);
      assert.deepStrictEqual(missing, []);
    });

    it('Fails if any current modules are not listed in the acceptable list', () => {
      const acceptableLicenses = {
        bluebird:  new Set(['mit']),
      };
      const currentLicenses = {
        lodash: new Set(['mit', 'isc']),
        bluebird:  new Set(['mit']),
      };

      const missing = findMissingLicenses(acceptableLicenses, currentLicenses);
      assert.deepStrictEqual(missing, ['Module "lodash" is not in acceptable licenses']);
    });

    it('Fails if any current module licenses are not listed in the acceptable list', () => {
      const acceptableLicenses = {
        lodash: new Set(['mit']),
        bluebird:  new Set(['mit']),
      };
      const currentLicenses = {
        lodash: new Set(['mit', 'isc', 'wtf']),
        bluebird:  new Set(['mit']),
      };

      const missing = findMissingLicenses(acceptableLicenses, currentLicenses);
      assert.deepStrictEqual(missing, [
        'Module "lodash" using license "isc" not in acceptable licenses',
        'Module "lodash" using license "wtf" not in acceptable licenses',
      ]);
    });
  });

  describe('checkLicenses', () => {
    it('Resolves if the licenses match the acceptable license file', sinonTest(async (sinon) => {
      const filePath = 'file.json';

      const readFile = sinon.stub(dependencies, 'readFile');
      readFile.resolves(sampleAcceptableLicenseFile);

      const getLicenseInfo = sinon.stub(components, 'getLicenseInfo');
      getLicenseInfo.resolves(sampleLicenseData.data.body);

      await checkLicenses(filePath);
    }));

    it('Rejects if any licenses are missing from the acceptable license file', sinonTest(async (sinon) => {
      const filePath = 'file.json';

      const readFile = sinon.stub(dependencies, 'readFile');
      readFile.resolves(sampleAcceptableLicenseFile);

      const getLicenseInfo = sinon.stub(components, 'getLicenseInfo');
      getLicenseInfo.resolves(sampleBadLicenseData.data.body);

      await assert.rejectsWith(checkLicenses(filePath), missingLicenseError);
    }));
  });

  describe('generateAcceptableLicenses', () => {
    it('Writes an acceptable license file based on the current licenses', sinonTest(async (sinon) => {
      const filePath = 'file.json';

      const readFile = sinon.stub(dependencies, 'readFile');
      readFile.resolves(sampleAcceptableLicenseFile);

      const writeFile = sinon.stub(dependencies, 'writeFile');
      writeFile.resolves();

      const getLicenseInfo = sinon.stub(components, 'getLicenseInfo');
      getLicenseInfo.resolves(sampleLicenseData.data.body);

      await generateAcceptableLicenses(filePath);
      assert.calledOnceWith(writeFile, ['file.json', sampleAcceptableLicenseFile]);
    }));
  });

  describe('getDescription', () => {
    it('Returns a description based on the commands provided', () => {
      const description = getDescription([
        { name: 'foo', help: 'Foo command', run: () => Promise.resolve(undefined) },
        { name: 'bar-zim', help: 'Bar-zim command', run: () => Promise.resolve(undefined) },
      ]);
      assert.endsWith(description, [
        'Commands:',
        '  foo      Foo command',
        '  bar-zim  Bar-zim command',
      ].join('\n'));
    });

    it('Returns a description with no commands', () => {
      const description = getDescription([]);
      assert.endsWith(description, 'Commands:');
    });
  });

  describe('licenseChecker', () => {
    it('Runs a command, resolving its value', async () => {
      const result = await licenseChecker(sampleCommands)(['success-command']);
      assert.strictEqual(result, 'Success message');
    });

    it('Runs a command, rejecting its error', async () => {
      await assert.rejectsWith(licenseChecker(sampleCommands)(['error-command']), new Error('Error message'));
    });

    it('Rejects with an error when given no command', async () => {
      await assert.rejectsWith(
        licenseChecker(sampleCommands)([]),
        /No valid command given/,
      );
    });
  });
});
