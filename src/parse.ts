import {
  ArrayAst,
  Ast,
  FunctionAst,
  ObjectAst,
  RegExpAst,
  UnionAst,
  ValueAst,
  LiteralAst,
} from './ast';
import {
  expected,
  isObjectType,
  isUnionType,
} from './util';
import {
  ArrayType,
  InvalidSchemaError,
  ObjectType,
  Options,
  Type,
  TypeMap,
  FunctionType,
} from './types';

const parseRegExp = (
  key: string,
  schema: RegExp,
): RegExpAst => ({
  key,
  value: schema,
  type:  'regexp',
});

const parseValue = <T>(
  key: string,
  value: T,
  name: string,
): ValueAst<T> => ({
  key,
  name,
  value,
  type: 'value',
});

const parseUnion = (
  key: string,
  schemas: Type[],
  options: Options,
): UnionAst => ({
  key,
  type: 'union',
  items: schemas.map(s => parse(key, s, options)),
});

const parseFunction = (
  key: string,
  schemaFunction: FunctionType,
  name: string,
): FunctionAst => ({
  key,
  name,
  type: 'function',
  fn: (obj) => {
    const error = schemaFunction(obj);
    if (typeof error === 'boolean') {
      return error
        ? []
        : [expected(key, name)];
    }
    return error;
  },
});

const parseLiteral = (
  key: string,
  schemaLiteral: number | boolean,
): LiteralAst => ({
  key,
  type: 'literal',
  value: schemaLiteral,
});

const BUILT_INS: TypeMap = {
  boolean: obj => typeof obj === 'boolean',
  number: obj => typeof obj === 'number',
  string: obj => typeof obj === 'string',
};

function parseTypeName(
  key: string,
  schemaString: string,
  options: Options,
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

  const custom = (options.customTypes || {})[schema] || BUILT_INS[schema];
  if (!custom) {
    throw new InvalidSchemaError(`Unknown type for ${key}: ${schema}`);
  }

  const ast = (typeof custom !== 'function')
    ? parse(key, custom, options)
    : parseFunction(key, custom, schema);

  return allowUndefined
    ? {
      key,
      type: 'union',
      items: [ast, parseValue(key, undefined, 'undefined')],
    }
    : ast;
}

// === Object types ========================================================= //
const OBJ_RESERVED = ['$strict'];

function parseObject(
  key: string,
  schemaObject: ObjectType,
  options: Options,
): ObjectAst {
  const schemaKeys = Object
    .keys(schemaObject)
    .filter(k => !OBJ_RESERVED.includes(k));

  return {
    key,
    properties: schemaKeys.map(k => ({
      ast: parse(`${key}.${k}`, schemaObject[k], options),
      key: k,
    })),
    strict: (schemaObject as any).$strict !== false,
    type: 'object',
  };
}

// === Array types ========================================================== //
function parseArray(
  key: string,
  schemaArray: ArrayType,
  options: Options,
): ArrayAst {

  const item = schemaArray.length === 1
    ? parse(key, schemaArray[0], options)
    : parseUnion(key, schemaArray, options);

  return {
    key,
    item,
    type: 'array',
  };
}

// === Global =============================================================== //
export function parse(
  key: string,
  schema: Type,
  options: Options,
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
