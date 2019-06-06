// Copyright 2019 Diffblue Limited. All Rights Reserved.

import assert from '../../../src/utils/assertExtra';
import multiline from '../../../src/utils/multiline';
import sinonTestFactory from '../../../src/utils/sinonTest';

import commandLineRunner, {
  components,
  dependencies,
  ExpectedError,
  getCommandName,
  getHelpMessage,
  indent,
} from '../../../src/utils/commandLineRunner';

const sinonTest = sinonTestFactory();

describe('utils/commandLineRunner', () => {
  describe('indent', () => {
    it('Returns text with each line indented', () => {
      assert.strictEqual(indent('foo\nbar\nzim', '  '), '  foo\n  bar\n  zim');
    });
  });

  describe('getCommandName', () => {
    it('Returns the command name if called normally', () => {
      assert.strictEqual(getCommandName({ argv: ['ts-node', 'someCommand.ts'], env: {}}), 'ts-node someCommand.ts');
    });

    it('Returns the command name if called through yarn', () => {
      const commandName = getCommandName({ argv: ['ts-node', 'someCommand.ts'], env: {
        npm_config_user_agent: 'yarn/1.15.2 npm/? node/v8.12.0 darwin x64',
        npm_lifecycle_event: 'some-command',
      }});

      assert.strictEqual(commandName, 'yarn some-command');
    });

    it('Returns the command name if called through NPM', () => {
      const commandName = getCommandName({ argv: ['ts-node', 'someCommand.ts'], env: {
        npm_config_user_agent: 'npm/6.4.1 node/v8.12.0 darwin x64',
        npm_lifecycle_event: 'some-command',
      }});

      assert.strictEqual(commandName, 'npm run some-command');
    });
  });

  describe('getHelpMessage', () => {
    it('Returns a help message.', () => {
      const expectedMessage = multiline`
        Description:
          Foo
          Bar

        Usage:
          yarn some-command <zim> [--help]

      `;

      assert.strictEqual(getHelpMessage('Foo\nBar', '<zim>', 'yarn some-command'), expectedMessage);
    });
  });

  describe('commandLineRunner', () => {
    it('Resolves when command resolves with no message', sinonTest(async (sinon) => {
      const processExit = sinon.stub(dependencies, 'processExit');
      const log = sinon.stub(dependencies.logger, 'log');
      const error = sinon.stub(dependencies.logger, 'error');

      const action = sinon.stub().resolves();
      await commandLineRunner('Foo', '<bar>', { argv: ['yarn', 'some-command'], env: {}}, action);

      assert.calledOnceWith(action, [[], {}]);
      assert.notCalled(log);
      assert.notCalled(error);
      assert.notCalled(processExit);
    }));

    it('Resolves when command resolves with a message', sinonTest(async (sinon) => {
      const processExit = sinon.stub(dependencies, 'processExit');
      const log = sinon.stub(dependencies.logger, 'log');
      const error = sinon.stub(dependencies.logger, 'error');

      const action = sinon.stub().resolves('Message');
      await commandLineRunner('Foo', '<bar>', { argv: ['yarn', 'some-command'], env: {}}, action);

      assert.calledOnceWith(action, [[], {}]);
      assert.calledOnceWith(log, ['Message']);
      assert.notCalled(error);
      assert.notCalled(processExit);
    }));

    it('Exits with error message when command rejects', sinonTest(async (sinon) => {
      const processExit = sinon.stub(dependencies, 'processExit');
      const log = sinon.stub(dependencies.logger, 'log');
      const error = sinon.stub(dependencies.logger, 'error');
      sinon.stub(components, 'getHelpMessage').returns('Help message');

      const action = sinon.stub().rejects(new Error('Error message'));
      await commandLineRunner('Foo', '<bar>', { argv: ['yarn', 'some-command'], env: {}}, action);

      assert.calledOnceWith(action, [[], {}]);
      assert.notCalled(log);
      assert.calledWith<string | Error>(error, [
        ['Help message'],
        [new Error('Error message')],
        [''],
      ]);
      assert.calledOnceWith(processExit, [1]);
    }));

    it('Exits with "expected" error message when command rejects', sinonTest(async (sinon) => {
      const processExit = sinon.stub(dependencies, 'processExit');
      const log = sinon.stub(dependencies.logger, 'log');
      const error = sinon.stub(dependencies.logger, 'error');
      sinon.stub(components, 'getHelpMessage').returns('Help message');

      const action = sinon.stub().rejects(new ExpectedError('Error message'));
      await commandLineRunner('Foo', '<bar>', { argv: ['yarn', 'some-command'], env: {}}, action);

      assert.calledOnceWith(action, [[], {}]);
      assert.notCalled(log);
      assert.calledWith<string | Error>(error, [
        ['Help message'],
        ['Error: Error message'],
        [''],
      ]);
      assert.calledOnceWith(processExit, [1]);
    }));

    it('Resolves when the help option is given', sinonTest(async (sinon) => {
      const processExit = sinon.stub(dependencies, 'processExit');
      const log = sinon.stub(dependencies.logger, 'log');
      const error = sinon.stub(dependencies.logger, 'error');
      sinon.stub(components, 'getHelpMessage').returns('Help message');

      const action = sinon.stub().rejects(new Error('x'));
      await commandLineRunner('Foo', '<bar>', { argv: ['yarn', 'some-command', '--help'], env: {}}, action);

      assert.notCalled(action);
      assert.calledOnceWith<string | Error>(log, ['Help message']);
      assert.notCalled(error);
      assert.notCalled(processExit);
    }));
  });
});
