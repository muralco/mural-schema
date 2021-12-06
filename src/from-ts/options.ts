import { PrintOptions } from '../types';
import { DEFAULT_RECURSIVE_PARTIAL } from './process';
import { Options as ParseOptions } from './types';

export const usage = () =>
  console.log(`

Usage: node ${process.argv[1]} [-q] [-e] [-i spec] [-o opts] file1.ts [file2.ts ...]

Options:
  -q           Generate quoted type references instead of direct references.
               When this is on, it will generate: \`{ person: 'Person' }\`
               instead of \`{ person: Person }\`
  -e           Generate \`export const\` instead of \`module.exports\`.
  -i spec      Support imported types. This option can be specified multiple
               times. The value for \`spec\` should be a string with the import
               to support verbatim (e.g. for \`import { ... } from '../f/x'\`
               you'd use \`-i '../f/x'\`). Alternatively \`spec\` could be two
               strings separated by a \`:\`, where the first string is similar
               to the previous scenario and the second one will be the path
               emitted in the output (e.g. if we already generated the schema
              for \`x\` in  \`./s/x\` we could include \`-i '../f/x:./s/x'\`).
  -o opts      Read options from the inline \`opts\` JSON
  -c config.js Read options from the JS config file \`config\`
`);

interface Options extends ParseOptions, PrintOptions {}

type JsonOptions = Omit<Options, 'imports'> & {
  imports?: string[];
};

const loadImport = (importSpec: string): [string, string] => {
  const [name, alias] = importSpec.split(':');
  return [name, alias || name];
};

const loadImports = (imports?: string[]): Options['imports'] =>
  imports ? new Map(imports.map(loadImport)) : undefined;

export const loadOptions = (
  rawArgs: string[],
): {
  files: string[];
  parseOptions: Partial<ParseOptions>;
  printOptions: Partial<PrintOptions>;
} => {
  const args = [...rawArgs];

  let opts: Partial<Options> = {
    recursivePartial: DEFAULT_RECURSIVE_PARTIAL,
    regex: 'RegExString',
  };

  const cIdx = args.indexOf('-c');
  if (cIdx !== -1) {
    opts = { ...opts, ...require(args[cIdx + 1]) };
    if (Array.isArray(opts.imports)) {
      opts.imports = loadImports(opts.imports as JsonOptions['imports']);
    }
    args.splice(cIdx, 2);
  }

  const oIdx = args.indexOf('-o');
  if (oIdx !== -1) {
    const jsonOptions: JsonOptions = JSON.parse(args[oIdx + 1]);
    opts = {
      ...opts,
      ...jsonOptions,
      imports: loadImports(jsonOptions.imports) || opts.imports,
    };
    args.splice(oIdx, 2);
  }

  return {
    files: args.filter(a => !a.startsWith('-')),
    parseOptions: opts,
    printOptions: {
      quote: args.some(o => o === '-q') || opts.quote,
      useExport: args.some(o => o === '-e') || opts.useExport,
    },
  };
};
