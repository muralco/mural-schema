interface JsonSchemaAny {}

export interface JsonSchemaArray {
  type: 'array';
  items?: JsonSchema;
}

interface JsonSchemaBoolean {
  type: 'boolean';
}

export interface JsonSchemaEnum {
  enum: (string|number|boolean)[];
}

interface JsonSchemaNull {
  type: 'null';
}

interface JsonSchemaNumber {
  type: 'number';
  minimum?: number;
  maximum?: number;
}

export interface JsonSchemaObject {
  properties: {
    [key: string]: JsonSchema;
  };
  required?: string[];
  type: 'object';
}

export interface JsonSchemaString {
  type: 'string';
  pattern?: RegExp;
}

interface JsonSchemaUnion {
  anyOf: JsonSchema[];
}

export type JsonSchema =
  | JsonSchemaAny
  | JsonSchemaArray
  | JsonSchemaBoolean
  | JsonSchemaEnum
  | JsonSchemaNull
  | JsonSchemaNumber
  | JsonSchemaObject
  | JsonSchemaString
  | JsonSchemaUnion
  ;
