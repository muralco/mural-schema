MURAL schema (internals)
========================

## Summary

This document describes the different components of MURAL schema. Most of this
stuff is not part of the public API and subject to change. Take this information
with a pinch of salt.

As a MURAL schema _user_ you can safely ignore this. This document is intended
at people wanting to understand the inner workings of MURAL schema and possible
contribute with PRs.

## Design goals
- Zero runtime dependencies.
- Users must be able to define a full schema using plain JSON. No need to
  `import`/`require` `mural-schema` in order to _define_ the schema.
- Schema definitions should be as succinct as possible. In some cases we are
  willing to sacrifice expressive power to get simpler schema definitions.
- A schema definition is data. This means that it is is plain JSON, and must be
  serializable. It cannot contain functions or other invalid JSON elements.

Note that these design goals set MURAL schema apart from other schema validation
libraries and languages such as [Joi](https://github.com/hapijs/joi) and
[JSON schema](https://json-schema.org/).

In most cases you can overcome apparent limitations in MURAL schema's definition
language using [Custom types](README.md#custom-types).

## Processing model

```
+--------+            +-----+              +--------------+
| Schema | --parse--> | AST | --compile--> | ValidationFn |
+--------+            +-----+              +--------------+
```

In order to validate an object against a schema the first step is to compile
that schema into a validation function:

```ts
import { parseSchema } from 'mural-schema';

const validate = parseSchema(schema, options);
```

This validation function takes an object and returns zero or more validation
errors:

```ts
type ValidationFn = (obj: any) => ValidationError[]
```

Generating a validation function from a schema is a two-step process. We first
`parse` the schema into an AST and then we `compile` the AST into a validation
function.

The whole AST abstraction presents some interesting options. Here is the full
processing model, including advanced tooling regular MURAL schema users might
not use:

```
+--------+                                          +--------------+
| Schema | ---parse---\                /-compile--> | ValidationFn |
+--------+             |    +-----+   |             +--------------+
                       +--> | AST | --+
+---------+            |    +-----+   |             +--------+
| TS Type | --from-ts-/                \--print---> | Schema |
+---------+                                         +--------+
```

There are many sources of AST, the most obvious is a `schema` written in JSON,
but an alternative is to read a Typescript type definition.

Likewise, there are many things we can to with an AST, again the most obvious is
to compile it into a validation function, but an alternative is to print it into
a `schema` in MURAL schema's JSON language.

## Extending MURAL schema by example

Lets say that we want to add a new `+` suffix to object keys, so that when the
value is an array, it must have at least one element as in:

```json
{
  "items+": ["string"]
}
```

First, lets start with some tests, to spec what we want to achieve. We are
adding a new capability to `object` types, so lets add the tests in
[features/object.feature](features/object.feature):

```gherkin
# === Non-empty Array ======================================================== #

Scenario: success non-empty array
  Given a schema { "key+": ["number"] }
  When validating { "key": [1] }
  Then the validation passes

Scenario: error empty non-empty array
  Given a schema { "key+": ["number"] }
  When validating { "key": [] }
  Then the validation error is "Expected an array with at least 1 element" at ["key"]

Scenario: error non-empty array (invalid type)
  Given a schema { "key+": ["number"] }
  When validating { "key": [true] }
  Then the validation error is "Expected number" at ["key", 0]
```

Then we need to extend the `AST` to model the new validation we want to
implement in [src/ast.ts](src/ast.ts):

```diff
 export interface ArrayAst extends BaseAst {
   type: 'array';
   item: Ast;
+  min: number | undefined;
 }
```

Note that we intentionally chose to break the `ArrayAst` type by defining `min`
as `number | undefined` instead of using something like `min?: number`. We did
that so that the compiler would complain and hint us as to where we need to
change stuff.

Now we need to make the compiler happy by extending the two parsers (from schema
and from TS).

Lets fix [src/parse.ts](src/parse.ts) first:

```diff
 const KEY_MODS = [
   ':keyof', // keyof
   '//?', // partial (/) and recursive partial (//),
   '\\?', // optional
+  '\\+', // non-empty array
 ];

// ...

 function parseObjectProperty(
   schema: Type,
   options: ParseOptions,
 ): ObjectPropertyAst {
  const {
    actualKey,
    isKeyOf,
+   isNonEmpty,
    isOptional,
    isPartial,
  } = getKeyMods(key);

// ...

+  if (isNonEmpty) {
+    if (ast.type !== 'array') {
+      throw new InvalidSchemaError(
+        `Non-empty key modifiers can only be used with array values. Key \`${
+          fullKey
+        }\` maps to a value of type \`${schema}\` (AST=${ast.type})`,
+      );
+    }
+    ast = {
+      ...ast,
+      min: 1,
+    };
+  }
+

// ...

 function parseArray(
   return {
     item,
     key,
+    min: undefined,
     type: 'array',
   };
 }

```

For now we will not implement support for bounded arrays in TS, so lets "fix"
[src/from-ts/parse-to-ast.ts](src/from-ts/parse-to-ast.ts):

```diff
 const generateArray = (
 ): ArrayAst => ({
   item: generateType(type.elementType, options),
   key: [],
+  min: undefined,
   type: 'array',
 });
```

Now everything is compiling again, but we are not really using `min` for
anything, and as a result, our tests are not passing.

If you recall the [processing model](#processing-model), you'll realize that we
just completed the _parse_ part of the flow, but we are missing the _compile_
one.

Let's tackle that next, in [src/compile.ts](src/compile.ts):

```diff
 function compileArray(ast: ArrayAst): ValidationFn {

   return (obj) => {
     if (!Array.isArray(obj)) return [expected(ast.key, 'array')];
+
+    if (ast.min !== undefined && obj.length < ast.min) {
+      return [expected(ast.key, `an array with at least ${
+        ast.min === 1
+          ? '1 element'
+          : `${ast.min} elements`
+      }`)];
+    }
+
```

And that's enough to get our tests to pass, you can check that yourself with:

```sh
npm run test
```

But we are missing one use-case, that is printing back an AST as a schema. For
that lets make the final edit to [src/print.ts](src/print.ts):

```diff
 const getObjectKeySuffix = (ast: Ast): { suffix: string, valueAst: Ast } => {

// ...

   if (ast.type === 'array' && ast.item.type === 'function') {
     return {
-      suffix: FN_SUFFIX[ast.item.key.join('.')] || '',
+      suffix: `${FN_SUFFIX[ast.item.key.join('.')] || ''}${
+        ast.min === 1
+          ? '+'
+          : ''
+      }`,
       valueAst: ast,
     };
   }
+
+  if (ast.type === 'array' && ast.min === 1) {
+    return {
+      suffix: '+',
+      valueAst: ast,
+    };
+  }
```

As of this writing there is no test to check the result of printing an AST, but
you can still verify that this works with the following piece of insanity:

```sh
echo "
import { parse } from './src/parse';
import { print } from './src/print';

const x = {
  'key+': ['number'],
};

console.log(print([parse([], x, {})].map(p => ({ ...p, key: ['x'] })), { useExport: true }).trim())
" | ./node_modules/.bin/ts-node
```

that yields:

```ts
export const x = {
  'key+': ['number'],
};
```
