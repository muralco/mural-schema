export type ListOrPredicate = string[] | ((name: string) => boolean);

export interface Options {
  // Do not generate these types
  ignore?: ListOrPredicate;

  // If specified, when the source TS file imports types from another file and
  // those types are included in the output, also include `import` statements
  // for those types. If this is `undefined` we'll ignore all `import`
  //statements
  imports?: Map<string, string>;

  // If a TS type name matches one of these, generate a custom type reference
  // For example for:
  //
  //   type Email = string;
  //   type A = { e: Email };
  //
  // Generates:
  //
  //   const A = { e: 'Email' };
  //
  customTypes?: string[];

  // If a TS type matches `types`, generate the corresponding custom schema type
  // as `lowercase`, `camelCase`, `snake-case` or `as-is` (default)
  customTypeTransform?: 'lowercase' | 'camelCase' | 'snake-case' | 'as-is';

  // If specified, generate schemas only for these types
  only?: ListOrPredicate;

  // Match the following TS types as recursive partial types
  recursivePartial?: string[];

  // Match the following generic type as a regular expression. Note: if you
  // specify `regex`, the name must match a type like the following:
  //
  //   type RegExpType<_T> = string;
  //
  // That you use in TS like this:
  //
  //   const aStringWithNumbers: RegExpType<'^\\d+$'>;
  regex?: string;
}
