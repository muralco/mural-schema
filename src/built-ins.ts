import { TypeMap } from './types';

const BUILT_INS: TypeMap = {
  any: () => true,
  boolean: obj => typeof obj === 'boolean',
  number: obj => typeof obj === 'number',
  string: obj => typeof obj === 'string',
};

export default BUILT_INS;
