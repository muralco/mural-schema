module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:prettier/recommended",
    "plugin:muralco/recommended"
  ],
  parser: "@typescript-eslint/parser",
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
        to: ['/types'],
      },
    ]]
  }
};
