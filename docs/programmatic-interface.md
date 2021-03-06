# Programmatic interface

## Object orientated interface

The `Analysis` class can be used to run analyses.

It provides a high level interface to run an analysis and write tests via the `run` method.

It also makes the calling the low level API bindings simpler, and keeps track of the state of the analysis.

### Instantiation

The `Analysis` constructor has one required parameter, which is the URL of the Diffblue Cover API.

The constructor also accepts a second optional parameter of bindings options, which will be applied to all calls the object makes to the low level API bindings.
(see [Low level options](#-low-level-options) below)

The constructor also accepts a third optional parameter of an analysis id, which can be used to interact with an analysis that has already been started via the Diffblue Cover API.
(see [Resume an analysis](#-resume-an-analysis)) below)

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

#### Resume an analysis

If you have already started an analysis via the Diffblue Cover API and wish to interact with it via an `Analysis` object, pass the analysis id to the `Analysis` constructor as a third parameter.

The `Analysis` will be created with a special `status` value of `'UNKNOWN'` which indicates that the analysis has started (we know this is true since we have an id for it) but that we do not know it's current status. Calling `Analysis.getResults`, `Analysis.getStatus`, or `Analysis.cancel` will update the `status` property with the current server side status of the analysis. `Analysis.start` cannot be called when the `status` is `'UNKNOWN'`.

In Node.js:

```js
const Analysis = require('@diffblue/cover-client').Analysis;
const assert = require 'assert';

const analysisId = 'analysis-id-here';  // analysis id previously fetched from the Diffblue Cover API
const analysis = new Analysis('https://your-cover-api-domain.com', undefined, analysisId);
assert.ok(analysis.status === 'UNKNOWN');
```

In Typescript:

```ts
import { Analysis } from '@diffblue/cover-client';
import { ok } from 'assert';

const analysisId = 'analysis-id-here';  // analysis id previously fetched from the Diffblue Cover API
const analysis = new Analysis('https://your-cover-api-domain.com', undefined, analysisId);
ok(analysis.status === 'UNKNOWN');
```

### Usage

#### Run an analysis (object orientated)

To run an analysis, call `Analysis.run`. This will start the analysis and wait for it to finish, periodically polling for new results and the current analysis status.

If a directory is specified via the `outputTests` option (see below), tests files will be written to disk at this location when the analysis ends.

The first parameter is required, and is an object containing streams or buffers of JAR files to be uploaded to the Diffblue Cover API.

This must include a `build` key, and may optionally include a `baseBuild` key and/or a `dependenciesBuild` key.

Including `dependenciesBuild` will enable test verification.

Including `baseBuild` will enable a differential analysis.

The second parameter is an optional settings object, containing analysis settings to be uploaded to the Diffblue Cover API.

If the settings parameter is omitted, default settings will be fetched from the Diffblue Cover API (if they have not already been set on the `Analysis` object) and used to run the analysis.

The third parameter is an optional options object, to configure the behavior of the `run` method. The available options are:

1. `outputTests` (string). A directory path. If provided, test files will be written to this directory when the analysis ends. If the directory does not exist it will be created.
2. `writingConcurrency` (integer) The maximum number of test files to write concurrently, if `outputTests` is provided. (default: 20)
3. `writingFilter` (array | object | function) Filter to apply to results before writing test files. One of:
    * An array of tag strings
    * A object with optional `include` and `exclude` properties, containing arrays of tag strings
    * A callback function the accepts a single result as a parameter and returns a boolean
4. `pollingInterval` (number) How often to poll for new results and the current analysis status, in seconds. (default: 60 seconds)
5. `onResults` (function) Callback that will be called once for every group of new results per polling cycle. Receives two parameters:
    * `results` (array) An array of result objects, grouped by `sourceFilePath` (see [Group results](#-group-results) below).
    * `filename` (string) The computed destination test file name for the results. For example, the `filename` for results for the class under test `Foo` would be `FooTest.java`.
6. `onError` (function) Callback that will be called once if the `run` method throws an error. If provided, the thrown error will be swallowed, and the promise returned by the `run` call will resolve rather than reject. Receives one parameter:
    * `error` (error) The thrown error object.

```ts
import Analysis from '@diffblue/cover-client';
import { createReadStream } from 'fs';

const analysis = new Analysis('https://your-cover-api-domain.com');
const files = {
  build: createReadStream('./build.jar'),
  baseBuild: createReadStream('./baseBuild.jar'),
  dependenciesBuild: createReadStream('./dependenciesBuild.jar'),
};
// This is a sample settings object that will not run a useful analysis.
// You can omit the settings parameter when calling `run` to start an analysis with default settings.
const settings = { phases: { firstPhase: { timeout: 10 }}};
const options = { outputTests: './tests', pollingInterval: 5 };

(async () => {
  const results = await analysis.run(files, settings, options);
  console.log(`Analysis ended with the status: ${analysis.status}.`);
  console.log(`Produced ${results.length} tests in total.`);
  console.log(`Test files written to ${options.outputTests}.`);
})();
```

##### Stop polling for results

The `stopPolling` method can be used to interrupt a `run` call and stop the polling cycle. This will cause the promise returned by `run` to resolve.

If a test file directory has been specified and any results have been received, test files will be written using the current set of fetched results.

**Please note:** calling `stopPolling` will _not_ stop the analysis from running on the Diffblue Cover server. To cancel the analysis server side, call `Analysis.cancel` (See [Cancel an analysis (Object orientated)](#-cancel-an-analysis-object-orientated) below).

```ts
import Analysis from '@diffblue/cover-client';
import { createReadStream } from 'fs';
import { ok } from 'assert';

const analysis = new Analysis('https://your-cover-api-domain.com');
const files = {
  build: createReadStream('./build.jar'),
};
// This is a sample settings object that will not run a useful analysis.
// You can omit the settings parameter when calling `run` to start an analysis with default settings.
const settings = { phases: { firstPhase: { timeout: 10 }}};

(async () => {
  const runPromise = analysis.run(files, settings);
  analysis.stopPolling();
  ok(analysis.pollingStopped);
  await analysis.getStatus()
  ok(analysis.status === 'RUNNING')
})();
```

#### Start an analysis (Object orientated)

To start an analysis, call `Analysis.start`.

The first parameter is required, and is an object containing streams or buffers of JAR files to be uploaded to the Diffblue Cover API.

This must include a `build` key, and may optionally include a `baseBuild` key and/or a `dependenciesBuild` key.

Including `dependenciesBuild` will enable test verification.

Including `baseBuild` will enable a differential analysis.

The second parameter is an optional settings object, containing analysis settings to be uploaded to the Diffblue Cover API.

If the settings parameter is omitted, default settings will be fetched from the Diffblue Cover API (if they have not already been set on the `Analysis` object) and used to run the analysis.

After calling `Analysis.start` the `settings`, `analysisId`, `computedSettings` and `status` properties of the analysis object will be updated.
The `settings` property will contain the settings provided when calling `Analysis.start`, the `computedSettings` property will contain the settings used to start the analysis as returned from the server in the start analysis response.
If no settings are passed to `Analysis.start` and default settings are used, the `settings` property will not be populated, but the `defaultSettings` property will.

```ts
import { Analysis } from '@diffblue/cover-client';
import { createReadStream } from 'fs';

const analysis = new Analysis('https://your-cover-api-domain.com');
const buildFile = createReadStream('./build.jar');

(async () => {
  const { id, settings } = await analysis.start({ build: buildFile };
  console.log(`Analysis identifier: ${id}`);
  console.log(`Analysis computed settings: ${settings}`);
}();
```

```ts
import { Analysis } from '@diffblue/cover-client';
import { createReadStream } from 'fs';

const analysis = new Analysis('https://your-cover-api-domain.com');
const files = {
  build: createReadStream('./build.jar'),
  baseBuild: createReadStream('./baseBuild.jar'),
  dependenciesBuild: createReadStream('./dependenciesBuild.jar'),
};
// This is a sample settings object that will not run a useful analysis.
// You can omit the settings parameter when calling `start` to start an analysis with default settings.
const userSettings = { phases: { firstPhase: { timeout: 10 }}};

(async () => {
  const { id, settings } = await analysis.start(files, userSettings);
  console.log(`Analysis identifier: ${id}`);
  console.log(`Analysis computed settings: ${settings}`);
}();
```

#### Get analysis status (Object orientated)

To get the status of an analysis that has started, call `Analysis.getStatus`.

The `status` property (and `error` property if applicable) of the analysis object will be updated.

```ts
(async () => {
  const { status } = await analysis.getStatus();
  console.log(`Analysis status: ${status}`);
}();
```

#### Get analysis results (Object orientated)

To get the results (so far) of an analysis that has started, call `Analysis.getResults`.

The `results`, `cursor` and `status` properties (and `error` property if applicable) of the analysis object will be updated.

```ts
(async () => {
  const { results, status, cursor } =  await analysis.getResults();
  console.log(`Analysis status: ${status.status}`);
  console.log(`Number of new tests: ${results.length}`);
  console.log(`Next cursor: ${cursor}`);
}();
```

#### Cancel an analysis (Object orientated)

To cancel an analysis that has started, call `Analysis.cancel`.

The `status` property (and `error` property if applicable) of the analysis object will be updated.

```ts
(async () => {
  const { status, message } = await analysis.cancel();
  console.log(`Analysis status: ${status.status}`);
  console.log(`Cancellation message: ${message}`);
}();
```

#### Get default analysis settings (Object orientated)

To get a set of default recommended analysis settings from the Diffblue Cover API, call `Analysis.getDefaultSettings`.

The returned default settings will be stored in the `defaultSettings` property of the analysis object.

```ts
(async () => {
 const defaultSettings = await analysis.getDefaultSettings();
 console.log('Default analysis settings:');
 console.dir(defaultSettings);
}();
```

#### Get API version (Object orientated)

To check the version of the Diffblue Cover API, call `Analysis.getApiVersion`.

The returned version number will be stored in the `version` property of the analysis object.

```ts
(async () => {
 const { version } = await analysis.getApiVersion();
 console.log(`API version: ${version}`);
}();
```

### Write test files to disk (object orientated)

To write test files to disk, call `Analysis.writeTests`.

This will call the `writeTests` function using the current value of `Analysis.results`. See [Write test files to disk](#-write-test-files-to-disk) below for more details.

This method accepts two parameters.

1. `directoryPath` (string) The path of the directory that test files will be written to.
2. `options` (object) [optional] Possible options:
    * `concurrency` (integer) The maximum number of test files to write concurrently. (default: 20)

```ts
import Analysis from '@diffblue/cover-client';
import { createReadStream } from 'fs';

const analysis = new Analysis('https://your-cover-api-domain.com');
const files = {
  build: createReadStream('./build.jar'),
};
// This is a sample settings object that will not run a useful analysis.
const settings = { phases: { firstPhase: { timeout: 10 }}};
const directoryPath = './tests';

(async () => {
  await analysis.run(files, settings);
  console.log(`Analysis has ended with ${analysis.results.length} results.`);
  await analysis.writeTests(directoryPath)
  console.log(`Test files written to ${directoryPath}.`);
})();
```

### Result pagination

Calling `Analysis.getResults` will save the returned pagination cursor on the `Analysis` instance
and a subsequent call to `Analysis.getResults` will, by default, pass that cursor to the Diffblue Cover API and only return
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
To start an analysis the minimum you need is a build JAR file of your source code and a settings object.

If you need a settings object, you can fetch the default analysis settings from the Diffblue Cover API using the `getDefaultSettings` low level binding.

You can optionally provide a build with dependencies JAR file, which allows Diffblue Cover to verify the tests it creates.
The dependencies JAR (often known as a "fat" or "uber" JAR) can be created with the [Maven Shade Plugin](https://maven.apache.org/plugins/maven-shade-plugin/) or the [Maven Assembly Plugin](http://maven.apache.org/plugins/maven-assembly-plugin/).

You can also optionally provide a base JAR in order to do a differential analysis. A differential analysis allows you to only analyze code which has changed since a previous version. To do this you need to provide a base JAR of a previous build (this does not need to include dependencies).

Node.js example using promises and a file stream of the build JAR:

```js
const CoverClient = require('@diffblue/cover-client');
const fs = require('fs');

const api = 'https://0.0.0.0/api';
const build = fs.createReadStream('./build.jar');
// This is a sample settings object that will not run a useful analysis.
const userSettings = { phases: { firstPhase: { timeout: 10 }}};

return CoverClient.startAnalysis(api, { build: build }, userSettings).then(({ id, settings }) => {
  console.log([
    `Analysis identifier: ${id}`,
    `Computed analysis settings: ${settings}`
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
  // This is a sample settings object that will not run a useful analysis.
  const userSettings = { phases: { firstPhase: { timeout: 10 }}};
  const files = {
    baseBuild: baseBuild,
    build: build,
    dependenciesBuild: dependenciesBuild,
  };

  const { id, settings } = await CoverClient.startAnalysis(api, files, userSettings);

  console.log([
    `Analysis identifier: ${id}`,
    `Computed analysis settings: ${settings}`
  ].join('\n'));
})();
```

### Get analysis status (Low level)

Given an analysis identifier, returns the current analysis status. The possible statuses are: QUEUED, RUNNING, STOPPING, ERRORED, CANCELED and COMPLETED.

A status of QUEUED, RUNNING or STOPPING indicates that the analysis is still in progress and that new results may still be returned.

A status of ERRORED, CANCELED or COMPLETED indicates that the analysis has ended, and no further results are expected.

In the case of an ERRORED status, an error message object with further information will also be returned.

Node.js example using promises:

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

return CoverClient.getAnalysisStatus(api, id).then(({ status }) => {
  console.log(`Status: ${status}`);
});
```

Typescript/ES6 modules example using async/await:

```ts
import CoverClient from '@diffblue/cover-client';

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';

(async () => {
  const { status } = await CoverClient.getAnalysisStatus(api, id);
  console.log(`Status: ${status}`);
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
    `Analysis results: ${results}`,
    `Next cursor: ${cursor}`
  ].join('\n'));
});
```

Typescript/ES6 modules example using async/await, polling for results using the cursor:

```ts
import CoverClient from '@diffblue/cover-client';
import { delay } from 'bluebird';

const api = 'https://0.0.0.0/api';
const id = 'abcd1234-ab12-ab12-ab12-abcd12abcd12';
const inProgressStatuses = new Set(['RUNNING', 'QUEUED', 'STOPPING' ]);

(async () => {
  let results = [];
  let response;
  let nextCursor?: number;

  while (!response || inProgressStatuses.has(response.status.status)) {
    response = await CoverClient.getAnalysisResults(api, id, nextCursor);
    console.log(
      `Status: ${response.status.status}`,
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
  ].join('\n'));
})();
```

### Get default analysis settings (Low level)

Gets a set of default recommended analysis settings from the Diffblue Cover API.

Node.js example using promises:

```js
const CoverClient = require('@diffblue/cover-client');

const api = 'https://0.0.0.0/api';

return CoverClient.getDefaultSettings(api).then((defaultSettings) => {
  console.log('Default analysis settings:');
  console.dir(defaultSettings);
});
```

Typescript/ES6 modules example using async/await:

```ts
import CoverClient from '@diffblue/cover-client';

const api = 'https://0.0.0.0/api';

(async () => {
  const defaultSettings = await CoverClient.getDefaultSettings(api);
  console.log('Default analysis settings:');
  console.dir(defaultSettings);
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

The `writeTests` function will produce test classes from Diffblue Cover API results and write them to disk at a specified location.

The lower level `generateTestClass` and `mergeIntoTestClass` functions can be used to generate test classes as strings.

### Write test files to disk

To write test files to disk, call `writeTests`.

This function accepts three parameters.

1. `directoryPath` (string) The path of the directory that test files will be written to.
2. `results` (array) An array of `result` objects, relating to one or more classes under test.
3. `options` (object) [optional] Possible options:
    * `concurrency` (integer) [optional] The maximum number of test files to write concurrently. (default: 20)
    * `filter` (array | object | function) [optional] Filter to apply to results before writing test files. One of:
      * An array of tag strings
      * A object with optional `include` and `exclude` properties, containing arrays of tag strings
      * A callback function the accepts a single result as a parameter and returns a boolean

The return value is an array of strings denoting the paths of the test files written.

When writing test files, the provided results will be grouped by `sourceFilePath` so that each group relates to one class under test (See [Group results](#-group-results) below).

For each group of results:

If a `filter` option has been specified, the results will be filtered via `filterResults` before writing. See [Filter results](#-filter-results) below).

If a test file with the expected name and path already exists in the target directory, the contents of the pre-existing file will be merged with the new tests generated from the results. The resulting test class containing both the new and pre-existing tests will be written back to the file, overwriting its original contents.

If a test file with the expected name and path does not exist in the target directory then a new test class will be generated and written to disk at that location.

For example, when calling `writeTests` with a `directoryPath` of `/testDir`, a group of results that share a `sourceFilePath` of `/com/foo/bar/SomeClass.java` will have an expected test file name and path of `/testDir/com/foo/bar/SomeClassTest.java`

If errors occur during test writing, the function will continue to attempt to write test files for each group of results, and finally reject with an error containing details of any errors that occurred (listed with the related `sourceFilePath`).

```ts
import CoverClient from '@diffblue/cover-client';

const directoryPath = './tests';
const options = {
  concurrency: 100,
  filter: ['verified'],
};
const results = [] // This should be an array of analysis result objects

(async () => {
  const testFilePaths = await CoverClient.writeTests(directoryPath, results, options);
  console.log(`Test files written: ${testFilePaths.join(', ')}.`);
})();
```

### Generate a new test class

The `generateTestClass` function will produce a test class from an array of Diffblue Cover API results.

All of these results should relate to the same class under test, and so must all have the same `sourceFilePath` value, and must all have `testedFunction` values that when parsed produce the same `packageName` value (See [Group results](#-group-results) below).

 ```ts
import CoverClient from '@diffblue/cover-client';

const results = [] // This should be an array of analysis result objects

const testClass = CoverClient.generateTestClass(results);
console.log(`New test class:\n${testClass}`);
```

### Merge results into an existing test class

The `mergeIntoTestClass` function can be used to generate tests from an array of Diffblue Cover API results and merge them into an existing test class.

All of these results should relate to the same class under test, and so must all have the same `sourceFilePath` value, and must all have `testedFunction` values that when parsed produce the same `packageName` value (See [Group results](#-group-results) below).

The existing test class should relate to the same class under test as the results.

```ts
import CoverClient from '@diffblue/cover-client';
import { readFile } from 'fs';
import { promisify } from 'util';

const results = [] // This should be an array of analysis result objects

(async () => {
  const existingTestClass = await promisify(fs.readFile)('./FooBarTest.java');
  const mergedTestClass = await CoverClient.mergeIntoTestClass(existingTestClass, results);
  console.log(`Merged test class:\n${mergedTestClass}`);
})();
```

### Filter results

The `filterResults` can be used to filter an array of results.

This function accepts two parameters:

1. `results` (array) An array of `result` objects.
2. `filter` (array | object | function) [optional] Filter to apply to results. One of:
    * An array of tag strings
    * A object with optional `include` and `exclude` properties, containing arrays of tag strings
    * A callback function the accepts a single result as a parameter and returns a boolean

If `filter` is omitted, the results array will be returned unaltered.

If `filter` is an array of tag strings, only results that have at least one of the specified tags will be returned.

If `filter` is an object, only results which match at least one `include` tag (if any are specified) and none of the `exclude` tags (if any are specified) will be returned.

If `filter` is a function it will be used to filter the results array directly, as a callback passed to `Array.filter`.

```ts
import CoverClient from '@diffblue/cover-client';

const results = [] // This should be an array of analysis result objects

const allResults = CoverClient.filterResults(results, undefined);

const verifiedResults = CoverClient.filterResults(results, ['verified']);

const verifiedNoMockingResults = CoverClient.filterResults(
  results,
  { include: ['verified'], exclude: ['mocking'] },
);

const ticTacToeResults = CoverClient.filterResults(
  results,
  (result) => result.sourceFilePath === 'com/diffblue/javademo/TicTacToe.java',
);
```

The `filterResults` function is used internally by `writeTests`, but could also be used to to filter arrays of results generically.
For example, the `results` property of an `Analysis` object could be filtered to only include verified results:

```ts
import Analysis, { filterResults } from '@diffblue/cover-client';
import { createReadStream } from 'fs';

const analysis = new Analysis('https://your-cover-api-domain.com');
const files = {
  build: createReadStream('./build.jar'),
  baseBuild: createReadStream('./baseBuild.jar'),
  dependenciesBuild: createReadStream('./dependenciesBuild.jar'),
};

(async () => {
  await analysis.run(files);
  analysis.results = filterResults(analysis.results, ['verified'])
})();
```

### Group results

`generateTestClass` and `mergeIntoTestClass` expect the results they receive to all have the same `sourceFilePath` value.

`groupResults` can be used to sort an array of Diffblue Cover API results into an object with results grouped by `sourceFilePath`.

Each value in this object should be suitable to pass to `generateTestClass` or `mergeIntoTestClass`.

It is assumed that all `testedFunction`s in a given `sourceFilePath` grouping will produce the same `packageName` value when parsed.

For example, the function names `com.diffblue.javademo.TicTacToe.checkTicTacToePosition` and `com.diffblue.javademo.TicTacToe.otherFunction` would both produce the `packageName` `com.diffblue.javademo` when parsed.

```ts
import CoverClient from '@diffblue/cover-client';

const results = [] // This should be an array of analysis result objects
const groupedResults = CoverClient.groupResults(results);
```

Copyright 2019 Diffblue Limited. All Rights Reserved.
