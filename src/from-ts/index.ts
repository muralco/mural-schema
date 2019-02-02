import { readFileSync } from 'fs';
import { PrintOptions } from '../types';
import fromTs, { DEFAULT_RECURSIVE_PARTIAL } from './process';
import { Options } from './types';

const args = process.argv.slice(2);

const opts = args.filter(a => a.startsWith('-'));
const fileNames = args.filter(a => !a.startsWith('-'));

if (!fileNames.length) {
  console.log(`

  Usage: node ${process.argv[1]} [-q] file1.ts [file2.ts ...]

  Options:
    -q      Generate quoted type references instead of direct references.
            When this is on, it will generate: \`{ person: 'Person' }\` instead
            of \`{ person: Person }\`
    -e      Generate \`export const\` instead of \`module.exports\`.
  `);

  process.exit(-1);
}

const parseOptions: Options = {
  recursivePartial: DEFAULT_RECURSIVE_PARTIAL,
};

const printOptions: PrintOptions = {
  quote: opts.some(o => o === '-q'),
  useExport: opts.some(o => o === '-e'),
};

const content = fileNames
  .map(fileName => readFileSync(fileName).toString());

console.log(
  `// This file was generated DO NOT EDIT!\n${
  fromTs(content, parseOptions, printOptions).trim()}\n`,
);
