import {
  allOf,
  expected,
  error,
  flatten,
  isObjectType,
  isPlainObject,
  noExtraKeys,
  oneOf,
  optional,
  replaceKey,
  valueIs,
  isUnionType,
} from './util';
import {
  ArrayType,
  InvalidSchemaError,
  ObjectType,
  Options,
  Type,
  TypeMap,
  ValidationFn,
  FunctionType,
} from './types';

// === Simple types ========================================================= //
const parseSchemaRegExp = (
  key: string,
  schema: RegExp,
): ValidationFn =>
  (obj) => {
    if (typeof obj !== 'string') return [expected(key, 'string')];
    return obj.match(schema)
      ? []
      : [error(key, `Value does not match: ${schema}`)];
  };

const parseSchemaUnion = (
  key: string,
  schemas: Type[],
  options: Options,
): ValidationFn =>
  oneOf(key, schemas.map(s => parseSchemaAny(key, s, options)));

const parseSchemaFunction = (
  key: string,
  schemaFunction: FunctionType,
  name: string,
): ValidationFn => {
  return (obj) => {
    const error = schemaFunction(obj);
    if (typeof error === 'boolean') {
      return error
        ? []
        : [expected(key, name)];
    }
    return error;
  };
};

const BUILT_INS: TypeMap = {
  boolean: obj => typeof obj === 'boolean',
  number: obj => typeof obj === 'number',
  string: obj => typeof obj === 'string',
};

function parseSchemaString(
  key: string,
  schemaString: string,
  options: Options,
): ValidationFn {
  const union = schemaString.split('|');
  if (union.length !== 1) return parseSchemaUnion(key, union, options);

  const allowUndefined = schemaString.endsWith('?');
  const schema = allowUndefined
    ? schemaString.substring(0, schemaString.length - 1)
    : schemaString;

  const custom = (options.customTypes || {})[schema] || BUILT_INS[schema];
  if (!custom) {
    throw new InvalidSchemaError(`Unknown type for ${key}: ${schema}`);
  }

  const fn = (typeof custom !== 'function')
    ? parseSchema(key, custom)
    : parseSchemaFunction(key, custom, schema);

  return allowUndefined
    ? optional(fn)
    : fn;
}

// === Object types ========================================================= //
const OBJ_RESERVED = ['$strict'];

function parseSchemaObject(
  key: string,
  schemaObject: ObjectType,
  options: Options,
): ValidationFn {
  const schemaKeys = Object.keys(schemaObject);

  const fns: ValidationFn[] = [
    ...schemaKeys
      // Remove reserved keys from the schema
      .filter(k => !OBJ_RESERVED.includes(k))
      // Map each key into a { k, fn } object where `k` is the subkey and `fn`
      // is the parsed schema validator for that key's value
      .map(k => ({
        k,
        fn: parseSchemaAny(`${key}.${k}`, schemaObject[k], options),
      }))
      // Map each { k, fn } object into a validation function by calling `fn`
      // passing the `obj[k]` value.
      .map(i => (obj: any) => i.fn(obj[i.k])),
  ];

  if ((schemaObject as any).$strict !== false) {
    fns.push(noExtraKeys(key, schemaKeys));
  }

  const fn = allOf(fns);

  return obj =>
    isPlainObject(obj)
      ? fn(obj)
      : [expected(key, 'object')];
}

// === Array types ========================================================== //
function parseSchemaArray(
  key: string,
  schemaArray: ArrayType,
  options: Options,
): ValidationFn {
  // Array of alternative types (e.g. string or object). Every item in the array
  // must match with at least one of the types.
  const fn = oneOf(
    key,
    (schemaArray as ArrayType)
      .map(schema => parseSchemaAny(key, schema, options)),
  );

  return (obj) => {
    if (!Array.isArray(obj)) return [expected(key, 'array')];
    const errors = obj.map((v, i) => fn(v).map(replaceKey(key, `${key}.${i}`)));
    return flatten(errors);
  };
}

// === Global =============================================================== //
const DEFAULT_OPTIONS: Options = {};

function parseSchemaAny(
  key: string,
  schema: Type,
  options: Options,
): ValidationFn {
  if (isObjectType(schema)) return parseSchemaObject(key, schema, options);
  if (isUnionType(schema)) return parseSchemaUnion(key, schema[0], options);
  if (Array.isArray(schema)) return parseSchemaArray(key, schema, options);
  if (schema === undefined) return valueIs(key, undefined, 'undefined');
  if (schema === null) return valueIs(key, null, 'null');
  if (schema instanceof RegExp) return parseSchemaRegExp(key, schema);
  if (typeof schema === 'string') {
    return parseSchemaString(key, schema, options);
  }
  return parseSchemaFunction(key, schema, schema.name || 'custom value');
}

export const parseSchema = (
  key: string,
  schema: Type,
  options = DEFAULT_OPTIONS,
) =>
  parseSchemaAny(key, schema, options);
