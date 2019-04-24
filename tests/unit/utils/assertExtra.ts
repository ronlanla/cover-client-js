// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import * as assert from 'assert';
import * as sinon from 'sinon';

import assertExtra from '../../../src/utils/assertExtra';

// Regex which supports multiple versions of Node assert (6+)
const assertionRegex = /^AssertionError( \[ERR_ASSERTION\])?: /;

/** Higher order callback function for assert.throws which checks an error message */
function checkAssertionError(message: string) {
  return (error: Error | string) => {
    const errorMessage = String(error);
    assert(errorMessage.match(assertionRegex), `"${errorMessage}" does not start with "AssertionError"`);
    assert.strictEqual(errorMessage.replace(assertionRegex, ''), message);
    return true;
  };
}

// "Quis custodiet ipsos custodes"
describe('assertExtra', () => {
  describe('notCalled', () => {
    it('Throws an exception when a spy has been called', () => {
      const spy = sinon.spy();
      spy();
      assert.throws(() => assertExtra.notCalled(spy), checkAssertionError('Called 1 times'));
    });

    it('Does not throw an exception when a spy has not been called', () => {
      const spy = sinon.spy();
      assertExtra.notCalled(spy);
    });
  });

  describe('calledOnce', () => {
    it('Throws an exception when a spy has not been called', () => {
      const spy = sinon.spy();
      assert.throws(() => assertExtra.calledOnce(spy), checkAssertionError('Called 0 times'));
    });

    it('Throws an exception when a spy has been called more than once', () => {
      const spy = sinon.spy();
      spy();
      spy();
      assert.throws(() => assertExtra.calledOnce(spy), checkAssertionError('Called 2 times'));
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
      assert.throws(() => assertExtra.calledOnceWith(spy, []), checkAssertionError('Called 0 times'));
    });

    it('Throws an exception when a spy has been called more than once', () => {
      const spy = sinon.spy();
      spy();
      spy();
      assert.throws(() => assertExtra.calledOnceWith(spy, []), checkAssertionError('Called 2 times'));
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

      const expectedError = "[ [ 'foo' ], [ 'bar' ] ] deepStrictEqual [ [ 'foo' ] ]";
      assert.throws(() => assertExtra.calledWith(spy, [['foo']]), checkAssertionError(expectedError));
    });

    it('Throws an exception when a spy has been called less times than expected', () => {
      const spy = sinon.spy();
      spy('foo');

      const expectedError = "[ [ 'foo' ] ] deepStrictEqual [ [ 'foo' ], [ 'bar' ] ]";
      assert.throws(() => assertExtra.calledWith(spy, [['foo'], ['bar']]), checkAssertionError(expectedError));
    });

    it('Throws an exception when a spy has been called the expected number of times with the wrong arguments', () => {
      const spy = sinon.spy();
      spy('foo');
      spy('bar', 'zim');

      const expectedError = "[ [ 'foo' ], [ 'bar', 'zim' ] ] deepStrictEqual [ [ 'foo' ], [ 'bar' ] ]";
      assert.throws(() => assertExtra.calledWith(spy, [['foo'], ['bar']]), checkAssertionError(expectedError));
    });

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

      const expectedError = "[ [ 'foo' ], [ 'bar' ] ] deepStrictEqual [ [ 'foo' ] ]";
      assert.throws(() => assertExtra.calledStartingWith(spy, [['foo']]), checkAssertionError(expectedError));
    });

    it('Throws an exception when a spy has been called less times than expected', () => {
      const spy = sinon.spy();
      spy('foo');

      const expectedError = "[ [ 'foo' ] ] deepStrictEqual [ [ 'foo' ], [ 'bar' ] ]";
      assert.throws(() => assertExtra.calledStartingWith(spy, [['foo'], ['bar']]), checkAssertionError(expectedError));
    });

    it('Throws an exception when a spy has been called the expected number of times with the wrong arguments', () => {
      const spy = sinon.spy();
      spy('foo');
      spy('bar', 'zim');

      const expectedError = "[ [ 'foo' ], [ 'bar' ] ] deepStrictEqual [ [ 'foo' ], [ 'zim' ] ]";
      assert.throws(() => assertExtra.calledStartingWith(spy, [['foo'], ['zim']]), checkAssertionError(expectedError));
    });

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

      const expectedError = 'Called 2 times';
      assert.throws(() => assertExtra.calledOnceStartingWith(spy, ['foo']), checkAssertionError(expectedError));
    });

    it('Throws an exception when a spy has been called less times than expected', () => {
      const spy = sinon.spy();

      const expectedError = 'Called 0 times';
      assert.throws(() => assertExtra.calledOnceStartingWith(spy, ['foo']), checkAssertionError(expectedError));
    });

    it('Throws an exception when a spy has been called the expected number of times with the wrong arguments', () => {
      const spy = sinon.spy();
      spy('bar', 'zim');

      const expectedError = "[ 'bar' ] deepStrictEqual [ 'zim' ]";
      assert.throws(() => assertExtra.calledOnceStartingWith(spy, ['zim']), checkAssertionError(expectedError));
    });

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
      }
      catch (e) {
        rejected = true;
      }
      assert.strictEqual(rejected, true, 'Promise did not reject');
    });

    it('Rejects when the passed promise rejects with the wrong error message regex', async () => {
      let rejected = false;
      try {
        await assertExtra.rejectsWith(Promise.reject('Error message'), /Wrong error message/);
      }
      catch (e) {
        rejected = true;
      }
      assert.strictEqual(rejected, true, 'Promise did not reject');
    });

    it('Rejects when the passed promise resolves', async () => {
      let rejected = false;
      try {
        await assertExtra.rejectsWith(Promise.resolve(), 'Error message');
      }
      catch (e) {
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

      assert.throws(
        () => {
          assertExtra.notOtherwiseCalled(stub, 'stub');
          stub('foo');
          stub('bar', 'zim');
          stub('gir', 'zig', 'pew');
        },
        checkAssertionError('Unexpected call to stub with args ["gir","zig","pew"]'),
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
      assert.throws(
        () => assertExtra.matches('Foo AB', /Foo \d\d/),
        checkAssertionError('Pattern "/Foo \\d\\d/" did not match "Foo AB"'),
      );
    });

    it('Does not throw an exception when a string matches a regex', () => {
      assertExtra.matches('Foo 12', /Foo \d\d/);
    });
  });
});

