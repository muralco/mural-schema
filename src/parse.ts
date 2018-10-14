import {
  ArrayAst,
  Ast,
  FunctionAst,
  LiteralAst,
  ObjectAst,
  ObjectPropertyAst,
  RegExpAst,
  UnionAst,
  ValueAst,
} from './ast';
import builtIns from './built-ins';
import {
  ArrayType,
  FunctionType,
  InvalidSchemaError,
  Key,
  ObjectType,
  ParseOptions,
  Type,
} from './types';
import {
  expected,
  isObjectType,
  isUnionType,
} from './util';

const parseRegExp = (
  key: Key,
  schema: RegExp,
): RegExpAst => ({
  key,
  type:  'regexp',
  value: schema,
});

const parseValue = <T>(
  key: Key,
  value: T,
  name: string,
): ValueAst<T> => ({
  key,
  name,
  type: 'value',
  value,
});

const parseUnion = (
  key: Key,
  schemas: Type[],
  options: ParseOptions,
): UnionAst => ({
  items: schemas.map(s => parse(key, s, options)),
  key,
  type: 'union',
});

const parseFunction = (
  key: Key,
  schemaFunction: FunctionType,
  name: string,
): FunctionAst => ({
  fn: (obj) => {
    const error = schemaFunction(obj);
    if (typeof error === 'boolean') {
      return error
      ? []
      : [expected(key, name)];
    }
    return error;
  },
  key,
  name,
  type: 'function',
});

const parseLiteral = (
  key: Key,
  schemaLiteral: number | boolean,
): LiteralAst => ({
  key,
  type: 'literal',
  value: schemaLiteral,
});

const makeOptional = (
  key: Key,
  ast: Ast,
): UnionAst => ({
  items: [ast, parseValue(key, undefined, 'undefined')],
  key,
  type: 'union',
});

const startsAndEndsWith = (s: string, delim: string): boolean =>
  s.startsWith(delim) && s.endsWith(delim);

function parseTypeName(
  key: Key,
  schemaString: string,
  options: ParseOptions,
): Ast {
  const union = schemaString.split('|');
  if (union.length !== 1) return parseUnion(key, union, options);

  const allowUndefined = schemaString.endsWith('?');
  const schema = allowUndefined
    ? schemaString.substring(0, schemaString.length - 1)
    : schemaString;

  if (schema.startsWith('#')) {
    return {
      key,
      type: 'literal',
      value: schema.substring(1),
    };
  }

  if (startsAndEndsWith(schema, '"')
    || startsAndEndsWith(schema, '\'')
    || startsAndEndsWith(schema, '`')
  ) {
    return {
      key,
      type: 'literal',
      value: schema.substring(1, schema.length - 1),
    };
  }

  const custom = (options.customTypes || {})[schema] || builtIns[schema];
  if (!custom) {
    throw new InvalidSchemaError(`Unknown type for ${key}: ${schema}`);
  }

  const ast = (typeof custom !== 'function')
    ? parse(key, custom, options)
    : parseFunction(key, custom, schema);

  return allowUndefined
    ? makeOptional(key, ast)
    : ast;
}

// === Object types ========================================================= //
const OBJ_RESERVED = ['$strict'];

function parseMakeOptional(
  parentKey: Key,
  key: string,
  schema: Type,
  options: ParseOptions,
): ObjectPropertyAst {
  const isOptional = key.endsWith('?');
  const actualKey = isOptional
    ? key.substring(0, key.length - 1)
    : key;

  const fullKey = [...parentKey, actualKey];

  const ast = parse(fullKey, schema, options);
  return {
    ast: isOptional
      ? makeOptional(fullKey, ast)
      : ast,
    key: fullKey,
    objectKey: actualKey,
  };
}

function parseObject(
  key: Key,
  schemaObject: ObjectType,
  options: ParseOptions,
): ObjectAst {
  const schemaKeys = Object
    .keys(schemaObject)
    .filter(k => !OBJ_RESERVED.includes(k));

  return {
    key,
    properties: schemaKeys
      .map(k => parseMakeOptional(key, k, schemaObject[k], options)),
    strict: (schemaObject as any).$strict !== false,
    type: 'object',
  };
}

// === Array types ========================================================== //
function parseArray(
  key: Key,
  schemaArray: ArrayType,
  options: ParseOptions,
): ArrayAst {

  const item = schemaArray.length === 1
    ? parse(key, schemaArray[0], options)
    : parseUnion(key, schemaArray, options);

  return {
    item,
    key,
    type: 'array',
  };
}

// === Global =============================================================== //
export function parse(
  key: Key,
  schema: Type,
  options: ParseOptions,
): Ast {
  if (isObjectType(schema)) return parseObject(key, schema, options);
  if (isUnionType(schema)) return parseUnion(key, schema[0], options);
  if (Array.isArray(schema)) return parseArray(key, schema, options);
  if (schema === undefined) return parseValue(key, undefined, 'undefined');
  if (schema === null) return parseValue(key, null, 'null');
  if (schema instanceof RegExp) return parseRegExp(key, schema);
  if (typeof schema === 'string') return parseTypeName(key, schema, options);
  if (typeof schema === 'number' || typeof schema === 'boolean') {
    return parseLiteral(key, schema);
  }
  return parseFunction(key, schema, schema.name || 'custom value');
}
