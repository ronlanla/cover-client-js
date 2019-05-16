# Programmatic interface

## Low level bindings

You can use the low level bindings to submit requests to a Diffblue Cover API by following the below examples.

### How to get the current API version

In Node.js (using promises):

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';

return CoverClient.getApiVersion(api).then(({ version }) => {
  console.log(`Current API version: ${version}`);
});
```

In Typescript (using async/await):

```ts
import CoverClient from '@diffblue/cover-client';

(async () => {
  const api = 'https://0.0.0.0/api';

  const { version } = await CoverClient.getApiVersion(api);

  console.log(`Current API version: ${version}`);
})();
```

### How to start a new analysis

In Node.js (using promises) with streams and the minimum required for an analysis:

```js
const CoverClient = require('@diffblue/cover-client');
const fs = require('fs');

const api = 'https://0.0.0.0/api';
const build = fs.createReadStream('./build.jar');

return CoverClient.startAnalysis(api, { build: build }).then(({ id, phases }) => {
  console.log([
    `Analysis identifier: ${id}`,
    `Phases: ${phases}\n`
  ].join('\n'));
});
```

In Typescript (using async/await) with buffers and the maximum required for an analysis:

```ts
import CoverClient from '@diffblue/cover-client';
import { readFileSync } from 'fs';
import { promisify } from 'utils';

const api = 'https://0.0.0.0/api';

(async () => {
  const build = await readFileSync('./build.jar');
  const baseBuild = await readFileSync('./baseBuild.jar');
  const dependenciesBuild = await readFileSync('./dependenciesBuild.jar');
  const settings = { ignoreDefaults: true, phases: {}, webhooks: {} };

  const { id, phases } = await CoverClient.startAnalysis(api, {
    baseBuild: baseBuild,
    build: build,
    dependenciesBuild: dependenciesBuild,
    settings: settings,
  });

  console.log([
    `Analysis identifier: ${id}`,
    `Phases: ${phases}\n`
  ].join('\n'));
})();
```

### How to get results from an analysis

In Node.js (using promises) without an optional cursor:

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

const timeout = 1000 * 5; // milliseconds * seconds

(function getResults(prevCursor?: number) { // TODO: Add type/enum to status
  CoverClient.getAnalysisResults(api, id, prevCursor).then(({ cursor, results, status }) => {
    console.log([
      `Status: ${status.status}`,
      `Total functions: ${status.progress.total}`,
      `Total completed functions: ${status.progress.completed}`,
      `Analysis results: ${results}`,
      `Next cursor: ${cursor}\n`
    ].join('\n'));
    
    if (status.status === 'RUNNING' || status.status === 'QUEUED') { // TODO: Replace status with type/enum
      new Promise((resolve) => setTimeout(resolve, 5000)).then(() => {
        getResults(cursor);
      });
    }
  });
})();
```

In Typescript (using async/await) with an optional cursor:

```ts
import CoverClient from '@diffblue/cover-client';

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

(async function getResults(prevCursor?: number) { // TODO: Add type/enum to status
  const timeout = 1000 * 5; // milliseconds * seconds

  const { cursor, results, status } = await CoverClient.getAnalysisResults(api, id, prevCursor);
  console.log([
    `Status: ${status.status}`,
    `Total functions: ${status.progress.total}`,
    `Total completed functions: ${status.progress.completed}`,
    `Analysis results: ${results}`,
    `Next cursor: ${cursor}\n`
  ].join('\n'));
  
  if (status.status === 'RUNNING' || status.status === 'QUEUED') { // TODO: Replace status with type/enum
    await new Promise((resolve) => setTimeout(resolve, timeout));
    await getResults(cursor);
  }
})();
```

### How to cancel a running analysis

In Node.js (using promises):

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

return CoverClient.cancelAnalysis(api, id).then(({ message, status }) => {
  console.log([
    `Message: ${message}`,
    `Status: ${status.status}`,
    `Total functions: ${status.progress.total}`,
    `Total completed functions: ${status.progress.completed}\n`
  ].join('\n'));
});
```

In Typescript (using async/await):

```ts
import CoverClient from '@diffblue/cover-client';

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

(async () => {
  const { message, status } = await CoverClient.cancelAnalysis(api, id);
  console.log([
    `Message: ${message}`,
    `Status: ${status.status}`,
    `Total functions: ${status.progress.total}`,
    `Total completed functions: ${status.progress.completed}\n`
  ].join('\n'));
})();

```

### How to get the status of an analysis

In Node.js (using promises):

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';
return CoverClient.getAnalysisStatus(api, id).then(({ message, status }) => {
  console.log([
    `Status: ${status.status}`,
    `Total functions: ${status.progress.total}`,
    `Total completed functions: ${status.progress.completed}\n`,
  ].join('\n'));
});
```

In Typescript (using async/await):

```ts
import CoverClient from '@diffblue/cover-client';

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

(async () => {
  const { status } = await CoverClient.getAnalysisStatus(api, id);
  console.log([
    `Status: ${status.status}`,
    `Total functions: ${status.progress.total}`,
    `Total completed functions: ${status.progress.completed}\n`
  ].join('\n'));
})();
```

## Object orientated interface

The `Analysis` class can be used to run analyses.

It provides a high level interface to run an analysis and write tests via the `run` method.

It also makes the calling the low level api binding simpler, and keeps track of the state of the analysis.

### Instantiation

The `Analysis` constructor has one required parameter, which is the url of the Diffblue Cover api.

In Node.js:

```js
const Analysis = require('@diffblue/cover-client').Analysis;
const analysis = new Analysis('https://your-cover-api-domain.com');
```

In Typescript:

```ts
import { Analysis } from '@diffblue/cover-client';
const analysis = new Analysis('https://your-cover-api-domain.com');
```

### Usage

#### Start an analysis

To start an analysis, call `Analysis.start`.

The first parameter is required, and is an object containing streams or buffers of JAR files to be uploaded to the Diffblue Cover api.

This must include a `build` key, and may optionally include a `baseBuild` key and/or a `dependenciesBuild` key.

Including `dependenciesBuild` will enable test verification.

Including `baseBuild` will enable a differential analysis.

The second parameter is an optional settings object.

```ts
import { Analysis } from '@diffblue/cover-client';
const analysis = new Analysis('https://your-cover-api-domain.com');
const buildFile = fs.createReadSteam('./build.jar');
const settings = { ignoreDefaults: true, phases: {}};
(async () => {
  const { id, phases } = await analysis.start({ build: buildFile }, settings);
  console.log(`Analysis identifier: ${id}`);
  console.log(`Analysis computed phases: ${phases}`);
}();
```

```ts
import { Analysis } from '@diffblue/cover-client';
const analysis = new Analysis('https://your-cover-api-domain.com');
const buildFile = fs.createReadSteam('./build.jar');
const baseBuildFile = fs.createReadSteam('./baseBuild.jar');
const dependenciesBuildFile = fs.createReadSteam('./dependenciesBuild.jar');
const settings = { ignoreDefaults: true, phases: {}};
(async () => {
  const { id, phases } = await analysis.start(
    {
      build: buildFile,
      baseBuild: baseBuildFile,
      dependenciesBuild: dependenciesBuildFile,
    },
    settings,
  );
  console.log(`Analysis identifier: ${id}`);
  console.log(`Analysis computed phases: ${phases}`);
}();
```

#### Get the status of an analysis

To get the status of an analysis that has started, call `Analysis.getStatus`.

```ts
(async () => {
  const { status, progress } = await analysis.getStatus();
  console.log(`Analysis status: ${status}`);
  console.log(`Analysis progress: ${progress.completed}/${progress.total}`);
}();
```

#### Get the results of an analysis

To get the results (so far) of an analysis that has started, call `Analysis.getResults`.

```ts
(async () => {
  const { results, status, cursor } =  await analysis.getResults();
  console.log(`Analysis status: ${status.status}`);
  console.log(`Analysis progress: ${status.progress.completed}/${status.progress.total}`);
  console.log(`Number of new tests: ${results.length}`);
  console.log(`Next cursor: ${cursor}`);
}();
```

#### Cancel an analysis

To cancel an analysis that has started, call `Analysis.cancel`.

```ts
(async () => {
  const { status, message } = await analysis.cancel();
  console.log(`Analysis status: ${status.status}`);
  console.log(`Analysis progress: ${status.progress.completed}/${status.progress.total}`);
  console.log(`Cancellation message: ${message}`);
}();
```

#### Get the version of the Diffblue Cover api

To check the version of the Diffblue Cover api, call `Analysis.getApiVersion`.

```ts
(async () => {
 const { version } = await analysis.getApiVersion();
 console.log(`Api version: ${version}`);
}();
```

### Result pagination

Calling `Analysis.getResults` will save the returned pagination cursor on the `Analysis` instance
and a subsequent call to `Analysis.getResults` will, by default, pass that cursor to the Diffblue Cover api and only return
new results generated since that cursor.
To disable the automatic pagination behavior and fetch the full set of results generated (so far),
set the first parameter of `Analysis.getResults` to `false`.

### Lifecycle

The `Analysis` object has a number of helper methods to check the saved analysis status, as of the last
call to any method that changes or returns the current analysis status.

```ts
import { ok } from 'assert';
import { Analysis } from '@diffblue/cover-client';
(async () => {
  const analysis = new Analysis('https://your-cover-api-domain.com');
  ok(analysis.isNotStarted());
  await analysis.start('./buildPath.jar', settings);
  ok(analysis.isRunning());
}();
```

The `Analysis` object keeps track of the status of the analysis it is running, and will throw an error
if a method is called at an inappropriate time.

```ts
import { ok } from 'assert';
import { Analysis } from '@diffblue/cover-client';
(async () => {
  const analysis = new Analysis('https://your-cover-api-domain.com');
  ok(analysis.isNotStarted());
  try {
    await analysis.getResults();
  catch (error) {
    console.log(`Fetching results before starting throws: ${error}`)
  }
  await analysis.start('./buildPath.jar', settings);
  ok(analysis.isRunning());
  try {
    await analysis.start();
  catch (error) {
    console.log(`Starting a started analysis throws: ${error}`)
  }
}();
```

## Combining results into test classes

The `combiner` module provides methods to produce test classes from Diffblue Cover API results that can be written to a file and run.

### Generate a new test class

The `generateTestClass` function will produce a test class from an array of Diffblue Cover API results.

All off these results should relate to the same class under test and so must all have the same `sourceFilePath` value, and must all have `testedFunction` values that when parsed produce the same `className` and `packageName` values.

In Node.js:

 ```js
const CoverClient = require('@diffblue/cover-client');
const testClass = CoverClient.generateTestClass(results);
```

### Merge results into an existing test class

The `mergeIntoTestClass` function can be used to generate tests from an array of Diffblue Cover API results and merge them into an existing test class.

All off these results should relate to the same class under test and so must all have the same `sourceFilePath` value, and must all have `testedFunction` values that when parsed produce the same `className` and `packageName` values.

The existing test class should relate to the same class under test as the results.

In Node.js:

 ```js
const fs = require(fs);
const CoverClient = require('@diffblue/cover-client');
const existingTestClass = fs.readFileSync('./FooBarTest.java');
CoverClient.generateTestClass(existingTestClass, results).then((testClass) => {
  console.log(`Merged test class:\n${testClass}`);
});
```

### Group results by tested function

`generateTestClass` and `mergeIntoTestClass` expect the results they receive to all have the same `sourceFilePath` value.

`groupResults` can be used to sort an array of Diffblue Cover API results into an object with results grouped by `sourceFilePath`.

Each value in this object should be suitable to pass to `generateTestClass` or `mergeIntoTestClass`.

It is assumed that all `testedFunctions` for a given `sourceFilePath` will produce the same `className` and `packageName` values when parsed.

In Node.js:

 ```js
const CoverClient = require('@diffblue/cover-client');
const groupedResults = CoverClient.groupResults(results);
```

Copyright 2019 Diffblue Limited. All Rights Reserved.
