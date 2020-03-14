module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
    "plugin:muralco/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module" // Allows for the use of imports,
  },
  ignorePatterns: ["node_modules/"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/no-explicit-any": 2,
    "@typescript-eslint/no-unused-vars": 2,
    "@typescript-eslint/no-var-requires": 0,
    "muralco/layers": [2, [
      {
        allowChildren: false,
        from: "/types\\.ts$",
        message: "A 'types.ts' can only import other 'types.ts' files",
        to: ['/types', '@tactivos/mural-shared/lib/images'],
      },
      {
        from: "/parser",
        to: [
          '@tactivos/mural-shared/lib/',
          '/fonts',
          '/mural/types$',
          '/processor/bbox',
          '/utils',
        ]
      },
    ]]
  }
};
