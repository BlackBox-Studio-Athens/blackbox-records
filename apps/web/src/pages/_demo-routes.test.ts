import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { AstroIntegration } from 'astro';
import { describe, expect, it, vi } from 'vitest';

import { demoRoutes, devDemoRoutes } from './_demo/dev-routes.mjs';

type ConfigSetupHook = NonNullable<AstroIntegration['hooks']['astro:config:setup']>;

function injectedPatterns(command: 'build' | 'dev' | 'preview' | 'sync') {
  const injectRoute = vi.fn();
  const hook = devDemoRoutes().hooks['astro:config:setup']!;
  void hook({ command, injectRoute } as unknown as Parameters<ConfigSetupHook>[0]);
  return injectRoute.mock.calls.map(([route]) => (route as { pattern: string }).pattern);
}

function listFiles(directory: URL): string[] {
  return readdirSync(directory, { recursive: true, encoding: 'utf8' });
}

describe('demo review pages', () => {
  it('are injected while astro dev runs and never in a build', () => {
    expect(injectedPatterns('dev')).toEqual(['/demo/header-type-studies', '/demo/release-feature-drafts']);
    expect(injectedPatterns('build')).toEqual([]);
    expect(injectedPatterns('preview')).toEqual([]);
    expect(injectedPatterns('sync')).toEqual([]);
  });

  it('live in an underscore directory that file-based routing ignores', () => {
    expect(existsSync(new URL('./demo/', import.meta.url))).toBe(false);
    for (const route of demoRoutes) {
      const entrypoint = fileURLToPath(route.entrypoint);
      expect(entrypoint.replaceAll('\\', '/')).toContain('/src/pages/_demo/');
      expect(existsSync(entrypoint)).toBe(true);
    }
  });

  it('keep the Druk trial font out of public/ so builds never copy it', () => {
    expect(
      listFiles(new URL('../../public/', import.meta.url)).filter((file) => /druk|type-studies/i.test(file)),
    ).toEqual([]);
    expect(existsSync(new URL('./_demo/fonts/DrukTextWide-Medium-Trial.otf', import.meta.url))).toBe(true);
  });
});
