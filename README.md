# Diffblue Cover client library - Node.js API for Diffblue Cover

The Diffblue Cover client library provides a programmatic interface and CLI for communicating with the Diffblue Cover API.

## Installation

Using npm:

```bash
npm install diffblue-cover-client-js
```

## Usage

To use Diffblue Cover you will need to provide a JAR file of your compiled code. The default output will be a TAR of the tests produced by Diffblue Cover.

In Node.js (using promises):

```js
const CoverClient = require('diffblue-cover-client');

return CoverClient.analyse(buildJar).then((count) => {
  console.log(`Produced ${count} tests`);
});
```

In Typescript (using async/await):

```ts
import CoverClient from 'diffblue-cover-client';

const count = await CoverClient.analyse('./build.jar', './tests.tar');
console.log(`Produced ${count} tests`);
```

For more detailed usage, see the [programmatic interface documentation](docs/programmatic-interface.md).

## Full documentation

- [Programmatic interface](docs/programmatic-interface.md)
- [Command line interface](docs/command-line-interface.md)
- [Tests and checks](docs/tests-and-checks.md)
  - [Linting](docs/tests-and-checks.md#linting)
  - [Unit tests](docs/tests-and-checks.md#unit-tests)
  - [CLI tests](docs/tests-and-checks.md#cli-tests)
  - [Copyright checker](docs/tests-and-checks.md#copyright-checker)
  - [License checker](docs/tests-and-checks.md#license-checker)
  - [Integration tests](docs/tests-and-checks.md#integration-tests)
    - [Mock API](docs/tests-and-checks.md#mock-api)
- [Release procedure](docs/release-procedure.md)
- [Utilities](docs/utilities.md)
  - [Create Release](docs/utilities.md#create-release)
  - [Changelog](docs/utilities.md#changelog)
- [Code standards](docs/code-standards.md)
  - [File naming](docs/code-standards.md#file-naming)
  - [Branches](docs/code-standards.md#branches)
  - [Coding style](docs/code-standards.md#style)
  - [Code documentation](docs/code-standards.md#code-documentation)
- [Contributing guidelines](docs/contributing-guidelines.md)

Copyright 2019 Diffblue Limited. All Rights Reserved.
