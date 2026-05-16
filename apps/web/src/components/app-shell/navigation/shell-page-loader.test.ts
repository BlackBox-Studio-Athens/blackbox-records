import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { createShellPageSnapshotLoader } from './shell-page-loader';
import type { ShellPageSnapshot } from './shell-page-snapshot';

function createSnapshot(pathname: string): ShellPageSnapshot {
  return {
    canonicalHref: `https://example.test/blackbox-records${pathname}`,
    href: `https://example.test/blackbox-records${pathname}`,
    mainClassName: 'page-main-content-region',
    mainHtml: `<section>${pathname}</section>`,
    pageDescription: `${pathname} description`,
    pathname,
    title: `${pathname} | BlackBox`,
  };
}

describe('shell page snapshot loader', () => {
  it('returns cached shell section snapshots without fetching', async () => {
    const cache = new Map([['/releases/', createSnapshot('/releases/')]]);
    const fetchPage = vi.fn();
    const loader = createShellPageSnapshotLoader({ cache, fetchPage });

    await expect(
      loader.fetchSnapshot('/blackbox-records/releases/', 'https://example.test/blackbox-records/releases/'),
    ).resolves.toMatchObject({ pathname: '/releases/' });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('deduplicates in-flight shell section requests and caches the parsed snapshot', async () => {
    const fetchPage = vi.fn(async () => ({
      ok: true,
      text: async () => '<main data-app-shell-main>Store</main>',
      url: 'https://example.test/blackbox-records/store/',
    }));
    const readSnapshot = vi.fn(() => createSnapshot('/store/'));
    const loader = createShellPageSnapshotLoader({
      fetchPage,
      parseHtml: (html) => ({ html }) as unknown as Document,
      readSnapshot,
    });

    const firstRequest = loader.fetchSnapshot('/store/', 'https://example.test/blackbox-records/store/');
    const secondRequest = loader.fetchSnapshot('/store/', 'https://example.test/blackbox-records/store/');

    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      createSnapshot('/store/'),
      createSnapshot('/store/'),
    ]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(readSnapshot).toHaveBeenCalledTimes(1);
    expect(loader.hasCachedSnapshot('/blackbox-records/store/')).toBe(true);
  });

  it('ignores shell section prefetch failures', async () => {
    const fetchPage = vi.fn(async () => ({
      ok: false,
      text: async () => '',
      url: 'https://example.test/blackbox-records/about/',
    }));
    const loader = createShellPageSnapshotLoader({
      currentHref: () => 'https://example.test/blackbox-records/',
      fetchPage,
    });

    await expect(loader.prefetchHref('https://example.test/blackbox-records/about/')).resolves.toBeUndefined();
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
