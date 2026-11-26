import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync(new URL('./global.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// The display faces draw Latin as capitals even under text-transform: none (Store listing cards); Inter does not.
it('uppercases Greek titles on every surface, including those that turn text-transform off', () => {
  const rule = /\.public-title--greek\s*{([^}]*)}/.exec(css)?.[1] ?? '';
  expect(rule).toMatch(/text-transform:\s*uppercase\s*!important/);
});
