import { readFileSync } from 'fs';
import * as ts from 'typescript';
import { print } from '../print';
import { PrintOptions } from '../types';
import { parse } from './parse-to-ast';

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

const options: PrintOptions = {
  quote: opts.some(o => o === '-q'),
  useExport: opts.some(o => o === '-e'),
};

fileNames.forEach((fileName) => {
  const sourceFile = ts.createSourceFile(
    fileName,
    readFileSync(fileName).toString(),
    ts.ScriptTarget.ES2015,
  );

  const items = parse(sourceFile, {});

  console.log(`// This file was generated DO NOT EDIT!
  \n${print(items, options)}`);
});
