// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import { Readable } from 'stream';

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import spawnProcess, { dependencies } from '../../../src/utils/spawnProcess';

const sinonTest = sinonTestFactory({ useFakeTimers: false });

/** Creates a readable stream with specified data */
function createReadable(data: string) {
  let index = 0;
  return new Readable({
    read: function(size) {
      this.push(data.slice(index, index + size));
      index += size;
      if (index >= data.length) {
        this.push(null);
      }
    },
  });
}

/** Mock ChildProcess object for testing */
class MockChildProcess {
  public events: { [name: string]: (value: number | Error) => void } = {};
  public stdout?: Readable;
  public stderr?: Readable;

  public constructor(succeeds: boolean, stdout?: string, stderr?: string) {
    if (stdout) {
      this.stdout = createReadable(stdout);
    }
    if (stderr) {
      this.stderr = createReadable(stderr);
    }

    setTimeout(() => this.events.close(succeeds ? 0 : 1), 10);
  }

  /** Mock event handler */
  public on(event: string, callback: (value: number | Error) => void) {
    this.events[event] = callback;
  }
}

describe('utils/spawnProcess', () => {
  it('Resolves with stdout if the command succeeds', sinonTest(async (sinon) => {
    const childProcess = new MockChildProcess(true, 'stdout message', 'stderr message');
    // tslint:disable-next-line: no-any
    const spawn = sinon.stub(dependencies, 'spawn').returns(childProcess as any);

    assert.strictEqual(await spawnProcess('command', ['action'], { shell: true }), 'stdout message');
    assert.calledOnceWith(spawn, ['command', ['action'], { shell: true }]);
  }));

  it('Resolves with stdout if the command succeeds without stdio', sinonTest(async (sinon) => {
    const childProcess = new MockChildProcess(true);
    // tslint:disable-next-line: no-any
    const spawn = sinon.stub(dependencies, 'spawn').returns(childProcess as any);

    assert.strictEqual(await spawnProcess('command', ['action'], { shell: true }), '');
    assert.calledOnceWith(spawn, ['command', ['action'], { shell: true }]);
  }));

  it('Resolves with stdout if the command succeeds with default arguments and options', sinonTest(async (sinon) => {
    const childProcess = new MockChildProcess(true, 'stdout message', 'stderr message');
    // tslint:disable-next-line: no-any
    const spawn = sinon.stub(dependencies, 'spawn').returns(childProcess as any);

    assert.strictEqual(await spawnProcess('command'), 'stdout message');
    assert.calledOnceWith(spawn, ['command', [], {}]);
  }));

  it('Rejects with stderr if the command fails', sinonTest(async (sinon) => {
    const childProcess = new MockChildProcess(false, 'stdout message', 'stderr message');
    // tslint:disable-next-line: no-any
    const spawn = sinon.stub(dependencies, 'spawn').returns(childProcess as any);

    await assert.rejectsWith(spawnProcess('command', ['action']), new Error('stderr message'));
    assert.calledOnceWith(spawn, ['command', ['action'], {}]);
  }));
});

