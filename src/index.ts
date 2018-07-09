import {
  allOf,
  expected,
  error,
  flatten,
  isObjectType,
  isPlainObject,
  noExtraKeys,
  oneOf,
  replaceKey,
} from './util';
import {
  ArrayType,
  InvalidSchemaError,
  ObjectType,
  Options,
  SimpleType,
  Type,
  TypeMap,
  UnionType,
  ValidationFn,
} from './types';

// === Simple types ========================================================= //
const BUILT_INS: TypeMap = {
  boolean: _ => obj => typeof obj === 'boolean',
  number: _ => obj => typeof obj === 'number',
  string: _ => obj => typeof obj === 'string',
};

const getSimpleValidationFn = (
  key: string,
  schema: SimpleType,
  options: Options,
): ValidationFn => {
  if (schema === undefined) {
    return obj => (
      obj === undefined
        ? []
        : [expected(key, 'undefined')]
    );
  }
  if (schema === null) {
    return obj => (
      obj === null
        ? []
        : [expected(key, 'null')]
    );
  }

  if (schema instanceof RegExp) {
    return obj => {
      if (typeof obj !== 'string') return [expected(key, 'string')];
      return obj.match(schema)
        ? []
        : [error(key, `Value does not match: ${schema}`)]
    }
  }

  const union = schema.split('|');
  if (union.length !== 1) {
    return oneOf(key, union.map(s => getSimpleValidationFn(key, s, options)));
  }

  const getFn = (options.customTypes || {})[schema] || BUILT_INS[schema];
  if (!getFn) {
    throw new InvalidSchemaError(`Unknown type for ${key}: ${schema}`);
  }

  if (typeof getFn !== 'function') {
    return parseSchema(key, getFn);
  }

  const validationFn = getFn(key);
  return obj => {
    const error = validationFn(obj);
    if (typeof error === 'boolean') {
      return error
        ? []
        : [expected(key, schema)];
    }
    return error;
  };
}

function parseSchemaSimple(
  key: string,
  schemaSimple: SimpleType,
  options: Options,
): ValidationFn {
  const schema = typeof schemaSimple === 'string' && schemaSimple.endsWith('?')
    ? schemaSimple.substring(0, schemaSimple.length - 1)
    : schemaSimple;

  const fn = getSimpleValidationFn(key, schema, options);

  const allowUndefined = schema !== schemaSimple;

  return obj => (
    allowUndefined && obj === undefined
      ? []
      : fn(obj)
  );
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
      .filter(k => !OBJ_RESERVED.includes(k))
      .map(k => ({
        k,
        fn: parseSchemaAny(`${key}.${k}`, schemaObject[k], options),
      }))
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
  schemaArray: ArrayType | UnionType,
  options: Options,
): ValidationFn {
  const first = schemaArray[0];
  if (schemaArray.length === 1 && Array.isArray(first)) {
    return oneOf(key, first.map(i => parseSchemaAny(key, i, options))); // union
  }

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
  if (Array.isArray(schema)) return parseSchemaArray(key, schema, options);
  return parseSchemaSimple(key, schema, options);
}

export const parseSchema = (
  key: string,
  schema: Type,
  options = DEFAULT_OPTIONS,
) =>
  parseSchemaAny(key, schema, options);  
