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
      preloadImages: vi.fn(),
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

  it('keeps each Store category snapshot distinct', async () => {
    const categories = ['/store/', '/store/blackbox-releases/', '/store/distro/', '/store/merch/'];
    const cache = new Map(categories.map((pathname) => [pathname, createSnapshot(pathname)]));
    const loader = createShellPageSnapshotLoader({ cache, fetchPage: vi.fn() });

    await expect(
      Promise.all(
        categories.map((pathname) =>
          loader.fetchSnapshot(`/blackbox-records${pathname}`, `https://example.test/blackbox-records${pathname}`),
        ),
      ),
    ).resolves.toEqual(categories.map(createSnapshot));
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
      preloadImages: vi.fn(),
    });

    await expect(loader.prefetchHref('https://example.test/blackbox-records/about/')).resolves.toBeUndefined();
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('preloads eager images once per fetched snapshot, before callers continue', async () => {
    const preloadImages = vi.fn();
    const loader = createShellPageSnapshotLoader({
      currentHref: () => 'https://example.test/blackbox-records/',
      fetchPage: vi.fn(async () => ({
        ok: true,
        text: async () => '',
        url: 'https://example.test/blackbox-records/store/',
      })),
      parseHtml: () => ({}) as unknown as Document,
      preloadImages,
      readSnapshot: () => createSnapshot('/store/'),
    });

    await loader
      .fetchSnapshot('/store/', 'https://example.test/blackbox-records/store/')
      .then(() => expect(preloadImages).toHaveBeenCalledWith('<section>/store/</section>'));

    await loader.fetchSnapshot('/store/', 'https://example.test/blackbox-records/store/');
    await loader.prefetchHref('https://example.test/blackbox-records/store/');
    expect(preloadImages).toHaveBeenCalledTimes(1);
  });

  it('prefetches speculatively at low priority and warms only the first eager image until the page opens', async () => {
    const fetchPage = vi.fn(async (_href: string, _init: RequestInit) => ({
      ok: true,
      text: async () => '',
      url: 'https://example.test/blackbox-records/store/',
    }));
    const remainingSources = [{ src: '/b.jpg' }, { src: '/c.jpg' }];
    const preloadImages = vi.fn(() => remainingSources);
    const preloadImageSources = vi.fn();
    const loader = createShellPageSnapshotLoader({
      currentHref: () => 'https://example.test/blackbox-records/',
      fetchPage,
      parseHtml: () => ({}) as unknown as Document,
      preloadImageSources,
      preloadImages,
      readSnapshot: () => createSnapshot('/store/'),
    });

    await loader.prefetchHref('https://example.test/blackbox-records/store/', { speculative: true });

    expect(fetchPage.mock.calls[0]?.[1]).toMatchObject({ priority: 'low' });
    expect(preloadImages).toHaveBeenCalledWith('<section>/store/</section>', 1);
    expect(preloadImageSources).not.toHaveBeenCalled();

    loader.warmSnapshotImages('/blackbox-records/store/');
    loader.warmSnapshotImages('/store/');
    expect(preloadImageSources).toHaveBeenCalledTimes(1);
    expect(preloadImageSources).toHaveBeenCalledWith(remainingSources);
  });

  it('keeps default fetch priority and warms every eager image for an intentional prefetch', async () => {
    const fetchPage = vi.fn(async (_href: string, _init: RequestInit) => ({
      ok: true,
      text: async () => '',
      url: 'https://example.test/blackbox-records/store/',
    }));
    const preloadImages = vi.fn(() => []);
    const preloadImageSources = vi.fn();
    const loader = createShellPageSnapshotLoader({
      currentHref: () => 'https://example.test/blackbox-records/',
      fetchPage,
      parseHtml: () => ({}) as unknown as Document,
      preloadImageSources,
      preloadImages,
      readSnapshot: () => createSnapshot('/store/'),
    });

    await loader.prefetchHref('https://example.test/blackbox-records/store/');

    expect(fetchPage.mock.calls[0]?.[1]).not.toHaveProperty('priority');
    expect(preloadImages).toHaveBeenCalledWith('<section>/store/</section>');
    loader.warmSnapshotImages('/store/');
    expect(preloadImageSources).not.toHaveBeenCalled();
  });
});
