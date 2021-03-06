import { Key, ValidationFn } from './types';

interface BaseAst {
  key: Key;
}

export interface ObjectPropertyAst extends BaseAst {
  anyKey: boolean;
  ast: Ast;
  objectKey: string;
}

export interface ObjectAst extends BaseAst {
  type: 'object';
  extendsFrom: string[];
  properties: ObjectPropertyAst[];
  strict: boolean;
}

export interface UnionAst extends BaseAst {
  type: 'union';
  items: Ast[];
}

export interface ArrayAst extends BaseAst {
  type: 'array';
  item: Ast;
}

export interface ValueAst<T> extends BaseAst {
  type: 'value';
  name: string;
  value: T;
}

export interface RegExpAst extends BaseAst {
  type: 'regexp';
  value: RegExp;
}

export interface FunctionAst extends BaseAst {
  type: 'function';
  name: string;
  fn: ValidationFn;
}

export interface LiteralAst extends BaseAst {
  type: 'literal';
  value: string | number | boolean;
}

export type Ast =
  | ArrayAst
  | FunctionAst
  | LiteralAst
  | ObjectAst
  | RegExpAst
  | UnionAst
  | ValueAst<null>
  | ValueAst<undefined>;
