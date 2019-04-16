# Code standards

## Coding style

Our code style is largely enforced by [tslint and eslint rules](./tslint.json), however there are some additional guidelines:

### Avoid side effects

Side effects can lead to more error prone and harder to test code. Functions should return values rather than relying on side effects and should take arguments rather than relying on variables in context.

### Copy rather than mutate

Functions which change data structures tend to be harder to follow, more error prone and harder to test.
Where possible, don't mutate data passed to functions, but instead make a copy of it and return that.

### Pipelines rather than loops

Prefer to use pipeline functions rather than loops, because loops tend to lead to more verbose and complicated code, with more mutations.

Pipeline functions operate on and return collections, such as `array.map`, `array.filter`, `lodash.mapValues`, `lodash.groupBy` or `lodash.omit`.

A conventional solution might use loops and incremental data structures:

```ts
interface Item {
  name: string;
  value: number;
}

async function getTotalsByName(data: Item[]) {
  const output: { [key: string]: number } = {};

  for (const item of data) {
    if (!output[item.name]) {
      output[item.name] = 0;
    }
    output[item.name] += item.value;
  }

  return output;
}
```

However, using pipeline functions like this can be much shorter with fewer intermediate variables:

```ts
import { groupBy, mapValues, sum } from 'lodash';

async function getTotalsByName(data: Item[]) {
  const dataByName = groupBy(data, (item) => item.name);
  return mapValues(dataByName, (nameData) => sum(nameData.map((item) => item.value)));
}
```

### Asynchronous code

The async/await style is preferred since it produces clearer code than promise chains or callbacks.

If a third party library uses callbacks, they should be converted to a promise before being used:

```ts
import * as request from 'request';
import { promisify } from 'util';
const post = promisify(request.post);
```

`promisify` may not work correctly if the library requires the correct _context_ to work. In this case you can bind the method to its object:

```ts
import * as request from 'request';
import { promisify } from 'util';
const post = promisify(request.post.bind(request));
```

A function which returns a promise from another function should still be marked as async for clarity:

```ts
async function getPromise() {
  return Promise.resolve();
}
```

There are some cases where an inline catch can be used to provide a default value succinctly:

```ts
async function getValue() {
  return Promise.resolve([0, 1]).catch(() => []);
}
```

When dealing with streams, the `end-of-stream` package can help to interface streams with promises. The following function will take a stream and return a promise when the stream ends:

```ts
import * as endOfStream from 'end-of-stream';
import { Readable, Writable } from 'stream';
import { promisify } from 'util';

export async function onStreamEnd(stream: Writable | Readable) {
  return promisify(endOfStream)(stream);
}
```

### Consistent indentation

Indenting should be meaningful, predictable and simple to write. Inner syntactic elements should be indented by one level (2 spaces) deeper than their parent element, while the parent element delimiters should be indented the same as the parent element. By convention the start delimiter should not be on its own line e.g:

```ts
if (value) {
  return 1;
}
```

All inner syntactic elements either be inline or each indented on their own line:

```ts
const value = [a, b, c];
// or
const value = [
  a, b, c,
];
// or
const value = [
  a,
  b,
  c,
];
```

If you want to split an operator which doesn't have delimiters over multiple lines, you can use brackets to do this:

```ts
const bounded = (
  value > max ?
  max :
  value
);
```

Method chains are not inner syntactic elements, and so should not be indented:

```ts
const size = 10;
const chance = 0.5;
const matches = new Array(size)
.fill()
.map(Math.random)
.filter((value) => value > chance);
```

### Syntactic decoupling

When refactoring you shouldn't have to change unrelated code. Therefore lines which are functionally decoupled should be syntactically decoupled, where possible. For example trailing commas make this possible for array items, parameters, arguments, and key/value pairs:

```ts
const list = [
  a,
  b,
  c,
];
```

However, with operators, this is not always possible:

```ts
const value = (
  'foo\n' +
  'bar\n' +
  'zim'
);
```

Some cases can be improved by using arrays and array operations:

```ts
const value = [
  'foo',
  'bar',
  'zim',
].join('\n');
```

## File naming

Typescript file names should be the same as their default export.
For example `leftPad.ts`.

```ts
export default leftPad;
```

Other files should use kebab case e.g. `file-name.md`, except where there are existing naming conventions, such as `README.md`.

## Branches

All branches should be have one of the following prefixes:
- `feature/` - A new feature being added
- `bugfix/` - A bug being fixed
- `code-quality/` - An improvement in code quality, such as tests or refactoring
- `prototype/` - A prototype, not intended to be merged

## Code documentation

All classes and functions should have docblock style comment explaining their purpose (and usage if not obvious) e.g:

```ts
/** Pads a string to the left with spaces to ensure its length is at least `length` */
export function padLeft(text: string, length: number) {
  ...
}
```

or

```ts
/**
 * Pads a string to the left with spaces to ensure its length is at least `length`
 * Optionally takes a character to use when padding, defaults to space
 */
export function padLeft(text: string, length: number, character = ' ') {
  ...
}
```

Additional docblock parameters, such as arguments and return values are not necessary because these are tracked by Typescript.
