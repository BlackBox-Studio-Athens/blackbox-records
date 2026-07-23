import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { decapBrowserRuntimeUrl, decapBrowserRuntimeVersion } from './decap-admin-boot';
import { decapCollectionMedia, decapCollectionMediaKeys, decapGlobalMedia } from './decap-media';

const webPackage = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {
  devDependencies: Record<string, string>;
};
const lockfile = parse(readFileSync(new URL('../../../../../pnpm-lock.yaml', import.meta.url), 'utf8')) as {
  importers: Record<
    string,
    {
      devDependencies?: Record<string, { specifier: string; version: string }>;
    }
  >;
  lockfileVersion: string;
  packages: Record<string, unknown>;
  snapshots: Record<string, unknown>;
};
const adminRuntime = readFileSync(new URL('../../../public/admin/init.js', import.meta.url), 'utf8');

describe('accepted Decap compatibility baseline', () => {
  it('pins package metadata and both lockfile records to decap-server 3.9.1', () => {
    expect(webPackage.devDependencies['decap-server']).toBe('3.9.1');
    expect(lockfile.lockfileVersion).toBe('9.0');
    expect(lockfile.importers['apps/web']?.devDependencies?.['decap-server']).toEqual({
      specifier: '3.9.1',
      version: '3.9.1(supports-color@10.2.2)',
    });
    expect(Object.keys(lockfile.packages).filter((key) => key.startsWith('decap-server@'))).toEqual([
      'decap-server@3.9.1',
    ]);
    expect(Object.keys(lockfile.snapshots).filter((key) => key.startsWith('decap-server@'))).toEqual([
      'decap-server@3.9.1(supports-color@10.2.2)',
    ]);
  });

  it('pins the browser runtime and exact preview registration surface', () => {
    expect(decapBrowserRuntimeVersion).toBe('3.14.1');
    expect(decapBrowserRuntimeUrl).toBe('https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js');
    expect([...adminRuntime.matchAll(/CMS\.registerPreviewTemplate\('([^']+)'/g)].map((match) => match[1])).toEqual([
      'home',
      'home-site',
      'about',
      'about-site',
      'services',
      'services-site',
      'artists',
      'releases',
      'distro',
      'news',
    ]);
  });

  it('owns exactly the accepted collection media roots and hides the global library surface', () => {
    expect(decapCollectionMediaKeys).toEqual(['about', 'artists', 'distro', 'home', 'news', 'releases', 'services']);
    expect(decapCollectionMedia).toEqual({
      about: {
        appDirectory: 'src/content/about',
        mediaFolder: '.',
        publicFolder: './',
        repositoryDirectory: 'apps/web/src/content/about',
      },
      artists: {
        appDirectory: 'src/content/artists',
        mediaFolder: '.',
        publicFolder: './',
        repositoryDirectory: 'apps/web/src/content/artists',
      },
      distro: {
        appDirectory: 'src/content/distro',
        mediaFolder: '.',
        publicFolder: './',
        repositoryDirectory: 'apps/web/src/content/distro',
      },
      home: {
        appDirectory: 'src/content/home',
        mediaFolder: '.',
        publicFolder: './',
        repositoryDirectory: 'apps/web/src/content/home',
      },
      news: {
        appDirectory: 'src/content/news',
        mediaFolder: '.',
        publicFolder: './',
        repositoryDirectory: 'apps/web/src/content/news',
      },
      releases: {
        appDirectory: 'src/content/releases',
        mediaFolder: '.',
        publicFolder: './',
        repositoryDirectory: 'apps/web/src/content/releases',
      },
      services: {
        appDirectory: 'src/content/services',
        mediaFolder: '.',
        publicFolder: './',
        repositoryDirectory: 'apps/web/src/content/services',
      },
    });
    expect(decapGlobalMedia).toEqual({
      mediaFolder: 'apps/web/src/content/home',
      publicFolder: './',
      topLevelLibrary: 'hidden',
    });
  });
});
