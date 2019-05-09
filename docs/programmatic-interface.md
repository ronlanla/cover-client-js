# Programmatic interface

## Combining results into test classes

The `combiner` module provides methods to produce test classes from Diffblue Cover API results that can be written to a file and run.

### Generate a new test class

The `generateTestClass` function will produce a test class from an array of Diffblue Cover API results.

All off these results should relate to the same function under test, and so must all have the same `sourceFilePath` and `testedFunction` values.

In Node.js:

 ```js
const combiner = require('@diffblue/cover-client').combiner;
const results = ['<api result objects>'];
const testClass = combiner.generateTestClass(results);
```

### Merge results into an existing test class

The `mergeIntoTestClass` function can be used to generate tests from an array of Diffblue Cover API results and merge them into an existing test class.

All off these results should relate to the same function under test, and so must all have the same `sourceFilePath` and `testedFunction` values.

The existing test class should relate to the same function under test as the results.

In Node.js:

 ```js
const fs = require(fs);
const combiner = require('@diffblue/cover-client').combiner;
const results = ['<api result objects>'];
const existingTestClass = fs.readFileSync('./FooBarTest');
combiner.generateTestClass(existingTestClass, results).then((testClass) => {
  console.log(`Merged test class:\n${testClass}`);
});
```

Copyright 2019 Diffblue Limited. All Rights Reserved.
