# Programmatic interface

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
