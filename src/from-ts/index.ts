import { readFileSync } from 'fs';
import { loadOptions, usage } from './options';
import fromTs from './process';

const args = process.argv.slice(2);

const { files, parseOptions, printOptions } = loadOptions(args);

if (!files.length) {
  usage();
  process.exit(-1);
}

const content = files.map(fileName => readFileSync(fileName).toString());

console.log(
  `// This file was generated DO NOT EDIT!\n${fromTs(
    content,
    parseOptions,
    printOptions,
  ).trim()}\n`,
);
