import pickledCucumber, { SetupFn } from 'pickled-cucumber';
import * as S from './index';
import toJsonSchema, { astToJsonSchema } from './to-jsonschema';

astToJsonSchema; // pin down this reference

const parseJSON = (s: string) =>
  s === 'undefined'
    ? undefined
    : s.startsWith('/') && s.endsWith('/') && s.length > 1
      ? new RegExp(s.substring(1, s.length - 1))
      : JSON.parse(s);

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

const setup: SetupFn = ({
  compare, getCtx, Given, setCtx, Then, When,
}) => {
  Given(
    'a schema',
    schema => setCtx('$schema', S.parseSchema(
      parseJSON(schema),
      opts,
    )),
    { inline: true },
  );
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

  Then(
    'the validation passes',
    () => compare('is', getCtx('$errors'), '[]'),
  );
  Then(
    'the validation error is "(.*)"(?: at (\\[.*\\]))?',
    (message, key) => compare('includes', getCtx('$errors'), JSON.stringify({
      key: parseJSON(key || '[]'),
      message,
    })));
  Then(
    'the resulting schema {op}',
    (op, expected) => compare(op, getCtx('$json'), expected),
    { inline: true },
  );
};

pickledCucumber(setup);
