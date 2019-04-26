# Programmatic interface

## Object orientated interface

The `Analysis` class can be used to run analyses. It makes the calling the low level api binding simpler, and keeps track of the state of the analysis.

### Instantiation

The `Analysis` constructor has one required parameter, which is the url of the Diffblue Cover api.

```ts
const Analysis = require(`diffblue-cover-client-js`).analysis;
const analysis = new Analysis('https://your-cover-api-domain.com');
```

### Usage

To start an analysis, call `Analysis.start`. This has two required parameters, the path to the build jar and a
settings object. The third and fourth parameters are optional.
Passing a path to a dependencies build jar as the third parameter will enable test verification.
Passing a path to a base build jar as the fourth parameter will enable a differential analysis.

```ts
const analysis = new Analysis('https://your-cover-api-domain.com');
await analysis.start('./buildPath.jar', settings);
// => {id: 'unique-analysis-id', phases: {<computed phases>}}
```

To get the status of an analysis that has started, call `Analysis.getStatus`.

```ts
await analysis.getStatus();
// => {status: 'RUNNING', progress: {completed: 0. total: 0}}
```

To get the results (so far) of an analysis that has started, call `Analysis.getResults`.

```ts
await analysis.getResults();
// => {status: {<analysis status>}, cursor: '<pagination cursor>, results: [<result objects>]'}
```

To cancel an analysis that has started, call `Analysis.cancel`.

```ts
await analysis.cancel();
// => {status: 'CANCELLED', progress: {completed: 10. total: 10}}
```

### Result pagination

Calling `Analysis.getResults` will save the returned pagination cursor on the `Analysis` instance
and a subsequent call to `Analysis.getResults` will by default pass that cursor to the Diffblue Cover api and only return
new results generated since that cursor.
To disable the pagination behavior and fetch the full set of generated results set the fist parameter to `false`.

```ts
await analysis.getResults(false);
// => {status: {<analysis status>}, cursor: '<pagination cursor>, results: [<all result objects>]'}
```

### Lifecycle

The `Analysis` object has a number of helper methods to check the saved analysis status, as of the last
call to any method that changes or returns the current analysis status.

```ts
const analysis = new Analysis('https://your-cover-api-domain.com');
analysis.isNotStarted();
// => true
await analysis.start('./buildPath.jar', settings);
analysis.isRunning();
// => true
```

The `Analysis` object keeps track of the status of the analysis it is running, and will throw an error
if a method is called at an inappropriate time.

```ts
const analysis = new Analysis('https://your-cover-api-domain.com');
assert(analysis.isNotStarted());
analysis.getResults();
// => throws
// err.code === 'NOT_RUNNING'
await analysis.start('./buildPath.jar', settings);
assert(analysis.isRunning());
await analysis.start();
// => throws
// err.code === 'ALREADY_STARTED'
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
