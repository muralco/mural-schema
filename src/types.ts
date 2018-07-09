// === Schema types ========================================================= //
export interface ObjectType {
  [key: string]: Type
}

export type SimpleType =
  string
  | RegExp
  | undefined
  | null;

export type ScalarType = ObjectType | SimpleType
export type ArrayType = ScalarType[];
export type UnionType = ScalarType[][];

export type Type =
  ScalarType
  | ArrayType
  | UnionType;

// === Process types ======================================================== //
export interface ValidationError {
  message: string;
  key: string;
  expected?: string;
}

export type ValidationFn = (obj: any) => ValidationError[];

export type CheckFn = (obj: any) => boolean;

export class InvalidSchemaError extends Error {}

export interface TypeMap {
  [type: string]: Type | ((key: string) => ValidationFn | CheckFn);
}

export interface Options {
  customTypes?: TypeMap
}
