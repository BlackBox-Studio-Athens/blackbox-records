import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
import type { Page } from 'playwright';

import { buildSveltiaConfig } from '../../../../apps/web/src/lib/admin/sveltia-config';
import {
  buildUatStaticSmokeEvidence,
  CMS_BOOT_ASSET_CONTRACTS,
  checkReviewSiteMarker,
  checkCmsAdminRenderedState,
  checkCmsConfigPlaceholders,
  checkCmsHostedConfigDeclarations,
  checkCmsSingletonJsonDeclarations,
  findCmsPublicMediaPath,
  parseUatStaticSmokeArgs,
  readCmsAdminRenderedState,
  resolveSelectedUatStaticSmokeScenarios,
  type CmsAdminRenderedState,
} from '../../../../scripts/smoke-uat-static';

const siteRoot = 'https://blackbox-studio-athens.github.io/blackbox-records/';
const hostedConfig = buildSveltiaConfig({
  siteRootUrl: siteRoot,
  logoUrl: siteRoot + 'assets/logo.svg',
  runtimeConfig: { mode: 'hosted', baseUrl: 'https://blackbox-cms-auth.workers.dev' },
});
const nativeSignIn: CmsAdminRenderedState = {
  bodyText: 'BlackBox CMS\nSign In with \u2068GitHub\u2069',
  hasGitHubSignIn: true,
  hasConfigLink: true,
  hasCmsRoot: true,
  hasExactPinnedRuntime: true,
  hasRuntimeApi: true,
  runtimeScriptUrls: ['https://unpkg.com/@sveltia/cms@0.205.2/dist/sveltia-cms.js'],
};

describe('UAT static smoke runner', () => {
  it('checks static bootstrap assets without retired boot globals', () => {
    expect(CMS_BOOT_ASSET_CONTRACTS.html).toEqual({
      path: '/admin/index.html',
      snippets: ['id="cms-status"', 'src="./init.js"', 'href="./config.yml"'],
    });
    expect(CMS_BOOT_ASSET_CONTRACTS.css.snippets).toContain('#cms-status');
    expect(CMS_BOOT_ASSET_CONTRACTS.runtime.snippets).toContain(nativeSignIn.runtimeScriptUrls[0]);
    expect(JSON.stringify(CMS_BOOT_ASSET_CONTRACTS)).not.toMatch(/decap|__BLACKBOX_ADMIN|TopLevelMedia/i);
  });

  it('parses the supported CLI arguments and scenario selection', () => {
    expect(
      parseUatStaticSmokeArgs([
        '--site-url',
        siteRoot,
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
      siteUrl: siteRoot.slice(0, -1),
      timeoutMs: 45_000,
    });
    expect(resolveSelectedUatStaticSmokeScenarios('all').map((scenario) => scenario.name)).toEqual([
      'cms_admin',
      'cms_assets',
      'checkout_shell',
      'public_routes',
    ]);
  });

  it('rejects hosted connection placeholders and loopback, not editorial hint examples', () => {
    expect(
      checkCmsConfigPlaceholders('backend:\n  repo: __SET_REPOSITORY__\n  base_url: http://127.0.0.1:4322'),
    ).toEqual([
      'CMS config still points at a local backend or loopback URL.',
      'CMS config still contains an unsafe hosted placeholder.',
    ]);
    expect(checkCmsConfigPlaceholders(hostedConfig)).toEqual([]);
    expect(checkCmsConfigPlaceholders(hostedConfig + '\nhint: "Example: https://example.com/product."')).toEqual([]);
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
      '  - name: "site-pages"',
      '    extension: json',
      '    format: json',
      '    files:',
      '      - file: "apps/web/src/content/home/site.json"',
      '      - file: "apps/web/src/content/about/site.json"',
      '      - file: "apps/web/src/content/services/site.json"',
      '      - file: "apps/web/src/content/newsletter/site.json"',
      '      - file: "apps/web/src/content/distro-page/site.json"',
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
      'CMS config does not include singleton file path "apps/web/src/content/distro-page/site.json".',
      'CMS config does not include singleton file path "apps/web/src/content/settings/site.json".',
      'CMS config does not include collection folder path "apps/web/src/content/artists".',
      'CMS config does not include collection folder path "apps/web/src/content/releases".',
      'CMS config does not include collection folder path "apps/web/src/content/distro".',
      'CMS config does not include collection folder path "apps/web/src/content/news".',
      'CMS config does not include collection folder path "apps/web/src/content/navigation".',
      'CMS config does not include collection folder path "apps/web/src/content/socials".',
      'CMS config still uses app-root src/content paths; Sveltia needs repo-root apps/web paths.',
      'CMS config includes 0 JSON extension declarations; expected at least 2.',
      'CMS config includes 1 JSON format declarations; expected at least 2.',
    ]);
  });

  it('accepts only native GitHub sign-in with a working pinned runtime', () => {
    expect(checkCmsAdminRenderedState(nativeSignIn)).toEqual([]);
    for (const bodyText of ['', 'Loading the editor', 'Login']) {
      expect(checkCmsAdminRenderedState({ ...nativeSignIn, bodyText, hasGitHubSignIn: false })).toContain(
        'Expected native GitHub sign-in without authenticating.',
      );
    }
    expect(checkCmsAdminRenderedState({ ...nativeSignIn, bodyText: 'Configuration Errors: invalid field' })).toContain(
      'Sveltia rejected the generated configuration.',
    );
    expect(checkCmsAdminRenderedState({ ...nativeSignIn, hasExactPinnedRuntime: false, hasRuntimeApi: false })).toEqual(
      ['Expected the exact Sveltia 0.205.2 runtime.', 'Expected the Sveltia CMS registration API.'],
    );
    expect(
      checkCmsAdminRenderedState({ ...nativeSignIn, bodyText: 'Username Password Sign in with DecapBridge' }),
    ).toContain('Expected native GitHub OAuth without retired login copy.');
  });

  it('bounds the actual Playwright rendered-state read', async () => {
    let timeout: number | undefined;
    const page = {
      locator: () => ({
        evaluate: (_callback: unknown, _arg: unknown, options?: { timeout?: number }) => {
          timeout = options?.timeout;
          return Promise.resolve({});
        },
      }),
    } as unknown as Page;
    await readCmsAdminRenderedState(page, 60_000);
    expect(timeout).toBe(20_000);
  });

  it('enforces the generated hosted config and deployment base without exposing invalid input', () => {
    expect(checkCmsHostedConfigDeclarations(hostedConfig)).toEqual([]);
    const config = parse(hostedConfig);
    config.backend.name = 'proxy';
    config.backend.branch = 'preview';
    config.backend.proxy_url = 'http://localhost:8082';
    config.backend.base_url = 'not-an-origin';
    config.media_folder = 'apps/web/src/content/uploads';
    config.public_folder = './';
    expect(checkCmsHostedConfigDeclarations(stringify(config))).toEqual(
      expect.arrayContaining([
        'CMS hosted backend.branch must equal "main".',
        'CMS hosted backend.name must equal "github".',
        'CMS hosted backend.base_url must be a valid HTTPS authenticator origin.',
        'CMS hosted config must not expose retired authentication or proxy settings.',
        'CMS hosted global media must use shared public assets under the deployment base.',
      ]),
    );
    expect(checkCmsHostedConfigDeclarations(hostedConfig, 'https://blackbox-records-web.pages.dev/')).toContain(
      'CMS hosted site_url and display_url must match the HTTPS deployment site root.',
    );
    expect(checkCmsHostedConfigDeclarations('backend: [unterminated-secret')).toEqual([
      'CMS config is not valid YAML.',
    ]);
  });

  it('checks deployed collection images instead of the retired admin-media route', () => {
    expect(
      findCmsPublicMediaPath(
        '<header><img src="/logo.svg"></header><main><picture><img src="/blackbox-records/_astro/cover.webp"></picture></main>',
        siteRoot,
      ),
    ).toBe('/_astro/cover.webp');
    expect(
      findCmsPublicMediaPath("<main><img src='/_astro/cover.webp'></main>", 'https://blackbox-records-web.pages.dev/'),
    ).toBe('/_astro/cover.webp');
    expect(() =>
      findCmsPublicMediaPath('<header><img src="/logo.svg"></header><main>No image</main>', siteRoot),
    ).toThrow('no rendered content image');
    expect(() => findCmsPublicMediaPath('<main><img src="https://other.example/cover.jpg"></main>', siteRoot)).toThrow(
      'under the site base',
    );
    expect(() => findCmsPublicMediaPath('<main><img src="/assets/cover.jpg"></main>', siteRoot)).toThrow(
      'under the site base',
    );
  });

  it('builds evidence with the read-only unauthenticated smoke contract', () => {
    const evidence = buildUatStaticSmokeEvidence({
      checks: [],
      consoleErrors: [],
      pageErrors: [],
      screenshotPath: null,
      siteUrl: siteRoot,
      status: 'passed',
      scenario: { description: 'Verify native Sveltia GitHub sign-in and hosted configuration.', name: 'cms_admin' },
    });
    expect(evidence).toMatchObject({
      authenticated: false,
      environment: 'uat',
      readOnly: true,
      scenario: 'cms_admin',
      status: 'passed',
      suite: 'uat-static',
    });
    expect(evidence.summary).toContain('Status: PASSED (0 issue(s))');
  });
});
