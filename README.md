MURAL schema
============

## Summary

MURAL schema is a simple way of validating JSON objects, using pure JSON objects
without all the clutter of JSON Schema.

## Installation

```sh
npm i mural-schema
```

## Descirption

In the context of MURAL schema a _type_ can be any of the following:

- built-ins:
  - `string`
  - `boolean`
  - `number`
  - `undefined`
  - `null`
- `RegExp`
- an object mapping keys to other _types_ (e.g. `{ "a": "string" }`).
- an array of _types_
- a union of _types_
- a literal _type_
- a validation function
- a custom _type_
- optional _types_
- partial and recursive partial _types_
- _keyof types_

We'll talk about each of these in the next sections.

## Usage
```ts
import { parseSchema } from 'mural-schema';

const schema = // define the schema
const options = {}; // you can omit this argument

const validate = parseSchema(schema, options);

// do note that `parseSchema` will throw if `schema` is invalid
// (e.g. it references unknown types)

const input = // some input

const errors = validate(input);

if (!errors.length) {
  // success
} else {
  // failure
}
```

## Built-ins

> `'string'`, `'boolean'`, `'number'`, `undefined`, `null`, `any`

To represent a built-in, just use the string name of the type in the schema.

For example:
```js
// a string
'string'

// an object whose `s` key must be a string
{ s: 'string' } 

// a boolean
'boolean'

// a number
'number'

// undefined
undefined

// null
null

// anything
'any'
```

## RegExp

> `/^\d{3}-\d{5}$/`

When the schema's type is a RegExp, the value must be a string that matches that
RegExp.

> Note: consider using anchors in the RegExp (e.g. `/\A...\z/` or `/^...$/`) to
avoid unexpected values

For example:
```js
// a string containing at least one number
/\d+/

// exactly the same as above
/\d/

// what you probably meant with the two previous ones (as string
// containing at least one number and only numbers)
/^\d+$/ 
```

## Objects

> `{ key1: Type, key2: Type, ..., [$strict: false], $any: Type }`

A schema type can be an object with arbitrary keys and _types_ in the values.

Since any _type_ is allowed in the object's value, nested objects can be modeled
by nesting object schemas.

> Note: the special key/value `$strict: false` can be specified in object
schemas to allow extra keys to be present in the input object. By default the
input object cannot have any unknown key.

Sometimes an object type has random key names but a specific known value for
each key. This scenario can be modelled using the `$any` key name which
matches any key in the object and asserts the value of _every_ key in the
object.

For example:
```js
// an object whose `s` key must be a string
// Note: when validating { s: 'a', other: 1 } the validation fails
{ s: 'string' }

// an object whose `s` key must be a string, and can have any other
// keys/values
// Note: when validating { s: 'a', other: 1 } the validation passes
{ s: 'string', $strict: false } 

// an object with a `child` object containing a number in `a`
{ child: { a: 'number' } }

// an dictionary object where keys can be string but their values must be
// numbers
{ $any: 'number' }

// idem, but this time, the values are persons
{ $any: { firstName: 'string', lastName: 'string' }
```

## Arrays

> `[Type]` or `[Type1, Type2, ...]`

A schema type can be an array _types_.

When the schema array contains a single _type_, every element in the input array
must match this _type_ (i.e. homogeneous array).

When the schema array contains multiple _types_, the element in the input array
can be of _any_ of the array types (i.e. heterogeneous array).

For example:
```js
// an array of numbers (e.g. [1, 2, 3, 4])
['number']

// an array of numbers or strings (e.g. [1, 'two', 3, 4])
['number', 'string']
```

## Union types

> `'string|number|MyCustomType'` or `[['boolean', { a: 'string' }, OtherType]]`

Union schema types are the type-equivalents of the `OR` operator. A _union type_
is a set of _types_. The input value must match at least one of the _types_
included in the _union type_.

There are two flavours for _union types_: _string unions_ and _array unions_.

String unions can be used only with string types (i.e. built-ins and custom
types).

Array unions are a generalization of the above that can be used with any set of
_types_, at the expense of some syntactic noise. Unlike string unions, array
unions can also be used with objects, functions, RegExps, etc.


For example:
```js
// a number or string (string union)
'number|string'

// same as above (array union)
[['number', 'string']]

// a number or an object with a `name` string and `value` number
[['number', { name: 'string', value: 'number' }]]
```

## Literal type

> `1`, `false`, `'"good"'`, `"'good'"`, ``'`good`'``, `'#good'`,
`'#red|#green'`, etc.

A _literal type_ is a schema _type_ defined by a single specific value. The
input value must have the exact value defined by the _literal type_. 

> Note: _string literals_ can either be quoted with `"`, `'` or `` ` ``, or
prefixed with a `#` to distinguish them from built-in and custom types (e.g.
`'"number"'`, `"'number'"`, ``'`number`'`` and `'#number'` represent the
constant value _number_, while `'number'` represents a numeric value).

> Note: when combining _literal types_ with a _union type_ you can create an
_enumeration type_, that is, a _type_ that describes an input value that must
be one of a pre-defined set of values.

For example:
```js
// a constant value 1
1

// a constant string 'good' (all examples below are interchangeable)
'"good"'
"'good'"
'`good`'
'#good'

// a value that must be either 'red' or 'green' (enumeration type)
'#red|#green'
```

## Validation function

> `(obj: any) => boolean` or `(obj: any) => ValidationError[]`

A function schema _type_ is a function that takes the input values and returns
either a _boolean_ (i.e. `true` for success, `false` for failure), or an array
of validation errors (i.e. empty array for success).

For example:
```js
// crude email validation
obj => typeof obj === 'string' && obj.includes('@')

// shout validation with custom error message
import { expected, error } from 'mural-schema/util';
obj => {
  if (typeof obj !== 'string') return [expected('', 'string')];
  return obj.endsWith('!')
    ? [] // success
    : [error('', 'Expected a shout with trailing `!`')];
};
```

## Custom types

> `options: { customTypes: { name: Type, ... } }`

You can register _custom types_ to be used for schema validation. Custom _types_
are actually aliases for other types.

Custom types are passed as part of the `options` argument to `parseSchema`.

For example:
```js
const options = {
  customTypes: {
    email: obj => typeof obj === 'string' && obj.includes('@'),
  },
};

const schema = { billingEmail: 'email' };

const fn = parseSchema('body', schema, options);

const errors = fn({ billingEmail: 'not an email' });
// errors = [{ message: 'Expected email', key: 'body.billingEmail' }]
```

## Optional types

> `'string?'`, `'MyCustomType?'` or `[[Type, undefined]]`

Optional types are _types_ whose value can also be `undefined`. There are three
flavours of _optional types_: _optional object keys_, _optional strings_ and
_optional unions_`.

Optional object keys are the most frequent optional type, and likely the only
one you'll ever need. Given an object type `{ "key": Type }` you can make `key`
optional by appending a `?` like: `{ "key?": Type }`.

Given a string type `T` (e.g. `number`), you can always make it optional by
appending a `?` to the type (e.g. `number?`).

For complex types (e.g. objects, arrays, functions, etc.) you can simulate an
optional type `T` as a union of `T` and `undefined`. 

For example:
```js
// some optional object keys
{
  // see the `?` suffix in the key
  'objectKeyOptional?': 'string',

  // same but with the `?` suffix in the value
  'stringTypeOptional': 'string?',

  // the nice thing about putting the `?` in the keys is that it allow complex
  // optionals that not just type name strings, such as children schemas:
  'superComplexOptional?': { a: 'string' },
}

// an optional string
'string?'

// an optional custom type (assuming { email: obj => ... })
'email?'

// an optional object type using union syntax
[[{ name: 'string' }, undefined]]
```

## Partial types

> `{ 'key/': { a: 'string' } }`, `{ 'key//': { a: { b: 'string' } } }`

Partial types are _types_ whose value must be a subset of an object. The partial
key modifier `/` marks the value of that key as a shallow partial object. That
is, the value can contain zero or more of the object properties. The recursive
partial key modifier `//` applies the partial operator recursively to all
descendant keys of type object.

Note that if combined with the optional key modifier `?`, the partial modifier
should always precede the optional modifier as in `/?` or `//?`.

For example:
```js
// some partial object keys
{
  // see the `/` suffix in the key
  'obj/': {
    a: 'string',
    b: 'string',
  },
}

// accepts `{ obj: { a: '!' } }`

{
  // recursive partial, see the `//` suffix
  'obj//': {
    a: {
      b: 'string',
      c: 'string',
    },
    d: 'string',
  },
}

// accepts `{ obj: { a: { b: '!' } } }`

// partial optional
{
  // see the `/?` suffix in the key
  'obj/?': {
    a: 'string',
    b: 'string',
  },
}

// accepts `{}`, `{ obj: {} }`, etc.
```

## Keyof types

> `{ 'key:keyof': { a: 'string' } }`, `{ $keyof: { a: 'string' } }`

_Keyof_ types are _types_ whose value must be the name of an object property.

Lets say we have an object type `A` that defines properties `a` and `b` (their
types are not relevant to this description). The type of the key _names_ of `A`
would be `'"a" | "b"'`. If we wanted a type `KA` that represents the name of a
key of `A` we could just write:

```js
const KA = '"a"|"b"';
```

...but if we later add a new key to `A` that `KA` would be out of sync. In order
to avoid all this trouble, you could just write:

```js
const KA = { $keyof: A };
```

If you are putting this _keyof_ as the value of an object's property, that is:

```js
const SomeObject = {
  aKeyOfA: { $keyof: A },
};
```

...you could also opt for using the `:keyof` suffix like this:


```js
const SomeObject = {
  'aKeyOfA:keyof': A,
};
```

For example:
```js
const A = { a: 'string', b: 'string' };

const KA = { $keyof: A }; // accepts `'a'` and  `'b'`, rejects everything else

// Note that the following are equivalent
const SomeObject1 = {
  'aKeyOfA:keyof': A,
};

const SomeObject2 = {
  aKeyOfA: { $keyof: A },
};

const SomeObject3 = {
  aKeyOfA: '"a"|"b"',
}

// they all accept `{ aKeyOfA: 'a' }` and  `{ aKeyOfA: 'b' }`
// and reject everything else

// A more contrived example

const ArrayOfKeysOfA = [{ $keyof: A }]; // a list of keys of A

// accepts `[]`, `['a']`, `['b']`, `['a', 'b']`, `['a','a','a']`, etc.
// rejects `['c']`
```

## EBNF

Finally, if you enjoy formal violence, here is a _sort-of-EBNF_ summarizing most
of the above.

```ebnf
Type         = Scalar | Array | Union | Function;
Scalar       = Object | Simple;
Object       = '{' , KeyValue , {',' , KeyValue} , '}';
KeyValue     = Key , ':' , Type;
Key          = string , { ':keyof' } , { '/' , { '/' } }, { '?' } | '$any'
Simple       = string | RegExp | undefined | null;
Array        = '[' , Type , {',' , Type} , ']';
Union        = StringUnion | ArrayUnion;
StringUnion  = string , {'|' , string};
ArrayUnion   = '[[' , Type , {',' , Type} , ']]';
Function     = ValidationFn | CheckFn;
ValidationFn = '(obj: any) => ValidationError[]';
CheckFn      = '(obj: any) => boolean';
```