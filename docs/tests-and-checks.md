# Tests and checks

## Linting

You can lint all Typescript code with `yarn lint-ts`.

Th main linting rules are in [tslint.json](./tslint.json), and the linting rules for tests are in [tests/tslint.json](./tests/tslint.json).

## Unit tests

You can run the unit tests with `yarn test-unit` or run the unit tests with a coverage report with `yarn test-coverage`.
These tests use [Mocha](https://mochajs.org/) and [node Assert](https://nodejs.org/api/assert.html).

You can run specific tests by using the `--grep/-g` [mocha option](https://mochajs.org/#-grep-regexp-g-regexp) with a regex
targeting the tests you wish to run. For example:

```bash
yarn test-unit --grep api
```

You can run only a specific test suite or case by appending [`.only`](https://mochajs.org/#exclusive-tests) to `describe` or `it`.
For example

```ts
describe.only('Run only this suite', () => {
```

You can skip a specific test suite or case by appending [`.skip`](https://mochajs.org/#inclusive-tests) to `describe` or `it`.
For example

```ts
describe.skip('Skip this suite', () => {
```

### Mocking

When writing unit tests with I/O (e.g. filesystem access or HTTP requests), we use Sinon to mock behaviour.

Specifically we use a helper to wrap test cases like this:

```ts
import sinonTestFactory from '../../../src/utils/sinonTest';
import someScript, { dependencies } from '../../../src/someScript';

const sinonTest = sinonTestFactory();

it('Skip this suite', sinonTest(async (sinon) => {
  const readFile = sinon.stub(dependencies, 'readFile');
  readFile.resolves('File content');

  assert.strictEqual(await someScript(), 'File content');
}));
```

The `sinon` variable is a Sinon sandbox which can be used to mock functions. The sinonTest helper ensures that mocks are removed after the test has finished.

In the above example we mock `dependencies.readFile`, replacing it with a function that returns a promise which resolves with `'File content'`. This means that when `someScript` is called, it uses the mocked version, rather than trying to read a file from the filesystem.

We use two dependency injection objects to make mocking easier, dependencies and components:

```ts
export const dependencies = {
  readFile: promisify(readFile),
};

export const components = {
  convertName: convertName,
};

export function convertName(name: string) {
  return name + '.txt';
}

export default async function someScript(name: string) {
  return dependencies.readFile(components.convertName(name));
}
```

External I/O dependencies are specified as properties in the `dependencies` object, which is exported, allowing tests to mock them easily. This is also a convenient place to promisify any callback based dependencies.

Internal components are specified as properties in the `components` object, which exported for the same reason.

Note that for mocking to work, we must internally refer to these via the `dependencies` and `components` objects.

If you use `withArgs` to specify responses to specific inputs, you should also use an `assert.notOtherwiseCalled` to ensure that the mock isn't called with any other inputs:

```ts
const readFile = sinon.stub(dependencies, 'readFile');
readFile.withArgs('foo.txt').resolves('Foo');
readFile.withArgs('bar.txt').resolves('Bar');
assert.notOtherwiseCalled(readFile, 'readFile');
```

## CLI tests

### Copyright checker

There is a copyright checker you can run with `yarn copyright-check`, this will check that all files have a valid copyright notice. Any gitignored files will be excluded from this check. Additionally, extra files can be ignored in `.copyrightignore`, using the [gitignore rules](https://git-scm.com/docs/gitignore).

### License checker

There is a license checker which you can run with `yarn license-check check-file`, this will check that all the yarn dependencies have been approved. The approved list for front-end exists in the `acceptable-licenses.json` in the root of the repository.

The build will automatically fail if you introduce unapproved dependencies. If this happens, then you can update the license file by running `yarn license-check generate-file`. The `acceptable-licenses.json` file change will need to be approved by a code owner.

## Integration tests

TODO

### Mock API

TODO

Copyright 2019 Diffblue Limited. All Rights Reserved.
