import * as assert from 'assert';
import { Before, Given, Then, When } from 'cucumber';
import { parseSchema } from './index';

let ctx: { [key: string]: any } = {};

Before(() => { ctx = {}; });

const parseJSON = (s: string) =>
  s === 'undefined'
    ? undefined
    : JSON.parse(s);


const setSchema = (schema: string) => {
  ctx.$schema = parseSchema('body', parseJSON(schema), {
    customTypes: {
      email: _ => obj => typeof obj === 'string' && obj.includes('@'),
      Person: {
        first: 'string',
        middle: 'string?',
        last: 'string',
        age: 'number?'
      }
    }
  });
};
const validateSchema = (obj: string) => {
  ctx.$errors = ctx.$schema(parseJSON(obj));
};
const checkErrors = (expected: string) => {
  assert.deepEqual(ctx.$errors, parseJSON(expected));
};

Given(/^a schema (.*)$/, setSchema);
Given(/^a schema$/, setSchema);

When(/^validating (.*)$/, validateSchema);
When(/^validating$/, validateSchema);

Then(/^the validation passes$/, () => checkErrors('[]'));
Then(/^the validation error is "(.*)"(?: at \[(.*)\])?$/, (msg, key) => {
  assert.strictEqual(ctx.$errors.length, 1, 'Expected a single error');
  const error = ctx.$errors[0];
  assert.strictEqual(error.message, msg);
  if (key) assert.strictEqual(error.key, key);
});
Then(/^the validation error is$/, expected => {
  assert.strictEqual(ctx.$errors.length, 1, 'Expected a single error');
  assert.deepEqual(ctx.$errors[0], parseJSON(expected));
});
Then(/^the validation fails with (.*)$/, checkErrors);
Then(/^the validation fails with$/, checkErrors);
