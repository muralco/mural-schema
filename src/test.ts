import { fail } from 'assert';
import pickledCucumber, { SetupFn } from 'pickled-cucumber';
import fromTs from './from-ts/process';
import * as S from './index';
import toJsonSchema, { astToJsonSchema } from './to-jsonschema';

astToJsonSchema; // pin down this reference

// Regular expression to match a regular expression literal
const regExpRe = /^\/(.*)\/[dgimsuy]*$/;

const parseJSON = (s: string) => {
  // Literal 'undefined'
  if (s === 'undefined') {
    return undefined;
  }

  // Regular expression
  const result = regExpRe.exec(s);
  const pattern = result ? result[1] : null;
  if (pattern) {
    return new RegExp(pattern);
  }

  return JSON.parse(s);
};

const opts: S.ParseOptions = {
  customTypes: {
    email: obj => typeof obj === 'string' && obj.includes('@'),
    Person: {
      age: 'number?',
      first: 'string',
      last: 'string',
      middle: 'string?',
    },
  },
};

const setup: SetupFn = ({ compare, getCtx, Given, setCtx, Then, When }) => {
  const appendCtx = <T>(k: string, v: T) => {
    const vs = getCtx<T[]>(k) || [];
    vs.push(v);
    setCtx(k, vs);
  };

  Given(
    'a schema',
    schema => setCtx('$schema', S.parseSchema(parseJSON(schema), opts)),
    { inline: true },
  );
  Given('a TS file with', content => appendCtx('$ts', content), {
    inline: true,
  });
  When(
    'validating',
    obj => setCtx('$errors', getCtx<S.ValidationFn>('$schema')(parseJSON(obj))),
    { inline: true },
  );
  When(
    'mapping to JSON schema',
    obj => setCtx('$json', toJsonSchema(parseJSON(obj), opts)),
    { inline: true },
  );
  When(
    'generating the schema from (?:that|those) files?( with exports)?',
    (withExports, options) =>
      setCtx(
        '$schema-file',
        fromTs(
          getCtx<string[]>('$ts'),
          {
            recursivePartial: ['PartialPartial'],
            ...JSON.parse(options || '{}'),
          },
          { useExport: !!withExports },
        ),
      ),
    { optional: 'with options' },
  );
  When(
    'compiling the invalid schema',
    schema => {
      const json = parseJSON(schema);
      try {
        S.parseSchema(json);
      } catch (e) {
        setCtx('$error', e);
        return;
      }
      fail('The "invalid" schema is actually valid!');
    },
    { inline: true },
  );

  Then('the validation passes', () => compare('is', getCtx('$errors'), '[]'));
  Then('the validation error is "(.*)"(?: at (\\[.*\\]))?', (message, key) =>
    compare(
      'includes',
      getCtx('$errors'),
      JSON.stringify({
        key: parseJSON(key || '[]'),
        message,
      }),
    ),
  );
  Then(
    'the resulting schema {op}',
    (op, expected) => compare(op, getCtx('$json'), expected),
    { inline: true },
  );
  Then(
    'the generated schema {op}',
    (op, expected) =>
      compare(
        op,
        getCtx('$schema-file'),
        `"${expected
          .replace(/\\/g, '\\\\')
          .replace(/\n/g, '\\n')
          .replace(/"/g, '\\"')}"`,
      ),
    { inline: true },
  );
  Then(
    'the compilation error {op}',
    (op, expected) => compare(op, getCtx('$error'), expected),
    { inline: true },
  );
};

pickledCucumber(setup);

// === Compile-time assertions ============================================== //
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const staticAssert = (_: S.Type) => {};
// literals
staticAssert(1);
staticAssert(true);
staticAssert(null);
staticAssert(undefined);

// named types and string literals
staticAssert('some type name');

// arrays
staticAssert([1]);
staticAssert(['string']);

// regexp
staticAssert(/a/);

// objects
staticAssert({});
staticAssert({ a: false });

// unions
staticAssert([[1, 'a']]);
staticAssert([['a', ['a']]]);

// functions
staticAssert(() => true);
staticAssert(() => []);
