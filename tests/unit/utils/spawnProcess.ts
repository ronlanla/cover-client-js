// Copyright 2017-2019 Diffblue Limited. All Rights Reserved.

import { Readable } from 'stream';

import assert from '../../../src/utils/assertExtra';
import sinonTestFactory from '../../../src/utils/sinonTest';

import spawnProcess, { dependencies } from '../../../src/utils/spawnProcess';

const sinonTest = sinonTestFactory();

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
  public events: { [name: string]: (error?: Error) => void } = {};
  public stdout: Readable;
  public stderr: Readable;

  public constructor(stdout: string, stderr: string, succeeds: boolean) {
    this.stdout = createReadable(stdout);
    this.stderr = createReadable(stderr);
    if (succeeds) {
      this.stdout.on('end', () => this.events.close());
    } else {
      this.stdout.on('end', () => this.events.error(new Error('Command failed')));
    }
  }

  /** Mock event handler */
  public on(event: string, callback: () => void) {
    this.events[event] = callback;
  }
}

describe('spawnProcess', () => {
  it('Resolves with stdout if the command succeeds', sinonTest(async (sinon) => {
    const childProcess = new MockChildProcess('stdout message', 'stderr message', true);
    // tslint:disable-next-line: no-any
    const spawn = sinon.stub(dependencies, 'spawn').returns(childProcess as any);

    assert.strictEqual(await spawnProcess('command', ['action'], { shell: true }), 'stdout message');
    assert.calledOnceWith(spawn, ['command', ['action'], { shell: true }]);
  }));

  it('Resolves with stdout if the command succeeds with default arguments and options', sinonTest(async (sinon) => {
    const childProcess = new MockChildProcess('stdout message', 'stderr message', true);
    // tslint:disable-next-line: no-any
    const spawn = sinon.stub(dependencies, 'spawn').returns(childProcess as any);

    assert.strictEqual(await spawnProcess('command'), 'stdout message');
    assert.calledOnceWith(spawn, ['command', [], {}]);
  }));

  it('Rejects with if the command fails', sinonTest(async (sinon) => {
    const childProcess = new MockChildProcess('stdout message', 'stderr message', false);
    // tslint:disable-next-line: no-any
    const spawn = sinon.stub(dependencies, 'spawn').returns(childProcess as any);

    await assert.rejectsWith(spawnProcess('command', ['action']), new Error('Command failed'));
    assert.calledOnceWith(spawn, ['command', ['action'], {}]);
  }));
});

