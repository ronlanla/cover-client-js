// Copyright 2019 Diffblue Limited. All Rights Reserved.

import {
  dependencies,
  generateTestClass,
  getFileNameForResult,
  GroupedResults,
  groupResults,
  mergeIntoTestClass,
} from '../../src/combiner';
import { CombinerError, CombinerErrorCode } from '../../src/errors';
import assert from '../../src/utils/assertExtra';
import sinonTestFactory from '../../src/utils/sinonTest';

const sinonTest = sinonTestFactory();

const sampleResult = {
  testId: 'id',
  testName: 'name',
  testedFunction: 'com.diffblue.javademo.TicTacToe.checkTicTacToePosition',
  sourceFilePath: './path',
  testBody: 'body',
  imports: ['import'],
  staticImports: ['static import'],
  classAnnotations: ['class annotation'],
  tags: ['tag'],
  phaseGenerated: 'phase',
  createdTime: 'created',
  coveredLines: ['com.diffblue.javademo.TicTacToe.checkTicTacToePosition:1-2,4-5'],
};

const sampleTestData = {
  classAnnotations: sampleResult.classAnnotations,
  imports: sampleResult.imports,
  staticImports: sampleResult.staticImports,
  name: sampleResult.testName,
  body: sampleResult.testBody,
  id: sampleResult.testId,
  sourceFilePath: sampleResult.sourceFilePath,
  coveredLines: sampleResult.coveredLines,
};

describe('combiner', () => {
  describe('generateTestClass', () => {
    it('Can generate a test class for a single result', sinonTest(async (sinon) => {
      const expectedTestClass = 'test-class';
      const genTestClass = sinon.stub(dependencies, 'genTestClass');
      genTestClass.returns(expectedTestClass);
      const testClass = generateTestClass([sampleResult]);
      assert.calledOnceWith(genTestClass, [[sampleTestData], 'TicTacToe', 'TicTacToeTest', 'com.diffblue.javademo']);
      assert.strictEqual(testClass, expectedTestClass);
    }));

    it('Can generate a test class for multiple results', sinonTest(async (sinon) => {
      const expectedTestClass = 'test-class';
      const genTestClass = sinon.stub(dependencies, 'genTestClass');
      genTestClass.returns(expectedTestClass);
      const testClass = generateTestClass([sampleResult, sampleResult]);
      assert.calledOnceWith(
        genTestClass,
        [[sampleTestData, sampleTestData], 'TicTacToe', 'TicTacToeTest', 'com.diffblue.javademo'],
      );
      assert.strictEqual(testClass, expectedTestClass);
    }));

    it('Fails if passed results with differing source file paths', () => {
      const otherResult = { ...sampleResult, sourceFilePath: '/other/path' };
      assert.throws(
        () => generateTestClass([sampleResult, otherResult]),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.SOURCE_FILE_PATH_DIFFERS;
        },
      );
    });

    it('Fails if passed results with tested functions that produce different class names', () => {
      const otherResult = {
        ...sampleResult,
        testedFunction: 'com.diffblue.javademo.SomeOtherClass.checkTicTacToePosition',
      };
      assert.throws(
        () => generateTestClass([sampleResult, otherResult]),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.CLASS_NAME_DIFFERS;
        },
      );
    });

    it('Fails if passed results with tested functions that produce different package names', () => {
      const otherResult = {
        ...sampleResult,
        testedFunction: 'com.diffblue.someotherpackage.TicTacToe.checkTicTacToePosition',
      };
      assert.throws(
        () => generateTestClass([sampleResult, otherResult]),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.PACKAGE_NAME_DIFFERS;
        },
      );
    });

    it('Fails if passed a tested function with no extractable classname', () => {
      const badResult = {
        ...sampleResult,
        testedFunction: 'not-a-valid-function-name',
      };
      assert.throws(
        () => generateTestClass([badResult]),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.NO_CLASS_NAME;
        },
      );
    });

    it('Fails if no results passed', () => {
      assert.throws(
        () => generateTestClass(undefined as any),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.RESULTS_MISSING;
        },
      );
    });

    it('Fails if non array results passed', () => {
      assert.throws(
        () => generateTestClass(new Set([sampleResult]) as any),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.RESULTS_TYPE;
        },
      );
    });

    it('Fails if empty results passed', () => {
      assert.throws(
        () => generateTestClass([] as any),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.RESULTS_EMPTY;
        },
      );
    });

    it('Fails if java-combiner genTestClass fails', sinonTest(async (sinon) => {
      const genTestClass = sinon.stub(dependencies, 'genTestClass');
      genTestClass.throws(new Error('genTestClass failed'));
      assert.throws(
        () => generateTestClass([sampleResult]),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.GENERATE_ERROR;
        },
      );
    }));
  });

  describe('mergeIntoTestClass', () => {
    it('Can merge results into an existing test class', sinonTest(async (sinon) => {
      const existingTestClass = 'test-class';
      const expectedTestClass = 'merged-test-class';
      const mergeTests = sinon.stub(dependencies, 'mergeTests');
      mergeTests.resolves(expectedTestClass);
      const testClass = await mergeIntoTestClass(existingTestClass, [sampleResult]);
      assert.strictEqual(testClass, expectedTestClass);
      assert.calledOnceWith(mergeTests, [existingTestClass, [sampleTestData]]);
    }));

    it('Fails for an empty existing test class', async () => {
      await assert.rejects(
        async () => mergeIntoTestClass('', [sampleResult]),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.EXISTING_CLASS_MISSING;
        },
      );
    });

    it('Fails for an existing test class of the wrong type', async () => {
      await assert.rejects(
        async () => mergeIntoTestClass(Buffer.alloc(0) as any, [sampleResult]),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.EXISTING_CLASS_TYPE;
        },
      );
    });

    it('Fails if java-combiner mergeTests fails', sinonTest(async (sinon) => {
      const existingTestClass = 'test-class';
      const mergeTests = sinon.stub(dependencies, 'genTestClass');
      mergeTests.throws(new Error('mergeTests failed'));
      await assert.rejects(
        async () => mergeIntoTestClass(existingTestClass, [sampleResult]),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.MERGE_ERROR;
        },
      );
    }));

    it('Fails if no results passed', async () => {
      const existingTestClass = 'test-class';
      await assert.rejects(
        async () => mergeIntoTestClass(existingTestClass, undefined as any),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.RESULTS_MISSING;
        },
      );
    });

    it('Fails if non array results passed', async () => {
      const existingTestClass = 'test-class';
      await assert.rejects(
        async () => mergeIntoTestClass(
          existingTestClass,
          new Set([sampleResult]) as any,
        ),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.RESULTS_TYPE;
        },
      );
    });

    it('Fails if empty results passed', async () => {
      const existingTestClass = 'test-class';
      await assert.rejects(
        async () => mergeIntoTestClass(existingTestClass, [] as any),
        (err: Error) => {
          return (err instanceof CombinerError) && err.code === CombinerErrorCode.RESULTS_EMPTY;
        },
      );
    });
  });

  describe('generateTestClass', () => {
    it('Groups results by testedFunction', () => {
      const otherResult = { ...sampleResult, sourceFilePath: 'other/path' };
      const groupedResults = groupResults([sampleResult, otherResult]);
      const expected: GroupedResults = {
        [sampleResult.sourceFilePath]: [sampleResult],
        [otherResult.sourceFilePath]: [otherResult],
      };
      assert.deepStrictEqual(groupedResults, expected);
    });
  });

  describe('getFileNameForResult', () => {
    it('Returns a file name for a provided result object', () => {
      const fileName = getFileNameForResult(sampleResult);
      assert.deepStrictEqual(fileName, 'TicTacToeTest.java');
    });
  });
});
