import {
  ArrayAst,
  Ast,
  FunctionAst,
  LiteralAst,
  ObjectAst,
  RegExpAst,
  UnionAst,
  ValueAst,
} from '../ast';
import { parse } from '../parse';
import { ParseOptions, Type } from '../types';
import {
  JsonSchema,
  JsonSchemaArray,
  JsonSchemaEnum,
  JsonSchemaObject,
  JsonSchemaString,
} from './types';

interface Options {
  mapCustomType?: (ast: Ast) => JsonSchema|undefined;
}

const mapCustom = (ast: Ast, options: Options): JsonSchema => {
  if (options.mapCustomType) {
    const schema = options.mapCustomType(ast);
    if (schema !== undefined) return schema;
  }
  return {};
};

const mapArray = (ast: ArrayAst, options: Options): JsonSchemaArray => ({
  items: mapAny(ast.item, options),
  type: 'array',
});

const mapFunction = (ast: FunctionAst, options: Options): JsonSchema => {
  switch (ast.name) {
    case 'boolean': return { type: 'boolean' };
    case 'number': return { type: 'number' };
    case 'string': return { type: 'string' };
    default: return mapCustom(ast, options);
  }
};

const mapLiteral = (ast: LiteralAst): JsonSchemaEnum => ({
  enum: [ast.value],
});

const isUndefined = (ast: Ast): boolean =>
  ast.type === 'value' && ast.value === undefined;

const isOptional = (ast: Ast): ast is UnionAst =>
  ast.type === 'union'
  && ast.items.length === 2
  && ast.items.some(isUndefined);

const mapObject = (ast: ObjectAst, options: Options): JsonSchemaObject => ({
  properties: ast.properties.reduce(
    (acc, p) => {
      const propAst = isOptional(p.ast)
      ? { ...p.ast, items: p.ast.items.filter(i => !isUndefined(i)) }
      : p.ast;
      acc[p.objectKey] = mapAny(propAst, options);
      return acc;
    },
    {} as JsonSchemaObject['properties'],
  ),
  required: ast.properties
    .filter(p => !isOptional(p.ast))
    .map(p => p.objectKey),
  type: 'object',
});

const mapRegExp = (ast: RegExpAst): JsonSchemaString => ({
  pattern: ast.value,
  type: 'string',
});

const mapUnion = (ast: UnionAst, options: Options): JsonSchema =>
  ast.items.length === 1
    ? mapAny(ast.items[0], options)
    : ast.items.every(i => i.type === 'literal')
      ? { enum: ast.items.map(i => (i as LiteralAst).value) }
      : { anyOf: ast.items.map(i => mapAny(i, options)) };

const mapValue = (ast: ValueAst<any>, options: Options): JsonSchema => {
  switch (ast.value) {
    case 'undefined': return {};
    case 'null': return { type: 'null' };
    default: return mapCustom(ast, options);
  }
};

const mapAny = (ast: Ast, options: Options): JsonSchema => {
  switch (ast.type) {
    case 'array': return mapArray(ast, options);
    case 'function': return mapFunction(ast, options);
    case 'literal': return mapLiteral(ast);
    case 'object': return mapObject(ast, options);
    case 'regexp': return mapRegExp(ast);
    case 'union': return mapUnion(ast, options);
    case 'value': return mapValue(ast, options);
    default: return {};
  }
};

export const astToJsonSchema = (ast: Ast, options: Options = {}): JsonSchema =>
  mapAny(ast, options);

export default (
  schema: Type,
  parseOptions: ParseOptions = {},
  schemaOptions: Options = {},
): JsonSchema =>
  astToJsonSchema(parse([], schema, parseOptions), schemaOptions);
