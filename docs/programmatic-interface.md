# Programmatic interface

## Object orientated interface

The `Analysis` class can be used to run analyses.

It provides a high level interface to run an analysis and write tests via the `run` method.

It also makes the calling the low level api binding simpler, and keeps track of the state of the analysis.

### Instantiation

The `Analysis` constructor has one required parameter, which is the url of the Diffblue Cover api.

The constructor also accepts a second optional parameter of bindings options, which will be applied to all calls the object makes to the low level API bindings.
(see [low level options](#-low-level-options))

In Node.js:

```js
const Analysis = require('@diffblue/cover-client').Analysis;
const analysis = new Analysis('https://your-cover-api-domain.com');
const permissiveAnalysis = new Analysis('https://your-cover-api-domain.com', { allowUnauthorizedHttps: true });
```

In Typescript:

```ts
import { Analysis } from '@diffblue/cover-client';
const analysis = new Analysis('https://your-cover-api-domain.com');
const permissiveAnalysis = new Analysis('https://your-cover-api-domain.com', { allowUnauthorizedHttps: true });
```

### Usage

#### Start an analysis (Object orientated)

To start an analysis, call `Analysis.start`.

The first parameter is required, and is an object containing streams or buffers of JAR files to be uploaded to the Diffblue Cover api.

This must include a `build` key, and may optionally include a `baseBuild` key and/or a `dependenciesBuild` key.

Including `dependenciesBuild` will enable test verification.

Including `baseBuild` will enable a differential analysis.

The second parameter is an optional settings object.

```ts
import { Analysis } from '@diffblue/cover-client';
import { createReadStream } from 'fs';
const analysis = new Analysis('https://your-cover-api-domain.com');
const buildFile = createReadStream('./build.jar');
const settings = { ignoreDefaults: true, phases: {}};
(async () => {
  const { id, phases } = await analysis.start({ build: buildFile }, settings);
  console.log(`Analysis identifier: ${id}`);
  console.log(`Analysis computed phases: ${phases}`);
}();
```

```ts
import { Analysis } from '@diffblue/cover-client';
import { createReadStream } from 'fs';
const analysis = new Analysis('https://your-cover-api-domain.com');
const buildFile = createReadStream('./build.jar');
const baseBuildFile = createReadStream('./baseBuild.jar');
const dependenciesBuildFile = createReadStream('./dependenciesBuild.jar');
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

#### Get analysis status (Object orientated)

To get the status of an analysis that has started, call `Analysis.getStatus`.

```ts
(async () => {
  const { status, progress } = await analysis.getStatus();
  console.log(`Analysis status: ${status}`);
  console.log(`Analysis progress: ${progress.completed}/${progress.total}`);
}();
```

#### Get analysis results (Object orientated)

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

#### Cancel an analysis (Object orientated)

To cancel an analysis that has started, call `Analysis.cancel`.

```ts
(async () => {
  const { status, message } = await analysis.cancel();
  console.log(`Analysis status: ${status.status}`);
  console.log(`Analysis progress: ${status.progress.completed}/${status.progress.total}`);
  console.log(`Cancellation message: ${message}`);
}();
```

#### Get API version (Object orientated)

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
import { Analysis } from '@diffblue/cover-client';
import { ok } from 'assert';
import { createReadStream } from 'fs';
const buildFile = createReadStream('./build.jar');
(async () => {
  const analysis = new Analysis('https://your-cover-api-domain.com');
  ok(analysis.isNotStarted());
  await analysis.start({ build: buildFile }, settings);
  ok(analysis.isRunning());
}();
```

The `Analysis` object keeps track of the status of the analysis it is running, and will throw an error
if a method is called at an inappropriate time.

```ts
import { Analysis } from '@diffblue/cover-client';
import { ok } from 'assert';
import { createReadStream } from 'fs';
const buildFile = createReadStream('./build.jar');
(async () => {
  const analysis = new Analysis('https://your-cover-api-domain.com');
  ok(analysis.isNotStarted());
  try {
    await analysis.getResults();
  catch (error) {
    console.log(`Fetching results before starting throws: ${error}`)
  }
  await analysis.start({ build: buildFile }, settings);
  ok(analysis.isRunning());
  try {
    await analysis.start({ build: buildFile }, settings);
  catch (error) {
    console.log(`Starting a started analysis throws: ${error}`)
  }
}();
```

## Low level bindings

You can use the low level bindings to submit requests to a Diffblue Cover API by following the below examples.

### Start an analysis (Low level)

Starts an analysis and returns the unique identifier for that analysis.
To start an analysis the minimum you need is a build JAR file of your source code.

You can optionally provide a settings object in order to customize the analysis.
TODO: Describe settings format

You can optionally provide a build with dependencies JAR file, which allows Diffblue Cover to verify the tests it creates.
The dependencies JAR (often known as a "fat" or "uber" JAR) can be created with the [Maven Shade Plugin](https://maven.apache.org/plugins/maven-shade-plugin/) or the [Maven Assembly Plugin](http://maven.apache.org/plugins/maven-assembly-plugin/).

You can also optionally provide a base JAR in order to do a differential analysis. A differential analysis allows you to only analyze code which has changed since a previous version. To do this you need to provide a base JAR of a previous build (this does not need to include dependencies).

Node.js example using promises and a file stream of the build JAR:

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

Typescript/ES6 modules example using async/await, file buffers of the build JAR, base build JAR and dependencies JAR; and supplying a settings object:

```ts
import CoverClient from '@diffblue/cover-client';
import { readFile } from 'fs';
import { promisify } from 'util';

const api = 'https://0.0.0.0/api';

(async () => {
  const build = await promisify(readFile)('./build.jar');
  const baseBuild = await promisify(readFile)('./baseBuild.jar');
  const dependenciesBuild = await promisify(readFile)('./dependenciesBuild.jar');
  const settings = { ignoreDefaults: true, phases: {}};
  const files = {
    baseBuild: baseBuild,
    build: build,
    dependenciesBuild: dependenciesBuild,
  };

  const { id, phases } = await CoverClient.startAnalysis(api, files, settings);

  console.log([
    `Analysis identifier: ${id}`,
    `Phases: ${phases}\n`
  ].join('\n'));
})();
```

### Get analysis status (Low level)

Given an analysis identifier, returns the current analysis status, and progress. The possible statuses are: QUEUED, RUNNING, ERRORED, CANCELED and COMPLETED.

The progress object returns the number of functions which have been analyzed compared to the total number to analyze.

In the case of an ERRORED status, an error message object with further information will also be returned.

Node.js example using promises:

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

return CoverClient.getAnalysisStatus(api, id).then(({ status, progress }) => {
  console.log([
    `Status: ${status}`,
    `Total functions: ${progress.total}`,
    `Total completed functions: ${progress.completed}\n`,
  ].join('\n'));
});
```

Typescript/ES6 modules example using async/await:

```ts
import CoverClient from '@diffblue/cover-client';

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

(async () => {
  const { status, progress } = await CoverClient.getAnalysisStatus(api, id);
  console.log([
    `Status: ${status}`,
    `Total functions: ${progress.total}`,
    `Total completed functions: ${progress.completed}\n`,
  ].join('\n'));
})();
```

### Get analysis results (Low level)

Given an analysis identifier, returns a set of results from the analysis, along with the status of the analysis and a cursor for requesting results iteratively.

You can optionally provide a cursor, which will only return results that were generated since that cursor. This is useful if you want to incrementally download results during the analysis. Please note that making a request with the same cursor twice will not necessarily give the same number of results, since new results may have been generated.

Node.js example using promises and requesting all results:

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

CoverClient.getAnalysisResults(api, id).then(({ cursor, results, status }) => {
  console.log([
    `Status: ${status.status}`,
    `Total functions: ${status.progress.total}`,
    `Total completed functions: ${status.progress.completed}`,
    `Analysis results: ${results}`,
    `Next cursor: ${cursor}\n`
  ].join('\n'));
});
```

Typescript/ES6 modules example using async/await, polling for results using the cursor:

```ts
import CoverClient from '@diffblue/cover-client';
import { delay } from 'bluebird';

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

(async () => {
  let results = [];
  let response;
  let nextCursor?: number;

  while (!response || response.status.status === 'RUNNING' || response.status.status === 'QUEUED') {
    response = await CoverClient.getAnalysisResults(api, id, nextCursor);
    console.log(
      `Status: ${response.status.status}`,
      `Total functions: ${response.status.progress.total}`,
      `Total completed functions: ${response.status.progress.completed}`,
      `Number of new tests: ${response.results.length}`,
      `Next cursor: ${response.cursor}`,
    );

    nextCursor = response.cursor;
    results = results.concat(response.results);
    await delay(5000);
  }

  console.log(`Analysis results: ${results}`);
})();
```

### Cancel an analysis (Low level)

Given an analysis identifier, cancels that analysis. Returns the final status of the analysis.
Any tests already produced will still be available via the get results route.

Node.js example using promises:

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

return CoverClient.cancelAnalysis(api, id).then(({ message, status }) => {
  console.log(
    `Message: ${message}`,
    `Status: ${status.status}`,
    `Total functions: ${status.progress.total}`,
    `Total completed functions: ${status.progress.completed}`,
  );
});
```

Typescript/ES6 modules example using async/await:

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

### Get API version (Low level)

Returns the current version of the API.

Node.js example using promises:

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';

return CoverClient.getApiVersion(api).then(({ version }) => {
  console.log(`Current API version: ${version}`);
});
```

Typescript/ES6 modules example using async/await:

```ts
import CoverClient from '@diffblue/cover-client';

const api = 'https://0.0.0.0/api';

(async () => {
  const { version } = await CoverClient.getApiVersion(api);
  console.log(`Current API version: ${version}`);
})();
```

### Low level options

All of the low level bindings accept an optional `options` object as their final parameter, which can be used to configure their behavior.

#### Ignore https rejection

Pass an `options` object to a low level binding with the property `allowUnauthorizedHttps` set to `true` in order make the API request with an https agent with `rejectUnauthorized` set to `false`.

Typescript/ES6 modules example using async/await:

```ts
import CoverClient from '@diffblue/cover-client';

const api = 'https://0.0.0.0/api';
const options = { allowUnauthorizedHttps: true };

(async () => {
  const { version } = await CoverClient.getApiVersion(api, options);
  console.log(`Current API version: ${version}`);
})();
```

## Combining results into test classes

The `combiner` module provides methods to produce test classes from Diffblue Cover API results that can be written to a file and run.

### Generate a new test class

The `generateTestClass` function will produce a test class from an array of Diffblue Cover API results.

All off these results should relate to the same class under test and so must all have the same `sourceFilePath` value, and must all have `testedFunction` values that when parsed produce the same `className` and `packageName` values.

Node.js example:

 ```js
const CoverClient = require('@diffblue/cover-client');
const testClass = CoverClient.generateTestClass(results);
```

### Merge results into an existing test class

The `mergeIntoTestClass` function can be used to generate tests from an array of Diffblue Cover API results and merge them into an existing test class.

All off these results should relate to the same class under test and so must all have the same `sourceFilePath` value, and must all have `testedFunction` values that when parsed produce the same `className` and `packageName` values.

The existing test class should relate to the same class under test as the results.

Node.js example:

 ```js
const fs = require('fs');
const CoverClient = require('@diffblue/cover-client');
const util = require('util');

util.promisify(fs.readFile)('./FooBarTest.java').then((existingTestClass) => {
  return CoverClient.generateTestClass(existingTestClass, results).then((testClass) => {
    console.log(`Merged test class:\n${testClass}`);
  });
});
```

### Group results by tested function

`generateTestClass` and `mergeIntoTestClass` expect the results they receive to all have the same `sourceFilePath` value.

`groupResults` can be used to sort an array of Diffblue Cover API results into an object with results grouped by `sourceFilePath`.

Each value in this object should be suitable to pass to `generateTestClass` or `mergeIntoTestClass`.

It is assumed that all `testedFunctions` for a given `sourceFilePath` will produce the same `className` and `packageName` values when parsed.

Node.js example:

 ```js
const CoverClient = require('@diffblue/cover-client');
const groupedResults = CoverClient.groupResults(results);
```

Copyright 2019 Diffblue Limited. All Rights Reserved.
