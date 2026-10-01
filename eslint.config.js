// ESLint 10 flat config.
//
// IMPORTANT: this config is intentionally dependency-free. The sandbox blocks
// the npm registry, so `@typescript-eslint/parser` (needed for ESLint to parse
// `.ts`/`.tsx`) cannot be installed. ESLint's built-in parser does not
// understand TypeScript syntax, so we lint only plain JavaScript here and rely
// on `tsc --noEmit` (the `typecheck` script) for TypeScript correctness.
//
// To enable full TS linting once dependencies are installable, add
// `typescript-eslint` and extend its recommended config, then widen `files`.
export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.agents/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
];
