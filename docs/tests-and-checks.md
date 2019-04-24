# Tests and checks

## Linting

You can lint all Typescript code with `yarn lint-ts`. The linting rules are in [tslint.json](./tslint.json)

## Unit tests

You can run the unit tests with `yarn test` or run the unit tests with a coverage report with `yarn coverage`.
These tests use [Mocha](https://mochajs.org/) and [node Assert](https://nodejs.org/api/assert.html).

You can run specific tests by using the `--grep/-g` [mocha option](https://mochajs.org/#-grep-regexp-g-regexp) with a regex
targeting the tests you wish to run. For example:
```bash
$ yarn test --grep api
```

You can run only a specific test suite or case by appending [`.only`](https://mochajs.org/#exclusive-tests) to `describe` or `it`.
For example
```js
describe.only('Run only this suite', function() {
```

You can skip a specific test suite or case by appending [`.skip`](https://mochajs.org/#inclusive-tests) to `describe` or `it`.
For example
```js
describe.skip('Skip this suite', function() {
```

## CLI tests

### Copyright checker

There is a copyright checker you can run with `yarn copyright-check`, this will check that all files have a valid copyright notice. Any gitignored files will be excluded from this check. Additionally, extra files can be ignored in `.copyrightignore`, using the [gitignore rules](https://git-scm.com/docs/gitignore).

### License checker

There is a license checker which you can run with `yarn license-check check-file`, this will check that all the yarn dependancies have been approved. The approved list for front-end exists in the `acceptable-licenses.json` in the root of the repository.

The build will automatically fail if you introduce unapproved dependencies. If this happens, then you can update the license file by running `yarn license-check generate-file`. The `acceptable-licenses.json` file change will need to be approved by a code owner.

## Integration tests

### Mock API

Copyright 2019 Diffblue Limited. All Rights Reserved.
