/* eslint-disable @typescript-eslint/no-use-before-define */
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
import { expected, isObjectType, isUnionType } from './util';

const parseRegExp = (key: Key, schema: RegExp): RegExpAst => ({
  key,
  type: 'regexp',
  value: schema,
});

const parseValue = <T>(key: Key, value: T, name: string): ValueAst<T> => ({
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
  fn: obj => {
    const error = schemaFunction(obj);
    if (typeof error === 'boolean') {
      return error ? [] : [expected(key, name)];
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

const makeOptional = (key: Key, ast: Ast): UnionAst => ({
  items: [ast, parseValue(key, undefined, 'undefined')],
  key,
  type: 'union',
});

export const makePartial = (ast: ObjectAst, recursive: boolean): ObjectAst => {
  return {
    ...ast,
    properties: ast.properties.map(p => ({
      ...p,
      ast: makeOptional(
        p.key,
        recursive && p.ast.type === 'object' ? makePartial(p.ast, true) : p.ast,
      ),
    })),
  };
};

const makeKeyof = (ast: ObjectAst): UnionAst => ({
  items: ast.properties.map(
    (p: ObjectPropertyAst): LiteralAst => ({
      key: ast.key,
      type: 'literal',
      value: p.objectKey,
    }),
  ),
  key: ast.key,
  type: 'union',
});

const startsAndEndsWith = (s: string, delim: string): boolean =>
  s.startsWith(delim) && s.endsWith(delim);

function parseStringifiedType(
  key: Key,
  schema: string,
  options: ParseOptions,
): Ast | undefined {
  if (schema === 'true' || schema === 'false') {
    return parse(key, schema === 'true', options);
  }
  if (schema === 'undefined') {
    return parse(key, undefined, options);
  }
  if (schema === 'null') {
    return parse(key, null, options);
  }
  const asNumber = Number(schema);
  if (!Number.isNaN(asNumber)) {
    return parse(key, asNumber, options);
  }
  return undefined;
}

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

  if (
    startsAndEndsWith(schema, '"') ||
    startsAndEndsWith(schema, "'") ||
    startsAndEndsWith(schema, '`')
  ) {
    return {
      key,
      type: 'literal',
      value: schema.substring(1, schema.length - 1),
    };
  }

  const builtInAst = parseStringifiedType(key, schema, options);
  if (builtInAst) return builtInAst;

  const custom = (options.customTypes || {})[schema] || builtIns[schema];
  if (!custom) {
    throw new InvalidSchemaError(`Unknown type for \`${key}\`: ${schema}`);
  }

  const ast =
    typeof custom !== 'function'
      ? parse(key, custom, options)
      : parseFunction(key, custom, schema);

  return allowUndefined ? makeOptional(key, ast) : ast;
}

// === Object types ========================================================= //
const OBJ_RESERVED = ['$strict'];

const KEY_MODS = [
  ':keyof', // keyof
  '//?', // partial (/) and recursive partial (//),
  '\\?', // optional
];

const KEY_REGEX = new RegExp(`${KEY_MODS.map(v => `(${v})?`).join('')}$`);

const getKeyMods = (key: string) => {
  const [isKeyOf, isPartial, isOptional] = (key.match(KEY_REGEX) || []).slice(
    1,
  );
  const actualKey = key.replace(KEY_REGEX, '');
  return { actualKey: actualKey || key, isOptional, isPartial, isKeyOf };
};

const notAnObject = (
  modifier: string,
  fullKey: (string | number)[],
  schema: Type,
  type: string,
  allowArrayAndUnion = false,
) =>
  new InvalidSchemaError(
    `${modifier} key modifiers can only be used with object${
      allowArrayAndUnion ? ', object array and object union' : ''
    } values. Key \`${fullKey}\` maps to a value of type \`${schema}\` (AST=${type})`,
  );

const isObjAst = (ast: Ast): ast is ObjectAst => ast.type === 'object';

function parseObjectProperty(
  parentKey: Key,
  key: string,
  schema: Type,
  options: ParseOptions,
): ObjectPropertyAst {
  const { actualKey, isKeyOf, isOptional, isPartial } = getKeyMods(key);

  const fullKey = [...parentKey, actualKey];

  let ast = parse(fullKey, schema, options);

  if (isPartial) {
    const recursive = isPartial === '//';
    if (ast.type === 'object') {
      ast = makePartial(ast, recursive);
    } else if (ast.type === 'array' && ast.item.type === 'object') {
      ast = {
        ...ast,
        item: makePartial(ast.item, recursive),
      };
    } else if (ast.type === 'union') {
      const objs = ast.items.filter(isObjAst);
      if (objs.length !== ast.items.length) {
        // at least one element of the union is not an object
        throw notAnObject('Partial', fullKey, schema, ast.type, true);
      }
      ast = {
        ...ast,
        items: objs.map(o => makePartial(o, recursive)),
      };
    } else {
      throw notAnObject('Partial', fullKey, schema, ast.type, true);
    }
  }

  if (isKeyOf) {
    if (ast.type !== 'object') {
      throw notAnObject('Keyof', fullKey, schema, ast.type);
    }
    ast = makeKeyof(ast);
  }

  return {
    anyKey: actualKey === '$any',
    ast: isOptional ? makeOptional(fullKey, ast) : ast,
    key: fullKey,
    objectKey: actualKey,
  };
}

const OBJ_OPERATORS: { [key: string]: typeof parse } = {
  $keyof: (key, schema, options) => {
    const ast = parse(key, schema, options);
    if (ast.type !== 'object') {
      throw notAnObject('Keyof', key, schema, ast.type);
    }

    return makeKeyof(ast);
  },
};

interface MaybeStrict {
  $strict?: boolean;
}

function parseObject(
  key: Key,
  schemaObject: ObjectType,
  options: ParseOptions,
): Ast {
  const schemaKeys = Object.keys(schemaObject).filter(
    k => !OBJ_RESERVED.includes(k),
  );

  if (schemaKeys.length === 1) {
    const op = OBJ_OPERATORS[schemaKeys[0]];
    if (op) return op(key, schemaObject[schemaKeys[0]], options);
  }

  const properties = schemaKeys.map(k =>
    parseObjectProperty(key, k, schemaObject[k], options),
  );

  return {
    extendsFrom: [],
    key,
    properties,
    strict:
      (schemaObject as MaybeStrict).$strict !== false &&
      properties.every(p => !p.anyKey),
    type: 'object',
  };
}

// === Array types ========================================================== //
function parseArray(
  key: Key,
  schemaArray: ArrayType,
  options: ParseOptions,
): ArrayAst {
  const item =
    schemaArray.length === 1
      ? parse(key, schemaArray[0], options)
      : parseUnion(key, schemaArray, options);

  return {
    item,
    key,
    type: 'array',
  };
}

// === Global =============================================================== //
export function parse(key: Key, schema: Type, options: ParseOptions): Ast {
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
