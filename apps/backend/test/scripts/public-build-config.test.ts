import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const backend = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url));
const config = readFileSync(backend('astro.public.config.mjs'), 'utf8');
const extensions = ['', '.ts', '.tsx', '.mjs', '.js', '.astro', '.json'];
const isModule = (path: string) =>
  extensions.some((extension) => existsSync(path + extension) && statSync(path + extension).isFile()) ||
  extensions.slice(1).some((extension) => existsSync(`${path}/index${extension}`));
const webSource = (specifier: string) => backend(`../web/src/${specifier.slice(2)}`);
const exportNames = (path: string) =>
  [...readFileSync(path, 'utf8').matchAll(/export (?:const|function) (\w+)|export \{([^}]+)\}/g)]
    .flatMap(([, name, list]) => (name ? [name] : list.split(',').map((entry) => entry.trim())))
    .sort();

describe('hosted public build module overrides', () => {
  const specifiers = [...config.matchAll(/'(@\/[^']+)'/g)].map(([, specifier]) => specifier);
  const localPaths = [...config.matchAll(/local\('([^']+)'\)/g)]
    .map(([, path]) => path)
    .filter((path) => !path.startsWith('.emdash'));

  it('replaces only web modules that still exist, so a moved module cannot silently fall back to static data', () => {
    expect(specifiers).toEqual(expect.arrayContaining(['@/lib/content-reader', '@/platform/lib/purchase-information']));
    for (const specifier of specifiers) expect(isModule(webSource(specifier)), specifier).toBe(true);
    for (const path of localPaths)
      expect(isModule(backend(path)) || statSync(backend(path), { throwIfNoEntry: false })?.isDirectory(), path).toBe(
        true,
      );
  });

  it('swaps the purchase-information owner for published readers with the same exports', () => {
    expect(localPaths).toEqual(
      expect.arrayContaining([
        '../web/src/platform/lib/purchase-information',
        '../web/src/lib/published-purchase-browser.ts',
        'src/cms/published-purchase-information.ts',
      ]),
    );
    const owner = exportNames(backend('../web/src/platform/lib/purchase-information.ts'));
    expect(owner).toContain('inlinesPurchaseInformation');
    expect(exportNames(backend('../web/src/lib/published-purchase-browser.ts'))).toEqual(owner);
    expect(exportNames(backend('src/cms/published-purchase-information.ts'))).toEqual(owner);
  });

  it('inlines purchase information only for the hosted browser reader', () => {
    const flag = (path: string) =>
      /export const inlinesPurchaseInformation = (true|false);/.exec(readFileSync(path, 'utf8'))?.[1];
    expect(flag(backend('../web/src/platform/lib/purchase-information.ts'))).toBe('false');
    expect(flag(backend('src/cms/published-purchase-information.ts'))).toBe('true');
    expect(flag(backend('../web/src/lib/published-purchase-browser.ts'))).toBe('true');
  });
});
