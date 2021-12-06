import * as ts from 'typescript';
import { print } from '../print';
import { PrintOptions } from '../types';
import { Import, parse } from './parse-to-ast';
import { Options } from './types';

export const DEFAULT_RECURSIVE_PARTIAL = [
  'DeepPartial',
  'PartialDeep',
  'PartialPartial',
  'PartialRecursive',
  'RecursivePartial',
];

const printImport = (
  { from, parts }: Import,
  mapping: NonNullable<Options['imports']>,
): string => {
  const aliasPath = mapping.get(from);
  return aliasPath
    ? `import { ${parts
        .map(p => (p.alias !== p.name ? `${p.name} as ${p.alias}` : p.name))
        .join(', ')} } from '${aliasPath}';\n`
    : '';
};

const fromTs = (
  fileContent: string[],
  parseOptions: Options = { recursivePartial: DEFAULT_RECURSIVE_PARTIAL },
  printOptions: PrintOptions = {},
): string => {
  const { ast, imports } = fileContent.reduce(
    (acc, content, i) => {
      const sourceFile = ts.createSourceFile(
        `file-${i}`,
        content,
        ts.ScriptTarget.ES2015,
      );
      const { ast, imports } = parse(sourceFile, parseOptions);
      acc.ast.push(...ast);
      acc.imports.push(...imports);
      return acc;
    },
    { ast: [], imports: [] } as ReturnType<typeof parse>,
  );

  const importMapping = parseOptions.imports;

  return `${
    importMapping
      ? imports.map(i => printImport(i, importMapping)).join('')
      : ''
  }${print(ast, printOptions).trim()}`;
};

export default fromTs;
