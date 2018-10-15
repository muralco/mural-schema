import { compile } from './compile';
import { parse } from './parse';
import { ParseOptions, Type, ValidationFn } from './types';

export * from './types';

const DEFAULT_OPTIONS: ParseOptions = {};

export const parseSchema = (
  schema: Type,
  options = DEFAULT_OPTIONS,
): ValidationFn => {
  const ast = parse([], schema, options);
  return compile(ast);
};
