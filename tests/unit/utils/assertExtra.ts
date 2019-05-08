// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import * as assert from 'assert';
import * as sinon from 'sinon';

import assertExtra, { errorEquals, getError } from '../../../src/utils/assertExtra';

// "Quis custodiet ipsos custodes"
describe('utils/assertExtra', () => {
  describe('getError', () => {
    it('Returns the error thrown by the callback', () => {
      assert.deepStrictEqual(getError(() => { throw new Error('Some error'); }), new Error('Some error'));
    });

    it('Throws an error if the callback did not throw an error', () => {
      assert.throws(() => getError(() => undefined), errorEquals(new Error('Expected callback to throw an error')));
    });
  });

  describe('notCalled', () => {
    it('Throws an exception when a spy has been called', () => {
      const spy = sinon.spy();
      spy();

      const expectedError = getError(() => assert.strictEqual(1, 0, 'Called 1 times'));

      assert.throws(
        () => assertExtra.notCalled(spy),
        errorEquals(expectedError),
      );
    });

    it('Does not throw an exception when a spy has not been called', () => {
      const spy = sinon.spy();
      assertExtra.notCalled(spy);
    });
  });

  describe('calledOnce', () => {
    it('Throws an exception when a spy has not been called', () => {
      const spy = sinon.spy();

      const expectedError = getError(() => assert.strictEqual(0, 1, 'Called 0 times'));

      assert.throws(() => assertExtra.calledOnce(spy), errorEquals(expectedError));
    });

    it('Throws an exception when a spy has been called more than once', () => {
      const spy = sinon.spy();
      spy();
      spy();

      const expectedError = getError(() => assert.strictEqual(2, 1, 'Called 2 times'));

      assert.throws(() => assertExtra.calledOnce(spy), errorEquals(expectedError));
    });

    it('Does not throw an exception when a spy has been called once', () => {
      const spy = sinon.spy();
      spy();
      assertExtra.calledOnce(spy);
    });
  });

  describe('calledOnceWith', () => {
    it('Throws an exception when a spy has not been called', () => {
      const spy = sinon.spy();

      const expectedError = getError(() => assert.strictEqual(0, 1, 'Called 0 times'));

      assert.throws(() => assertExtra.calledOnceWith(spy, []), errorEquals(expectedError));
    });

    it('Throws an exception when a spy has been called more than once', () => {
      const spy = sinon.spy();
      spy();
      spy();

      const expectedError = getError(() => assert.strictEqual(2, 1, 'Called 2 times'));

      assert.throws(() => assertExtra.calledOnceWith(spy, []), errorEquals(expectedError));
    });

    it('Does not throw an exception when a spy has been called once with the correct arguments (empty)', () => {
      const spy = sinon.spy();
      spy();
      assertExtra.calledOnceWith(spy, []);
    });

    it('Does not throw an exception when a spy has been called once with the correct arguments (non-empty)', () => {
      const spy = sinon.spy();
      spy('foo', 'bar', 'zim');
      assertExtra.calledOnceWith(spy, ['foo', 'bar', 'zim']);
    });
  });

  describe('calledWith', () => {
    it('Throws an exception when a spy has been called more times than expected', () => {
      const spy = sinon.spy();
      spy('foo');
      spy('bar');

      const expectedCalls = [['foo']];
      const actualCalls = [['foo'], ['bar']];
      const expectedError = getError(() => assert.deepStrictEqual(actualCalls, expectedCalls));

      assert.throws(() => assertExtra.calledWith(spy, expectedCalls), errorEquals(expectedError));
    });

    it('Throws an exception when a spy has been called less times than expected', () => {
      const spy = sinon.spy();
      spy('foo');

      const expectedCalls = [['foo'], ['bar']];
      const actualCalls = [['foo']];
      const expectedError = getError(() => assert.deepStrictEqual(actualCalls, expectedCalls));

      assert.throws(() => assertExtra.calledWith(spy, expectedCalls), errorEquals(expectedError));
    });

    it(
      'Throws an exception when a spy has been called the expected number of times with the wrong arguments',
      () => {
        const spy = sinon.spy();
        spy('foo');
        spy('bar', 'zim');

        const expectedCalls = [['foo'], ['bar']];
        const actualCalls = [['foo'], ['bar', 'zim']];
        const expectedError = getError(() => assert.deepStrictEqual(actualCalls, expectedCalls));

        assert.throws(() => assertExtra.calledWith(spy, expectedCalls), errorEquals(expectedError));
      },
    );

    it(
      'Does not throw an exception when a spy has been called the expected number of times with the correct arguments',
      () => {
        const spy = sinon.spy();
        spy('foo');
        spy('bar', 'zim');

        assertExtra.calledWith(spy, [['foo'], ['bar', 'zim']]);
      },
    );
  });

  describe('calledStartingWith', () => {
    it('Throws an exception when a spy has been called more times than expected', () => {
      const spy = sinon.spy();
      spy('foo');
      spy('bar');

      const expectedCalls = [['foo']];
      const actualCalls = [['foo'], ['bar']];
      const expectedError = getError(() => assert.deepStrictEqual(actualCalls, expectedCalls));

      assert.throws(() => assertExtra.calledStartingWith(spy, expectedCalls), errorEquals(expectedError));
    });

    it('Throws an exception when a spy has been called less times than expected', () => {
      const spy = sinon.spy();
      spy('foo');

      const expectedCalls = [['foo'], ['bar']];
      const actualCalls = [['foo']];
      const expectedError = getError(() => assert.deepStrictEqual(actualCalls, expectedCalls));

      assert.throws(() => assertExtra.calledStartingWith(spy, expectedCalls), errorEquals(expectedError));
    });

    it(
      'Throws an exception when a spy has been called the expected number of times with the wrong arguments',
      () => {
        const spy = sinon.spy();
        spy('foo');
        spy('bar', 'zim');

        const expectedCalls = [['foo'], ['zim']];
        const actualCalls = [['foo'], ['bar']];
        const expectedError = getError(() => assert.deepStrictEqual(actualCalls, expectedCalls));

        assert.throws(() => assertExtra.calledStartingWith(spy, expectedCalls), errorEquals(expectedError));
      },
    );

    it(
      'Does not throw an exception when a spy has been called the expected number of times with the correct arguments',
      () => {
        const spy = sinon.spy();
        spy('foo');
        spy('bar', 'zim');

        assertExtra.calledStartingWith(spy, [['foo'], ['bar', 'zim']]);
      },
    );

    it(
      'Does not throw an exception when a spy has been called the expected number of times, ' +
      'each time starting with the correct arguments',
      () => {
        const spy = sinon.spy();
        spy('foo');
        spy('bar', 'zim');
        spy('gir', 'zig', 'pew');

        assertExtra.calledStartingWith(spy, [['foo'], ['bar'], ['gir', 'zig']]);
      },
    );
  });

  describe('calledOnceStartingWith', () => {
    it('Throws an exception when a spy has been called more times than expected', () => {
      const spy = sinon.spy();
      spy('foo');
      spy('bar');

      const expectedError = getError(() => assert.strictEqual(2, 1, 'Called 2 times'));

      assert.throws(() => assertExtra.calledOnceStartingWith(spy, ['foo']), errorEquals(expectedError));
    });

    it('Throws an exception when a spy has been called less times than expected', () => {
      const spy = sinon.spy();

      const expectedError = getError(() => assert.strictEqual(0, 1, 'Called 0 times'));

      assert.throws(() => assertExtra.calledOnceStartingWith(spy, ['foo']), errorEquals(expectedError));
    });

    it(
      'Throws an exception when a spy has been called the expected number of times with the wrong arguments',
      () => {
        const spy = sinon.spy();
        spy('bar', 'zim');

        const expectedCalls = ['zim'];
        const actualCalls = ['bar'];
        const expectedError = getError(() => assert.deepStrictEqual(actualCalls, expectedCalls));

        assert.throws(() => assertExtra.calledOnceStartingWith(spy, expectedCalls), errorEquals(expectedError));
      },
    );

    it(
      'Does not throw an exception when a spy has been called the expected number of times with the correct arguments',
      () => {
        const spy = sinon.spy();
        spy('bar', 'zim');

        assertExtra.calledOnceStartingWith(spy, ['bar', 'zim']);
      },
    );

    it(
      'Does not throw an exception when a spy has been called the expected number of times, ' +
      'each time starting with the correct arguments',
      () => {
        const spy = sinon.spy();
        spy('gir', 'zig', 'pew');

        assertExtra.calledOnceStartingWith(spy, ['gir', 'zig']);
      },
    );
  });

  describe('rejectsWith', () => {
    it('Resolves when the passed promise rejects with the correct error message', async () => {
      return assertExtra.rejectsWith(Promise.reject('Error message'), 'Error message');
    });

    it('Resolves when the passed promise rejects with the correct error message regex', async () => {
      return assertExtra.rejectsWith(Promise.reject('Error message 12'), /Error message \d\d/);
    });

    it('Rejects when the passed promise rejects with the wrong error message', async () => {
      let rejected = false;
      try {
        await assertExtra.rejectsWith(Promise.reject('Error message'), 'Wrong error message');
      } catch (e) {
        rejected = true;
      }
      assert.strictEqual(rejected, true, 'Promise did not reject');
    });

    it('Rejects when the passed promise rejects with the wrong error message regex', async () => {
      let rejected = false;
      try {
        await assertExtra.rejectsWith(Promise.reject('Error message'), /Wrong error message/);
      } catch (e) {
        rejected = true;
      }
      assert.strictEqual(rejected, true, 'Promise did not reject');
    });

    it('Rejects when the passed promise resolves', async () => {
      let rejected = false;
      try {
        await assertExtra.rejectsWith(Promise.resolve(), 'Error message');
      } catch (e) {
        rejected = true;
      }
      assert.strictEqual(rejected, true, 'Promise did not reject');
    });
  });

  describe('notOtherwiseCalled', () => {
    it('Throws an exception when a stub was called with unexpected args', () => {
      const stub = sinon.stub();
      stub.withArgs('foo').returns(true);
      stub.withArgs('bar', 'zim').returns(true);

      const expectedError = new assert.AssertionError({
        message: 'Unexpected call to stub with args ["gir","zig","pew"]',
      });

      assert.throws(
        () => {
          assertExtra.notOtherwiseCalled(stub, 'stub');
          stub('foo');
          stub('bar', 'zim');
          stub('gir', 'zig', 'pew');
        },
        errorEquals(expectedError),
      );
    });

    it('Does not throw an exception when a stub was only called with unexpected args', () => {
      const stub = sinon.stub();
      stub.withArgs('foo').returns(true);
      stub.withArgs('bar', 'zim').returns(true);
      stub.withArgs('gir', 'zig', 'pew').returns(true);

      assertExtra.notOtherwiseCalled(stub, 'stub');

      stub('foo');
      stub('bar', 'zim');
      stub('gir', 'zig', 'pew');
    });
  });

  describe('matches', () => {
    it('Throws an exception when a string does not match a regex', () => {
      assert.throws(() => assertExtra.matches('Foo AB', /Foo \d\d/), errorEquals(getError(() => {
        assert.strictEqual(false, true, '"Foo AB" did not match pattern "/Foo \\d\\d/"');
      })));
    });

    it('Does not throw an exception when a string matches a regex', () => {
      assertExtra.matches('Foo 12', /Foo \d\d/);
    });
  });

  describe('startsWith', () => {
    it('Throws an exception when a string does not start with a value', () => {
      assert.throws(() => assertExtra.startsWith('abc123', 'abcd'), errorEquals(getError(() => {
        assert.strictEqual(false, true, '"abc123" does not start with "abcd"');
      })));
    });

    it('Does not throw an exception when a string starts with a value', () => {
      assertExtra.startsWith('abc123', 'abc');
    });
  });

  describe('endsWith', () => {
    it('Throws an exception when a string does not end with a value', () => {
      assert.throws(() => assertExtra.endsWith('abc123', '1234'), errorEquals(getError(() => {
        assert.strictEqual(false, true, '"abc123" does not end with "1234"');
      })));
    });

    it('Does not throw an exception when a string ends with a value', () => {
      assertExtra.endsWith('abc123', '123');
    });
  });

  describe('changedProperties', () => {
    it('Throws an exception when an object has changed properties not listed in the expectedChanges', () => {
      const originalObject = { a: 1 };
      const changedObject = { a: 2 };
      const expectedChanges = {};
      const expectedError = getError(() => {
        assert.deepStrictEqual(originalObject, changedObject);
      });

      assert.throws(
        () => assertExtra.changedProperties(originalObject, changedObject, expectedChanges),
        errorEquals(expectedError),
      );
    });

    it('Throws an exception when an object does not have a changed property listed in the expectedChanges', () => {
      const originalObject: any = { a: 1 }; // tslint:disable-line:no-any
      const changedObject = { a: 1 };
      const expectedChanges = { b: 2 };
      const expectedError = getError(() => {
        originalObject.b = 2;
        assert.deepStrictEqual(originalObject, changedObject);
      });

      assert.throws(
        () => assertExtra.changedProperties(originalObject, changedObject, expectedChanges),
        errorEquals(expectedError),
      );
    });

    it('Throws an exception when a changed property listed in the expectedChanges has the wrong value', () => {
      const originalObject = { a: 1 };
      const changedObject = { a: 2 };
      const expectedChanges = { a: 3 };
      const expectedError = getError(() => {
        assert.deepStrictEqual({ ...originalObject, ...expectedChanges }, changedObject);
      });

      assert.throws(
        () => assertExtra.changedProperties(originalObject, changedObject, expectedChanges),
        errorEquals(expectedError),
      );
    });

    it('Does not throw when the expectedChanges match the actual changes', () => {
      const originalObject = { a: 1 };
      const changedObject = { a: 2 };
      const expectedChanges = { a: 2 };
      assertExtra.changedProperties(originalObject, changedObject, expectedChanges);
    });
  });
});

