import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { createOverlayFragmentLoader } from './overlay-fragment-loader';

describe('overlay fragment loader', () => {
  it('returns cached overlay HTML without fetching', async () => {
    const cache = new Map([['/releases/disintegration/', '<article>Disintegration</article>']]);
    const fetchFragment = vi.fn();
    const loader = createOverlayFragmentLoader({ cache, fetchFragment });

    await expect(loader.fetchHtml('/blackbox-records/releases/disintegration/')).resolves.toBe(
      '<article>Disintegration</article>',
    );
    expect(fetchFragment).not.toHaveBeenCalled();
  });

  it('deduplicates in-flight overlay fragment requests and caches the HTML', async () => {
    const fetchFragment = vi.fn(async () => ({
      ok: true,
      text: async () => '<article>Afterwise</article>',
    }));
    const loader = createOverlayFragmentLoader({ fetchFragment });

    const firstRequest = loader.fetchHtml('/artists/afterwise/');
    const secondRequest = loader.fetchHtml('/blackbox-records/artists/afterwise/');

    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      '<article>Afterwise</article>',
      '<article>Afterwise</article>',
    ]);
    expect(fetchFragment).toHaveBeenCalledTimes(1);
    expect(fetchFragment).toHaveBeenCalledWith('/blackbox-records/app-shell-overlay/artists/afterwise/', {
      credentials: 'same-origin',
      headers: {
        accept: 'text/html',
      },
      signal: null,
    });
    expect(loader.hasCachedHtml('/blackbox-records/artists/afterwise/')).toBe(true);
  });

  it('rejects paths that cannot render as overlay fragments', async () => {
    const fetchFragment = vi.fn();
    const loader = createOverlayFragmentLoader({ fetchFragment });

    await expect(loader.fetchHtml('/services/')).rejects.toThrow('Overlay fragment is not available for /services/');
    expect(fetchFragment).not.toHaveBeenCalled();
  });

  it('ignores overlay prefetch failures', async () => {
    const fetchFragment = vi.fn(async () => ({
      ok: false,
      text: async () => '',
    }));
    const loader = createOverlayFragmentLoader({
      currentHref: () => 'https://example.test/blackbox-records/releases/',
      fetchFragment,
    });

    await expect(
      loader.prefetchHref('https://example.test/blackbox-records/releases/disintegration/'),
    ).resolves.toBeUndefined();
    expect(fetchFragment).toHaveBeenCalledTimes(1);
  });
});
