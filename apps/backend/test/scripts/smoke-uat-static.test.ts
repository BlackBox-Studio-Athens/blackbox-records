import { describe, expect, it } from 'vitest';
import {
  buildUatStaticSmokeEvidence,
  checkReviewSiteMarker,
  discoverRepresentativeCandidates,
  discoverRepresentativePaths,
  findPublicMediaPath,
  findSectionMediaPath,
  imageTransformByteBudget,
  imageTransformIssues,
  imageTransformProbePaths,
  parseUatStaticSmokeArgs,
  resolveSelectedUatStaticSmokeScenarios,
} from '../../../../scripts/smoke-uat-static';

describe('UAT static smoke', () => {
  it('selects public checks and rejects obsolete CMS scenarios', () => {
    expect(resolveSelectedUatStaticSmokeScenarios('all').map((s) => s.name)).toEqual([
      'public_assets',
      'checkout_shell',
      'public_routes',
    ]);
    expect(parseUatStaticSmokeArgs(['--scenario', 'public_assets']).scenario).toBe('public_assets');
    // The image transformation check runs by name (e.g. at a hostname cutover), not in the release smoke set.
    expect(parseUatStaticSmokeArgs(['--scenario', 'image_transform']).scenario).toBe('image_transform');
    expect(resolveSelectedUatStaticSmokeScenarios('image_transform').map((s) => s.name)).toEqual(['image_transform']);
    expect(() => parseUatStaticSmokeArgs(['--scenario', 'cms_admin'])).toThrow();
    expect(() => parseUatStaticSmokeArgs(['--scenario', 'cms_assets'])).toThrow();
  });
  it('keeps public media on the deployment origin and base', () => {
    expect(
      findPublicMediaPath(
        '<main><img src="/blackbox-records/assets/a.webp"></main>',
        'https://example.test/blackbox-records/',
      ),
    ).toBe('/assets/a.webp');
    expect(() =>
      findPublicMediaPath('<main><img src="https://foreign.test/a.webp"></main>', 'https://example.test/'),
    ).toThrow();
    expect(() => findPublicMediaPath('<main></main>', 'https://example.test/')).toThrow();
  });
  it('probes a 480 px transformation of the first published CMS image under the site base', () => {
    const media = 'b'.repeat(64);
    const html = [
      '<header><img src="/_image?href=%2Fmedia%2Fcontent%2Fignored&w=96"></header><main>',
      '<img src="/_image?href=%2F_astro%2Flogo.png&amp;w=308">',
      `<img src="/_image?href=%2Fmedia%2Fcontent%2F${media}&amp;w=1400&amp;h=800">`,
      '</main>',
    ].join('');
    expect(imageTransformProbePaths(html, 'https://blackboxrecordsathens.com/')).toEqual({
      mediaPath: `/media/content/${media}`,
      transformPath: `/_image?href=%2Fmedia%2Fcontent%2F${media}&w=480`,
    });
    expect(
      imageTransformProbePaths(
        `<main><img src="/blackbox-records/media/content/${media}"></main>`,
        'http://127.0.0.1:4321/blackbox-records/',
      ),
    ).toEqual({
      mediaPath: `/media/content/${media}`,
      transformPath: `/_image?href=%2Fblackbox-records%2Fmedia%2Fcontent%2F${media}&w=480`,
    });
    expect(() => imageTransformProbePaths('<main><img src="/assets/a.webp"></main>', 'https://x.test/')).toThrow(
      'no published CMS image',
    );
  });
  it('accepts only a small immutable AVIF or WebP transformation', () => {
    const passing = {
      bytes: 30_000,
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: 'image/avif',
      fallback: null,
      originalBytes: 900_000,
      status: 200,
    };
    expect(imageTransformIssues(passing)).toEqual([]);
    expect(imageTransformIssues({ ...passing, contentType: 'image/webp' })).toEqual([]);
    const original = imageTransformIssues({
      ...passing,
      bytes: 900_000,
      cacheControl: 'public, max-age=300',
      contentType: 'image/jpeg',
      fallback: 'original-fallback',
    });
    expect(original).toHaveLength(5);
    expect(imageTransformIssues({ ...passing, bytes: imageTransformByteBudget + 1, originalBytes: null })).toHaveLength(
      1,
    );
    expect(imageTransformIssues({ ...passing, status: 404 })[0]).toContain('HTTP 200');
  });
  it('samples media from the first published page that renders a content image', async () => {
    const pages: Record<string, string> = {
      // The layout renders a footer logo after </main> on every page; it is not a content image.
      '/news/text-only/':
        '<main><p>No image</p></main><footer><img class="site-footer-logo" src="/assets/logo.webp"></footer>',
      '/news/with-photo/': '<main><img src="/assets/photo.webp"></main>',
      '/news/foreign/': '<main><img src="https://foreign.test/a.webp"></main>',
    };
    const read = async (path: string) => pages[path] ?? '';
    const site = 'https://example.test/';

    await expect(findSectionMediaPath('news', ['/news/text-only/', '/news/with-photo/'], read, site)).resolves.toBe(
      '/assets/photo.webp',
    );
    await expect(findSectionMediaPath('news', ['/news/text-only/'], read, site)).rejects.toThrow(
      'No published news page renders a content image',
    );
    // Off-base media is a defect, not a reason to try the next page.
    await expect(findSectionMediaPath('news', ['/news/foreign/', '/news/with-photo/'], read, site)).rejects.toThrow(
      'site base',
    );
  });
  it('lists every published candidate per section in sitemap order', () => {
    const sitemap = '<loc>https://x.test/news/a/</loc><loc>https://x.test/news/b/</loc>';
    const sitemapAll = `${sitemap}<loc>https://x.test/artists/a/</loc><loc>https://x.test/releases/r/</loc>`;
    expect(discoverRepresentativeCandidates(sitemapAll, '<a href="/store/item/"></a>', 'https://x.test/').news).toEqual(
      ['/news/a/', '/news/b/'],
    );
  });
  it('discovers representative pages from published content under the site base', () => {
    const sitemap = [
      '<urlset>',
      '<url><loc>https://canonical.test/blackbox-records/</loc></url>',
      '<url><loc>https://canonical.test/blackbox-records/artists/</loc></url>',
      '<url><loc>https://canonical.test/blackbox-records/store/distro/</loc></url>',
      '<url><loc>https://canonical.test/blackbox-records/artists/new-band/</loc></url>',
      '<url><loc>https://canonical.test/blackbox-records/releases/new-record/</loc></url>',
      '<url><loc>https://canonical.test/blackbox-records/news/new-post/</loc></url>',
      '</urlset>',
    ].join('\n');
    const store = [
      '<a href="/blackbox-records/store/">All</a>',
      '<a href="/blackbox-records/store/distro/#cd">Distro</a>',
      '<a href="/blackbox-records/store/checkout/">Cart</a>',
      '<a href="https://foreign.test/blackbox-records/store/elsewhere/">Foreign</a>',
      '<a class="prose-card-link" href=\'/blackbox-records/store/new-record-lp/\'></a>',
    ].join('');

    expect(discoverRepresentativePaths(sitemap, store, 'https://preview.test/blackbox-records/')).toEqual({
      artist: '/artists/new-band/',
      news: '/news/new-post/',
      release: '/releases/new-record/',
      storeItem: '/store/new-record-lp/',
    });
  });
  it('names the section it cannot discover', () => {
    const store = '<a href="/store/item/"></a>';
    expect(() => discoverRepresentativePaths('<loc>https://x.test/artists/a/</loc>', store, 'https://x.test/')).toThrow(
      'Could not discover a published news page',
    );
    expect(() =>
      discoverRepresentativePaths(
        '<loc>https://x.test/artists/a/</loc><loc>https://x.test/news/n/</loc><loc>https://x.test/releases/r/</loc>',
        '<a href="/store/merch/"></a>',
        'https://x.test/',
      ),
    ).toThrow('Could not discover a published Store Item page');
  });
  it('retains UAT marker checks', () => {
    expect(
      checkReviewSiteMarker(
        'UAT · TESTING ONLY Data here is separate and does not transfer to or from the production site. Open production site',
        '[UAT] Store',
        '/store/',
      ),
    ).toEqual([]);
    expect(checkReviewSiteMarker('TEST SITE Test payments only', '[TEST] Store', '/store/').length).toBeGreaterThan(0);
    expect(checkReviewSiteMarker('Store', 'Store', '/store/').length).toBeGreaterThan(0);
  });
  it('records public route status without hiding its actual response', () => {
    const evidence = buildUatStaticSmokeEvidence({
      checks: [
        {
          path: '/releases/',
          url: 'https://example.test/releases/',
          status: 200,
          expectedStatus: 200,
          kind: 'page',
          issues: [],
          bodyTextSnippet: null,
          contentType: null,
          title: null,
        },
      ],
      consoleErrors: [],
      pageErrors: [],
      scenario: { name: 'public_routes', description: 'Public route checks' },
      screenshotPath: null,
      siteUrl: 'https://example.test',
      status: 'passed',
    });
    expect(evidence.checks[0].status).toBe(200);
    expect(evidence.readOnly).toBe(true);
    expect(evidence.status).toBe('passed');
  });
});
