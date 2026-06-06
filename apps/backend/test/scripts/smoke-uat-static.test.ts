import { describe, expect, it } from 'vitest';

import {
  buildUatStaticSmokeEvidence,
  checkCmsAdminRenderedState,
  checkCmsConfigPlaceholders,
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

  it('flags singleton CMS config entries that are not explicit JSON files', () => {
    const validConfig = [
      'collections:',
      '  - name: "home"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "src/content/home/site.json"',
      '  - name: "about"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "src/content/about/site.json"',
      '  - name: "services"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "src/content/services/site.json"',
      '  - name: "newsletter"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "src/content/newsletter/site.json"',
      '  - name: "settings"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "src/content/settings/site.json"',
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
      'CMS config does not include singleton file path "src/content/about/site.json".',
      'CMS config does not include singleton file path "src/content/services/site.json".',
      'CMS config does not include singleton file path "src/content/newsletter/site.json".',
      'CMS config does not include singleton file path "src/content/settings/site.json".',
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
        isAdminReady: false,
        isAuthReady: false,
      }),
    ).toContain('Expected /admin/#/ to render visible Decap CMS text.');

    expect(
      checkCmsAdminRenderedState({
        bodyText: 'Loading configuration...',
        hasCollectionUi: false,
        hasConfigLink: true,
        hasCmsRoot: true,
        isAdminReady: false,
        isAuthReady: false,
      }),
    ).toContain('Expected /admin/#/ to finish Decap bootstrap instead of staying on loading copy.');

    expect(
      checkCmsAdminRenderedState({
        bodyText: 'Login\n\nGo back to site',
        hasCollectionUi: false,
        hasConfigLink: true,
        hasCmsRoot: true,
        isAdminReady: true,
        isAuthReady: false,
      }),
    ).toContain('Expected /admin/#/ to render a usable DecapBridge auth surface or authenticated collection UI.');
  });

  it('accepts the enhanced DecapBridge auth surface or authenticated collection UI', () => {
    expect(
      checkCmsAdminRenderedState({
        bodyText: 'Sign in to edit content\nSign in with DecapBridge',
        hasCollectionUi: false,
        hasConfigLink: true,
        hasCmsRoot: true,
        isAdminReady: true,
        isAuthReady: true,
      }),
    ).toEqual([]);

    expect(
      checkCmsAdminRenderedState({
        bodyText: 'Collections\nReleases\nDistro',
        hasCollectionUi: true,
        hasConfigLink: true,
        hasCmsRoot: true,
        isAdminReady: true,
        isAuthReady: false,
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
      environment: 'uat',
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
});
