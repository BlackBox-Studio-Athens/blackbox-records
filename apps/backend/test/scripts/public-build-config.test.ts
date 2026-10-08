import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { publicRoutePatterns } from '../../scripts/public-route-patterns.mjs';

const backend = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url));
const config = readFileSync(backend('astro.public.config.mjs'), 'utf8');
const extensions = ['', '.ts', '.tsx', '.mjs', '.js', '.astro', '.json'];
const isModule = (path: string) =>
  extensions.some((extension) => existsSync(path + extension) && statSync(path + extension).isFile()) ||
  extensions.slice(1).some((extension) => existsSync(`${path}/index${extension}`));
const webSource = (specifier: string) => backend(`../web/src/${specifier.slice(2)}`);
const exportNames = (path: string) =>
  [...readFileSync(path, 'utf8').matchAll(/export (?:const|(?:async )?function) (\w+)|export \{([^}]+)\}/g)]
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

  it('preserves the content-reader public exports in its published replacement', () => {
    const owner = exportNames(backend('../web/src/lib/content-reader.ts'));
    expect(owner).toEqual(['getCollection', 'getEntry']);
    expect(exportNames(backend('src/cms/published-reader.ts'))).toEqual(expect.arrayContaining(owner));
  });

  it('inlines purchase information only for the hosted browser reader', () => {
    const flag = (path: string) =>
      /export const inlinesPurchaseInformation = (true|false);/.exec(readFileSync(path, 'utf8'))?.[1];
    expect(flag(backend('../web/src/platform/lib/purchase-information.ts'))).toBe('false');
    expect(flag(backend('src/cms/published-purchase-information.ts'))).toBe('true');
    expect(flag(backend('../web/src/lib/published-purchase-browser.ts'))).toBe('true');
  });

  it('uses a custom direct image service and sets execution order only inside server environment configuration', () => {
    expect(config).toContain("imageService: 'custom'");
    expect(config).toContain("entrypoint: local('src/cms/public-image-service.ts')");
    expect(config).toMatch(/configEnvironment\(name\)\s*\{\s*if \(\['ssr', 'astro', 'prerender'\]\.includes\(name\)\)/);
    expect(config.match(/strictExecutionOrder/g)).toHaveLength(1);
    expect(config).toContain("'astro:routes:resolved'");
    expect(config).toContain('JSON.stringify(publicRoutePatterns(routes))');
  });

  it('serializes resolved Astro regexes rather than route-template strings and refuses missing matchers', () => {
    const patterns = publicRoutePatterns([
      { type: 'page', pattern: '/', patternRegex: /^\/$/ },
      { type: 'page', pattern: '/artists/[slug]', patternRegex: /^\/artists\/[^/]+\/?$/ },
      { type: 'fallback', pattern: '/[...path]', patternRegex: /^\/.*$/ },
    ]);
    expect(patterns).toHaveLength(2);
    expect(new RegExp(patterns[1]).test('/artists/new-band/')).toBe(true);
    expect(new RegExp(patterns[1]).test('/artists/new-band/admin')).toBe(false);
    expect(() => publicRoutePatterns([{ type: 'page', pattern: '/' }])).toThrow('Public route regex required');
  });
});

describe('hosted Durable Object code updates', () => {
  it('restarts running objects onto a deploy at once instead of waiting up to 5 minutes for hibernation', () => {
    for (const file of ['astro.config.mjs', 'astro.public.config.mjs'])
      expect(readFileSync(backend(file), 'utf8'), file).toMatch(
        /code_update_strategy:\s*\{\s*mode:\s*'immediate'\s*\}/,
      );
  });
});

describe('UAT deployment checkout gate', () => {
  it('leaves the checkout override to the operator instead of reopening it on deployment', () => {
    const uat = readFileSync(backend('wrangler.jsonc'), 'utf8').split('"uat":')[1]?.split('"prd":')[0];
    expect(uat).toBeDefined();
    expect(uat).not.toContain('"NATIVE_CHECKOUT_ENABLED"');
  });
});
