### Unit tests

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