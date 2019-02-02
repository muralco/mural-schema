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

export const isPlainObject = (o: any): boolean =>
  o != null
  && typeof o === 'object'
  && !Array.isArray(o)
  && !(o instanceof RegExp);

export const isObjectType = (o: Type): o is ObjectType =>
  isPlainObject(o);

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

// === Validators and combinators =========================================== //

// Returns a validation function that fails if every function in `validationFns`
// fails.
export const oneOf = (
  key: Key,
  validationFns: ValidationFn[],
): ValidationFn =>
  (obj) => {
    const errors = validationFns.map(fn => fn(obj));

    // At least one fn matches the type and value
    const ok = errors.find(es => es.length === 0);
    if (ok) return [];

    // At least one fn matched the type (i.e. no `expected` error or an expected
    // error for a different key) but the value had errors
    const skey = key.join('.');
    const matchType = errors
      .find(es => es.every(e => !e.expected || e.key.join('.') !== skey));
    if (matchType) return matchType;

    // No function managed to match the type
    const invalid = flatten(errors).map(e => e.expected).filter(e => !!e);
    return [expected(key, invalid.join(', '))];
  };

export const allOf = (validationFns: ValidationFn[]): ValidationFn =>
  obj => flatten(validationFns.map(fn => fn(obj)));

// Fails with one error for each key in `obj` that is not present in `keys`.
export const noExtraKeys = (baseKey: Key, keys: string[]): ValidationFn =>
  obj =>
    difference(Object.keys(obj), keys)
      .map(k => error([...baseKey, k], 'Unexpected key'));

export const valueIs = (
  key: Key,
  expectedValue: any,
  name: string,
): ValidationFn =>
  obj =>
    obj === expectedValue
      ? []
      : [expected(key, name)];
