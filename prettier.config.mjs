/** @type {import("prettier").Config} */
export default {
  plugins: ['prettier-plugin-astro'],
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
