import {
  Key,
  ObjectType,
  Type,
  UnionType,
  ValidationError,
  ValidationFn,
} from './types';

// === General purpose utils ================================================ //
export const flatten = <T>(arr: T[][]): T[] => ([] as T[]).concat(...arr);

const difference = (xs: string[], ys: string[]): string[] =>
  xs.filter(x => !ys.includes(x));

export const isPlainObject = (o: unknown): o is object =>
  o != null &&
  typeof o === 'object' &&
  !Array.isArray(o) &&
  !(o instanceof RegExp);

export const isObjectType = (o: Type): o is ObjectType => isPlainObject(o);

export const isUnionType = (o: Type): o is UnionType =>
  Array.isArray(o) && o.length === 1 && Array.isArray(o[0]);

// === Errors =============================================================== //
export const error = (key: Key, message: string): ValidationError => ({
  key,
  message,
});

export const expected = (key: Key, what: string): ValidationError => ({
  expected: what,
  key,
  message: `Expected ${what}`,
});

const leastErrors = ([head, ...tail]: ValidationError[][]): ValidationError[] =>
  tail.reduce((a, b) => (a.length <= b.length ? a : b), head);

const objMatchesUnionElement = (key: string) => (
  es: ValidationError[],
): boolean =>
  es.every(
    e =>
      // is not a type error (e.g. string does not match regex)
      !e.expected ||
      // the error is not for the main union, is for a prop inside the union
      // element (i.e. we are not complaining that `obj` is not an `object`, we
      // are complaining that a prop _inside_ `obj` does not match).
      e.key.join('.') !== key,
  );

type OneOfValidationResult = true | ValidationError[][];

const validateOneOf = (
  validationFns: ValidationFn[],
  obj: unknown,
): OneOfValidationResult =>
  validationFns.reduce((acc, fn) => {
    if (acc === true) return acc;

    const errors = fn(obj);
    if (!errors.length) return true;
    acc.push(errors);
    return acc;
  }, [] as OneOfValidationResult);

// === Validators and combinators =========================================== //

// Returns a validation function that fails if every function in `validationFns`
// fails.
export const oneOf = (
  key: Key,
  validationFns: ValidationFn[],
): ValidationFn => obj => {
  const result = validateOneOf(validationFns, obj);

  // At least one fn matches the type and value
  if (result === true) return [];

  const errors = result;

  // At least one fn matched the type (i.e. no `expected` error or an expected
  // error for a different key) but the value had errors.
  //
  // Imagine we have a union of `number | { a: string }` when we validate a
  // `{ b: 1 }` we can assume the intention was to present us with an object,
  // not a `number` so we should show the errors for the second element in the
  // union (i.e. `{ a: string }`).
  //
  // We know the value `obj` matches the type of an element in the union
  // because the errors we get for that element do not include an `expected`
  // error for the union key (i.e. `key.join('.')`).
  //
  const stringKey = key.join('.');
  const matchTypes = errors.filter(objMatchesUnionElement(stringKey));
  if (matchTypes.length) return leastErrors(matchTypes);

  // No function managed to match the type
  const invalid = flatten(errors)
    .map(e => e.expected)
    .filter(e => !!e);
  return [expected(key, invalid.join(', '))];
};

export const allOf = (validationFns: ValidationFn[]): ValidationFn => obj =>
  flatten(validationFns.map(fn => fn(obj)));

export const getKeys = <T extends object>(o: T) =>
  Object.keys(o) as (keyof T)[];

// Fails with one error for each key in `obj` that is not present in `keys`.
export const noExtraKeys = (
  baseKey: Key,
  keys: string[],
): ValidationFn => obj =>
  obj && typeof obj === 'object'
    ? difference(getKeys(obj), keys).map(k =>
        error([...baseKey, k], 'Unexpected key'),
      )
    : [error([...baseKey], 'Internal error')];

export const valueIs = (
  key: Key,
  expectedValue: unknown,
  name: string,
): ValidationFn => obj => (obj === expectedValue ? [] : [expected(key, name)]);
