/* eslint-disable @typescript-eslint/no-use-before-define */
import * as ts from 'typescript';
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
} from '../ast';
import { makePartial } from '../parse';
import { flatten } from '../util';
import { ListOrPredicate, Options } from './types';

const getName = (e: ts.EntityName | ts.PropertyName): string =>
  ((e as ts.Identifier).escapedText as string) || (e as ts.Identifier).text;

const ANY = '$any';

function generateRegEx(node: ts.TypeReferenceNode): RegExpAst {
  if (!node || !node.typeArguments || !node.typeArguments[0]) {
    throw `Invalid RegExp type`;
  }
  const { text } = (node.typeArguments[0] as ts.LiteralTypeNode)
    .literal as ts.LiteralExpression;
  const withFlags = text.match(/^\/(.*)\/(\w+)$/); // /expr/flags

  const [expr, flags] = withFlags ? withFlags.slice(1) : [text, undefined];

  return {
    key: [],
    type: 'regexp',
    value: new RegExp(expr, flags),
  };
}

const generateArray = (type: ts.ArrayTypeNode, options: Options): ArrayAst => ({
  item: generateType(type.elementType, options),
  key: [],
  type: 'array',
});

const generateUnion = (node: ts.UnionTypeNode, options: Options): UnionAst => ({
  items: node.types.map(t => generateType(t, options)),
  key: [],
  type: 'union',
});

const FN = () => [];

const TYPE_TRANSFORMS: Record<
  NonNullable<Options['customTypeTransform']>,
  (s: string) => string
> = {
  'as-is': s => s,
  camelCase: s => s.replace(/^([A-Z]+)/g, m => m.toLowerCase()),
  lowercase: s => s.toLowerCase(),
  'snake-case': s =>
    s
      .replace(/([A-Z]+)/g, '-$1')
      .replace(/^-/, '')
      .toLowerCase(),
};

const createTypeRef = (name: string): Ast => ({
  fn: FN,
  key: ['ref'],
  name,
  type: 'function',
});

const generateTypeRef = (node: ts.TypeReferenceNode, options: Options): Ast => {
  const name = getName(node.typeName);
  if (options.regex && options.regex === name) {
    return generateRegEx(node);
  }

  if (options.customTypes && options.customTypes.includes(name)) {
    const fn = TYPE_TRANSFORMS[options.customTypeTransform || 'as-is'];
    return generateBuiltIn(fn(name));
  }

  if (
    name === 'Record' &&
    node.typeArguments &&
    node.typeArguments.length === 2
  ) {
    const valueType = node.typeArguments[1];
    if (ts.isTypeReferenceNode(node)) {
      return {
        extendsFrom: [],
        key: [],
        properties: [
          generateObjectPropertyValue(valueType, ANY, false, options),
        ],
        strict: true,
        type: 'object',
      };
    }
  }

  return createTypeRef(name);
};

const generateKeyOf = (node: ts.TypeReferenceNode): ObjectAst => ({
  extendsFrom: [],
  key: [],
  properties: [
    {
      anyKey: false,
      ast: createTypeRef(getName(node.typeName)),
      key: ['$keyof'],
      objectKey: '$keyof',
    },
  ],
  strict: true,
  type: 'object',
});

const generateBuiltIn = (s: string): FunctionAst => ({
  fn: FN,
  key: [],
  name: s,
  type: 'function',
});

const generateLiteral = (node: ts.LiteralTypeNode): LiteralAst => ({
  key: [],
  type: 'literal',
  value: ts.isLiteralExpression(node.literal)
    ? node.literal.kind === ts.SyntaxKind.FirstLiteralToken
      ? parseInt(node.literal.text, 10) // number
      : node.literal.text
    : node.literal.kind === ts.SyntaxKind.TrueKeyword
    ? true
    : false,
});

const generateValue = <T>(name: string, value: T): ValueAst<T> => ({
  key: [],
  name,
  type: 'value',
  value,
});

function generateType(type: ts.Node, options: Options): Ast {
  if (ts.isTypeLiteralNode(type)) return generateObject(type, options);
  if (ts.isArrayTypeNode(type)) return generateArray(type, options);
  if (ts.isUnionTypeNode(type)) return generateUnion(type, options);
  if (ts.isTypeReferenceNode(type)) return generateTypeRef(type, options);
  if (ts.isLiteralTypeNode(type))
    // TypeScript 4 adds NullLiteral to LiteralTypeNode
    return type.literal.kind === ts.SyntaxKind.NullKeyword
      ? generateValue('null', null)
      : generateLiteral(type);
  if (ts.isIntersectionTypeNode(type)) {
    return generateIntersectionObject(type, options);
  }
  if (
    ts.isTypeOperatorNode(type) &&
    type.operator === ts.SyntaxKind.KeyOfKeyword &&
    ts.isTypeReferenceNode(type.type)
  ) {
    return generateKeyOf(type.type);
  }
  if (ts.isParenthesizedTypeNode(type)) {
    return generateType(type.type, options);
  }

  switch (type.kind) {
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.StringLiteral:
      return generateBuiltIn('string');
    case ts.SyntaxKind.NumberKeyword:
      return generateBuiltIn('number');
    case ts.SyntaxKind.BooleanKeyword:
      return generateBuiltIn('boolean');
    case ts.SyntaxKind.AnyKeyword:
    case ts.SyntaxKind.UnknownKeyword:
      return generateBuiltIn('any');
    case ts.SyntaxKind.NullKeyword:
      return generateValue('null', null);
    case ts.SyntaxKind.UndefinedKeyword:
      return generateValue('undefined', undefined);
    default: {
      return {
        fn: FN,
        key: [ts.SyntaxKind[type.kind]],
        name: `Unkown type: ${ts.SyntaxKind[type.kind]}`,
        type: 'function',
      };
    }
  }
}

const generatePartial = (ast: Ast, recursive: boolean): Ast => {
  if (ast.type === 'array') {
    return {
      ...ast,
      item: generatePartial(ast.item, recursive),
    };
  }

  if (ast.type === 'object') {
    return makePartial(ast, recursive);
  }

  if (ast.type === 'function' && ast.fn === FN) {
    return {
      ...ast,
      key: [recursive ? 'recursive-partial-ref' : 'partial-ref'],
    };
  }
  return ast;
};

const getPartialType = (
  node: ts.Node,
  options: Options,
): { recursive: boolean; refNode: ts.TypeNode } | undefined => {
  if (ts.isArrayTypeNode(node)) {
    const partial = getPartialType(node.elementType, options);
    if (!partial) return undefined;

    return {
      recursive: partial.recursive,
      refNode: ts.createArrayTypeNode(partial.refNode),
    };
  }

  if (!ts.isTypeReferenceNode(node) || !node.typeArguments) return undefined;

  const refNode = node.typeArguments[0];
  if (!refNode) return undefined;

  const name = getName(node.typeName);

  if (name === 'Partial') {
    return {
      recursive: false,
      refNode,
    };
  }

  if (options.recursivePartial && options.recursivePartial.includes(name)) {
    return {
      recursive: true,
      refNode,
    };
  }

  return undefined;
};

const generateAttributeValue = (
  type: ts.Node,
  questionToken: boolean,
  options: Options,
): Ast => {
  const partial = getPartialType(type, options);

  const valueNode = partial ? partial.refNode : type;

  const valueAst = generateType(valueNode, options);

  const ast = partial ? generatePartial(valueAst, partial.recursive) : valueAst;

  return questionToken
    ? {
        items: [ast, generateValue('undefined', undefined)],
        key: [],
        type: 'union',
      }
    : ast;
};

const generateObjectPropertyValue = (
  type: ts.TypeNode,
  name: string,
  questionToken: boolean,
  options: Options,
): ObjectPropertyAst => ({
  anyKey: name === ANY,
  ast: generateAttributeValue(type, !!questionToken, options),
  key: [name],
  objectKey: name,
});

const generateAttribute = (
  node: ts.PropertySignature | ts.IndexSignatureDeclaration,
  options: Options,
): ObjectPropertyAst => {
  const { type } = node;
  if (!type) throw `Invalid property value for ${node}`;
  return generateObjectPropertyValue(
    type,
    ts.isPropertySignature(node) ? getName(node.name) : ANY,
    !!node.questionToken,
    options,
  );
};

const isPropertyOrIndex = (
  m: ts.TypeElement,
): m is ts.PropertySignature | ts.IndexSignatureDeclaration =>
  ts.isPropertySignature(m) || ts.isIndexSignatureDeclaration(m);

function generateObject(
  node: ts.InterfaceDeclaration | ts.TypeLiteralNode,
  options: Options,
): ObjectAst {
  const extendsFrom =
    ts.isInterfaceDeclaration(node) && node.heritageClauses
      ? flatten(node.heritageClauses.map(c => [...c.types]))
          .map(t => t.expression)
          .filter(t => ts.isIdentifier(t))
          .map(t => getName(t as ts.Identifier))
      : [];

  const properties = node.members
    .filter(isPropertyOrIndex)
    .map(m => generateAttribute(m, options));

  return {
    extendsFrom,
    key: [],
    properties,
    strict: true,
    type: 'object',
  };
}

function generateIntersectionObject(
  node: ts.IntersectionTypeNode,
  options: Options,
): ObjectAst {
  const refs = node.types
    .filter(ts.isTypeReferenceNode)
    .map(n => getName(n.typeName));

  const objs = node.types
    .filter(ts.isTypeLiteralNode)
    .map(n => generateObject(n, options));

  const strict = objs.every(o => o.strict);

  const extendsFrom = [...refs, ...flatten(objs.map(o => o.extendsFrom))];
  const properties = flatten(objs.map(o => o.properties));

  return {
    extendsFrom,
    key: [],
    properties,
    strict,
    type: 'object',
  };
}

const includesOrMatches = (
  listOrPredicate: ListOrPredicate,
  value: string,
): boolean =>
  typeof listOrPredicate === 'function'
    ? listOrPredicate(value)
    : listOrPredicate.includes(value);

const shouldIgnore = (name: string, options: Options): boolean =>
  (!!options.ignore && includesOrMatches(options.ignore, name)) ||
  (!!options.only && !includesOrMatches(options.only, name));

function generateTopLevelType(
  node: ts.Node,
  options: Options,
  prefix: string,
): Ast[] {
  if (ts.isTypeAliasDeclaration(node)) {
    const name = `${prefix}${getName(node.name)}`;
    if (shouldIgnore(name, options)) return [];

    if (options.regex && options.regex === name) return [];

    if (options.customTypes && options.customTypes.includes(name)) return [];

    if (ts.isFunctionTypeNode(node.type)) return [];

    return [
      {
        ...generateType(node.type, options),
        key: [name],
      },
    ];
  }
  if (ts.isInterfaceDeclaration(node)) {
    const name = `${prefix}${getName(node.name)}`;
    if (shouldIgnore(name, options)) return [];

    return [
      {
        ...generateObject(node, options),
        key: [name],
      },
    ];
  }
  if (ts.isModuleDeclaration(node) && node.body) {
    const { body } = node;
    if (ts.isModuleBlock(body)) {
      const prefix = getName(node.name)
        .replace(/\//g, '-')
        .replace(/-([a-z])/g, m => m.toUpperCase())
        .replace(/\W/g, '');

      return generateTypes(body.statements, options, prefix);
    }
  }

  return [];
}

const generateTypes = (
  nodes: ts.NodeArray<ts.Node>,
  options: Options,
  prefix = '',
): Ast[] => flatten(nodes.map(n => generateTopLevelType(n, options, prefix)));

export const parse = (sourceFile: ts.SourceFile, options: Options) =>
  generateTypes(sourceFile.statements, options);
