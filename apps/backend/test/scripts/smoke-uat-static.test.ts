import { describe, expect, it } from 'vitest';

import {
  buildUatStaticSmokeEvidence,
  checkCmsConfigPlaceholders,
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
