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
import { Options } from './types';

const REGEX_STRING_TYPE = 'RegExString';

const getName = (e: ts.EntityName | ts.PropertyName) =>
  (e as ts.Identifier).escapedText as string;

function generateRegEx(node: ts.TypeReferenceNode): RegExpAst {
  if (!node || !node.typeArguments || !node.typeArguments[0]) {
    throw `Invalid RegExp type`;
  }
  const { text } = (node.typeArguments[0] as any).literal;
  const withFlags = text.match(/^\/(.*)\/(\w+)$/); // /expr/flags

  const [expr, flags] = withFlags
    ? withFlags.slice(1)
    : [text, undefined];

  return {
    key: [],
    type: 'regexp',
    value: new RegExp(expr, flags),
  };
}

const generateArray = (
  type: ts.ArrayTypeNode,
  options: Options,
): ArrayAst => ({
  item: generateType(type.elementType, options),
  key: [],
  type: 'array',
});

const generateUnion = (
  node: ts.UnionTypeNode,
  options: Options,
): UnionAst => ({
  items: node.types.map(t => generateType(t, options)),
  key: [],
  type: 'union',
});

const FN = () => [];

const createTypeRef = (name: string): Ast => ({
  fn: FN,
  key: ['ref'],
  name,
  type: 'function',
});

const generateTypeRef = (
  node: ts.TypeReferenceNode,
): Ast => {
  const name = getName(node.typeName);
  const isRegExp = name === REGEX_STRING_TYPE;
  if (isRegExp) return generateRegEx(node);

  return createTypeRef(name);
};

const generateKeyOf = (node: ts.TypeReferenceNode): ObjectAst => ({
  extendsFrom: [],
  key: [],
  properties: [{
    ast: createTypeRef(getName(node.typeName)),
    key: ['$keyof'],
    objectKey: '$keyof',
  }],
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

function generateType(
  type: ts.Node,
  options: Options,
): Ast {
  if (ts.isTypeLiteralNode(type)) return generateObject(type, options);
  if (ts.isArrayTypeNode(type)) return generateArray(type, options);
  if (ts.isUnionTypeNode(type)) return generateUnion(type, options);
  if (ts.isTypeReferenceNode(type)) return generateTypeRef(type);
  if (ts.isLiteralTypeNode(type)) return generateLiteral(type);
  if (ts.isIntersectionTypeNode(type)) {
    return generateIntersectionObject(type, options);
  }
  if (ts.isTypeOperatorNode(type)
    && type.operator === ts.SyntaxKind.KeyOfKeyword
    && ts.isTypeReferenceNode(type.type)
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
  if (ast.type === 'object') {
    return makePartial(ast, recursive);
  }
  if (ast.type === 'function' && ast.fn === FN) {
    return {
      ...ast,
      key: [
        recursive
          ? 'recursive-partial-ref'
          : 'partial-ref',
      ],
    };
  }
  return ast;
};

const getPartialType = (node: ts.Node, options: Options) => {
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
  node: ts.PropertySignature,
  options: Options,
): Ast => {
  if (!node.type) throw `Invalid property value for ${node}`;

  const partial = getPartialType(node.type, options);

  const valueNode = partial
    ? partial.refNode
    : node.type;

  const valueAst = generateType(valueNode, options);

  const ast = partial
    ? generatePartial(valueAst, partial.recursive)
    : valueAst;

  return !!node.questionToken
    ? {
      items: [ast, generateValue('undefined', undefined)],
      key: [],
      type: 'union',
    }
    : ast;
};

const generateAttribute = (
  node: ts.PropertySignature,
  options: Options,
): ObjectPropertyAst => {
  const name = getName(node.name);
  return {
    ast: generateAttributeValue(node, options),
    key: [name],
    objectKey: name,
  };
};

function generateObject(
  node: ts.InterfaceDeclaration|ts.TypeLiteralNode,
  options: Options,
): ObjectAst {
  const strict = !node.members.find(ts.isIndexSignatureDeclaration);

  const extendsFrom = ts.isInterfaceDeclaration(node) && node.heritageClauses
    ? flatten(node.heritageClauses.map(c => [...c.types]))
      .map(t => t.expression)
      .filter(t => ts.isIdentifier(t))
      .map(t => getName(t as ts.Identifier))
    : [];

  return {
    extendsFrom,
    key: [],
    properties: node.members
      .filter(ts.isPropertySignature)
      .map(m => generateAttribute(m, options)),
    strict,
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

  const extendsFrom = [
    ...refs,
    ...flatten(objs.map(o => o.extendsFrom)),
  ];
  const properties = flatten(
    objs.map(o => o.properties),
  );

  return {
    extendsFrom,
    key: [],
    properties,
    strict,
    type: 'object',
  };
}

function generateTopLevelType(node: ts.Node, options: Options): Ast | null {
  if (ts.isTypeAliasDeclaration(node)) {
    const name = getName(node.name);
    if (options.ignore) {
      const shouldIngoreType = typeof options.ignore === 'function'
        ? options.ignore(name)
        : options.ignore.includes(name);
      if (shouldIngoreType) return null;
      if (name === REGEX_STRING_TYPE) return null;
    }

    if (ts.isFunctionTypeNode(node.type)) return null;

    return {
      ...generateType(node.type, options),
      key: [name],
    };
  }
  if (ts.isInterfaceDeclaration(node)) {
    const name = getName(node.name);
    return {
      ...generateObject(node, options),
      key: [name],
    };
  }

  return null;
}

const generateTypes = (nodes: ts.NodeArray<ts.Node>, options: Options): Ast[] =>
  nodes
    .map(n => generateTopLevelType(n, options))
    .filter(n => !!n) as Ast[];

export const parse = (sourceFile: ts.SourceFile, options: Options) =>
  generateTypes(sourceFile.statements, options);
