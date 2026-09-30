import { describe, expect, it } from 'vitest';
import {
  buildUatStaticSmokeEvidence,
  checkReviewSiteMarker,
  discoverRepresentativePaths,
  findPublicMediaPath,
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
