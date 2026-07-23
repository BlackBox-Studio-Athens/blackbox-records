import { describe, expect, it } from 'vitest';

import {
  buildUatStaticSmokeEvidence,
  checkReviewSiteMarker,
  checkCmsAdminRenderedState,
  checkCmsConfigPlaceholders,
  checkCmsHostedConfigDeclarations,
  checkCmsSingletonJsonDeclarations,
  parseUatStaticSmokeArgs,
  resolveSelectedUatStaticSmokeScenarios,
} from '../../../../scripts/smoke-uat-static';

describe('UAT static smoke runner', () => {
  it('parses the supported CLI arguments and scenario selection', () => {
    expect(
      parseUatStaticSmokeArgs([
        '--site-url',
        'https://blackbox-studio-athens.github.io/blackbox-records/',
        '--scenario',
        'cms_assets',
        '--timeout-ms',
        '45000',
        '--evidence-dir',
        '.codex-artifacts/smoke/uat/uat-static',
        '--screenshots',
        'always',
        '--headed',
      ]),
    ).toMatchObject({
      evidenceDir: '.codex-artifacts/smoke/uat/uat-static',
      headed: true,
      scenario: 'cms_assets',
      screenshots: 'always',
      siteUrl: 'https://blackbox-studio-athens.github.io/blackbox-records',
      timeoutMs: 45_000,
    });

    expect(resolveSelectedUatStaticSmokeScenarios('all').map((scenario) => scenario.name)).toEqual([
      'cms_admin',
      'cms_assets',
      'checkout_shell',
      'public_routes',
    ]);
  });

  it('flags CMS config placeholders and loopback URLs', () => {
    expect(
      checkCmsConfigPlaceholders(
        [
          'backend:',
          '  auth_endpoint: /sites/__SET_DECAPBRIDGE_SITE_ID__/pkce',
          '  proxy_url: http://127.0.0.1:8082/api/v1',
        ].join('\n'),
      ),
    ).toEqual([
      'CMS config still contains the __SET_DECAPBRIDGE_SITE_ID__ placeholder.',
      'CMS config still points at a local backend or loopback URL.',
    ]);

    expect(checkCmsConfigPlaceholders(['backend:', '  auth_endpoint: /sites/blackbox/pkce'].join('\n'))).toEqual([]);
  });

  it('requires the Review Site Marker on every public route', () => {
    expect(checkReviewSiteMarker('TEST SITE Test payments only', '[TEST] Store | BlackBox Records', '/store/')).toEqual(
      [],
    );
    expect(checkReviewSiteMarker('Store', 'Store | BlackBox Records', '/store/')).toEqual([
      'Expected /store/ to include Review Site Marker text "TEST SITE".',
      'Expected /store/ to include Review Site Marker text "Test payments only".',
      'Expected /store/ document title to start with "[TEST] ".',
    ]);
  });

  it('flags singleton CMS config entries that are not explicit JSON files', () => {
    const validConfig = [
      'collections:',
      '  - name: "home"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "apps/web/src/content/home/site.json"',
      '  - name: "artists"',
      '    folder: "apps/web/src/content/artists"',
      '  - name: "releases"',
      '    folder: "apps/web/src/content/releases"',
      '  - name: "distro"',
      '    folder: "apps/web/src/content/distro"',
      '  - name: "news"',
      '    folder: "apps/web/src/content/news"',
      '  - name: "navigation"',
      '    folder: "apps/web/src/content/navigation"',
      '  - name: "socials"',
      '    folder: "apps/web/src/content/socials"',
      '  - name: "about"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "apps/web/src/content/about/site.json"',
      '  - name: "services"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "apps/web/src/content/services/site.json"',
      '  - name: "newsletter"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "apps/web/src/content/newsletter/site.json"',
      '  - name: "settings"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "apps/web/src/content/settings/site.json"',
    ].join('\n');

    expect(checkCmsSingletonJsonDeclarations(validConfig)).toEqual([]);
    expect(
      checkCmsSingletonJsonDeclarations(
        [
          'collections:',
          '  - name: "home"',
          '    format: json',
          '    files:',
          '      - file: "src/content/home/site.json"',
        ].join('\n'),
      ),
    ).toEqual([
      'CMS config does not include singleton file path "apps/web/src/content/home/site.json".',
      'CMS config does not include singleton file path "apps/web/src/content/about/site.json".',
      'CMS config does not include singleton file path "apps/web/src/content/services/site.json".',
      'CMS config does not include singleton file path "apps/web/src/content/newsletter/site.json".',
      'CMS config does not include singleton file path "apps/web/src/content/settings/site.json".',
      'CMS config does not include collection folder path "apps/web/src/content/artists".',
      'CMS config does not include collection folder path "apps/web/src/content/releases".',
      'CMS config does not include collection folder path "apps/web/src/content/distro".',
      'CMS config does not include collection folder path "apps/web/src/content/news".',
      'CMS config does not include collection folder path "apps/web/src/content/navigation".',
      'CMS config does not include collection folder path "apps/web/src/content/socials".',
      'CMS config still uses app-root src/content paths; DecapBridge needs repo-root apps/web paths.',
      'CMS config includes 0 JSON extension declarations; expected at least 5.',
      'CMS config includes 1 JSON format declarations; expected at least 5.',
    ]);
  });

  it('flags CMS admin states that are blank, stuck loading, or generic login-only', () => {
    expect(
      checkCmsAdminRenderedState({
        bodyText: '',
        hasCollectionUi: false,
        hasConfigLink: true,
        hasCmsRoot: true,
        hasExactPinnedRuntime: true,
        hasRuntimeApi: true,
        isAdminReady: false,
        isAuthReady: false,
        runtimeScriptUrls: ['https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js'],
      }),
    ).toContain('Expected /admin/#/ to render visible Decap CMS text.');

    expect(
      checkCmsAdminRenderedState({
        bodyText: 'Loading configuration...',
        hasCollectionUi: false,
        hasConfigLink: true,
        hasCmsRoot: true,
        hasExactPinnedRuntime: true,
        hasRuntimeApi: true,
        isAdminReady: false,
        isAuthReady: false,
        runtimeScriptUrls: ['https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js'],
      }),
    ).toContain('Expected /admin/#/ to finish Decap bootstrap instead of staying on loading copy.');

    expect(
      checkCmsAdminRenderedState({
        bodyText: 'Login\n\nGo back to site',
        hasCollectionUi: false,
        hasConfigLink: true,
        hasCmsRoot: true,
        hasExactPinnedRuntime: true,
        hasRuntimeApi: true,
        isAdminReady: true,
        isAuthReady: false,
        runtimeScriptUrls: ['https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js'],
      }),
    ).toContain('Expected /admin/#/ to render a usable DecapBridge auth surface or authenticated collection UI.');
  });

  it('accepts the enhanced DecapBridge auth surface or authenticated collection UI', () => {
    expect(
      checkCmsAdminRenderedState({
        bodyText: 'BlackBox CMS\nSign in to edit content\nSign in with DecapBridge',
        hasCollectionUi: false,
        hasConfigLink: true,
        hasCmsRoot: true,
        hasExactPinnedRuntime: true,
        hasRuntimeApi: true,
        isAdminReady: true,
        isAuthReady: true,
        runtimeScriptUrls: ['https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js'],
      }),
    ).toEqual([]);

    expect(
      checkCmsAdminRenderedState({
        bodyText: 'Collections\nReleases\nDistro',
        hasCollectionUi: true,
        hasConfigLink: true,
        hasCmsRoot: true,
        hasExactPinnedRuntime: true,
        hasRuntimeApi: true,
        isAdminReady: true,
        isAuthReady: false,
        runtimeScriptUrls: ['https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js'],
      }),
    ).toEqual([]);
  });

  it('builds redacted evidence with the standard smoke contract', () => {
    const evidence = buildUatStaticSmokeEvidence({
      checks: [
        {
          bodyTextSnippet: 'Preparing the editor',
          contentType: null,
          issues: [],
          kind: 'page',
          path: '/admin/#/',
          status: 200,
          title: 'Preparing the editor',
          url: 'https://blackbox-studio-athens.github.io/blackbox-records/admin/#/',
        },
      ],
      consoleErrors: [],
      pageErrors: [],
      scenario: {
        description: 'Verify the Decap admin boot screen and configuration bridge.',
        name: 'cms_admin',
      },
      screenshotPath: null,
      siteUrl: 'https://blackbox-studio-athens.github.io/blackbox-records',
      status: 'passed',
    });

    expect(evidence).toMatchObject({
      authenticated: false,
      environment: 'uat',
      readOnly: true,
      screenshotPath: null,
      scenario: 'cms_admin',
      siteUrl: 'https://blackbox-studio-athens.github.io/blackbox-records',
      status: 'passed',
      suite: 'uat-static',
    });
    expect(evidence.summary).toContain(
      'Scenario cms_admin: Verify the Decap admin boot screen and configuration bridge.',
    );
    expect(evidence.summary).toContain('Status: PASSED (0 issue(s))');
    expect(evidence.checks).toHaveLength(1);
  });

  it('parses and enforces the hosted config contract', () => {
    const hostedConfig = `# blackbox-decap-mode: hosted
backend:
  name: git-gateway
  repo: BlackBox-Studio-Athens/blackbox-records
  branch: main
  auth_type: pkce
  base_url: https://auth.decapbridge.com
  auth_endpoint: /sites/site-id/pkce
  auth_token_endpoint: /sites/site-id/token
  gateway_url: https://gateway.decapbridge.com
publish_mode: simple
media_folder: apps/web/src/content/home
public_folder: ./
site_url: https://blackbox-studio-athens.github.io/blackbox-records/
display_url: https://blackbox-studio-athens.github.io/blackbox-records/
collections:
  - name: home
  - name: artists
  - name: releases
  - name: distro
  - name: news
`;
    expect(checkCmsHostedConfigDeclarations(hostedConfig)).toEqual([]);
    expect(
      checkCmsHostedConfigDeclarations(
        hostedConfig
          .replace('name: git-gateway', 'name: proxy\n  proxy_url: http://localhost:8082/api/v1')
          .replace('branch: main', 'branch: preview')
          .replace('apps/web/src/content/home', 'apps/web/src/content/uploads'),
      ),
    ).toEqual(
      expect.arrayContaining([
        'CMS hosted backend.branch must equal "main".',
        'CMS hosted backend.name must equal "git-gateway".',
        'CMS hosted config must not expose local proxy settings.',
        'CMS hosted global media fallback must stay aligned to the non-exposed Home media root.',
        'CMS hosted config must not advertise an unowned global uploads inventory.',
      ]),
    );
  });

  it('rejects an unpinned runtime and password-form copy', () => {
    expect(
      checkCmsAdminRenderedState({
        bodyText: 'BlackBox CMS Username Password Sign in with DecapBridge',
        hasCollectionUi: false,
        hasConfigLink: true,
        hasCmsRoot: true,
        hasExactPinnedRuntime: false,
        hasRuntimeApi: false,
        isAdminReady: true,
        isAuthReady: true,
        runtimeScriptUrls: ['https://unpkg.com/decap-cms@latest/dist/decap-cms.js'],
      }),
    ).toEqual(
      expect.arrayContaining([
        'Expected /admin/#/ to load exactly decap-cms@3.14.1 from the pinned runtime URL.',
        'Expected the pinned Decap runtime to expose the CMS registration API.',
        'Expected hosted Decap auth to omit classic username/password copy.',
      ]),
    );
  });
});
