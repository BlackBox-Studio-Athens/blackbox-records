import { describe, expect, it } from 'vitest';
import {
  buildUatStaticSmokeEvidence,
  checkReviewSiteMarker,
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
  it('retains UAT marker checks', () => {
    expect(checkReviewSiteMarker('TEST SITE Test payments only', '[TEST] Store', '/store/')).toEqual([]);
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
