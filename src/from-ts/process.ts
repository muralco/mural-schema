import * as ts from 'typescript';
import { print } from '../print';
import { PrintOptions } from '../types';
import { flatten } from '../util';
import { parse } from './parse-to-ast';
import { Options } from './types';

export const DEFAULT_RECURSIVE_PARTIAL = [
  'DeepPartial',
  'PartialDeep',
  'PartialPartial',
  'PartialRecursive',
  'RecursivePartial',
];

const fromTs = (
  fileContent: string[],
  parseOptions: Options = { recursivePartial: DEFAULT_RECURSIVE_PARTIAL },
  printOptions: PrintOptions = {},
) => {
  const items = flatten(
    fileContent.map((content, i) => {
      const sourceFile = ts.createSourceFile(
        `file-${i}`,
        content,
        ts.ScriptTarget.ES2015,
      );
      return parse(sourceFile, parseOptions);
    }),
  );

  return print(items, printOptions).trim();
};

export default fromTs;
