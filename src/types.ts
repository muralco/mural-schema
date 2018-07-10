// === Schema types ========================================================= //
export interface ObjectType {
  [key: string]: Type;
}

type LiteralType = string | number | boolean;

type SimpleType =
  string
  | LiteralType
  | RegExp
  | undefined
  | null;

type ScalarType = ObjectType | SimpleType;
export type ArrayType = ScalarType[];
export type UnionType = ScalarType[][];

export type ValidationFn = (obj: any) => ValidationError[];

export type FunctionType = ValidationFn | CheckFn;

export type Type =
  ScalarType
  | ArrayType
  | UnionType
  | FunctionType;

// === Process types ======================================================== //
export interface ValidationError {
  message: string;
  key: string;
  expected?: string;
}

type CheckFn = (obj: any) => boolean;

export class InvalidSchemaError extends Error {}

export interface TypeMap {
  [type: string]: Type;
}

export interface Options {
  customTypes?: TypeMap;
}
