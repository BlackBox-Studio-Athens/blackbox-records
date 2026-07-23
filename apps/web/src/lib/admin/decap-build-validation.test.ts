import { describe, expect, it } from 'vitest';

import { assertDecapBuildArtifacts, assertDisabledAdminAssetTexts } from './decap-build-validation';

function buildIndex(mode: 'local' | 'hosted' | 'disabled'): string {
  const initAttribute = mode === 'disabled' ? '' : ' data-admin-boot-init-url="/blackbox-records/admin/init.js"';
  const configLink = mode === 'disabled' ? '' : '<link rel="cms-config-url" href="/blackbox-records/admin/config.yml">';
  const state = mode === 'disabled' ? 'disabled' : 'loading';

  return `<main data-admin-boot-root data-admin-boot-mode="${mode}" data-admin-boot-state="${state}"${initAttribute}></main>${configLink}`;
}

const localConfig = `# blackbox-decap-mode: local
backend:
  name: proxy
  proxy_url: "http://127.0.0.1:8082/api/v1"
  branch: "main"
publish_mode: simple
`;

const hostedConfig = `# blackbox-decap-mode: hosted
backend:
  name: git-gateway
  repo: "BlackBox-Studio-Athens/blackbox-records"
  branch: "main"
  auth_type: pkce
  auth_endpoint: "/sites/site-id/pkce"
  auth_token_endpoint: "/sites/site-id/token"
publish_mode: simple
`;

const disabledConfig = '# blackbox-decap-mode: disabled\n# BlackBox CMS unavailable for this build.\n';

describe('assertDecapBuildArtifacts', () => {
  it.each([
    ['local', localConfig],
    ['hosted', hostedConfig],
    ['disabled', disabledConfig],
  ] as const)('accepts a coherent %s build', (expectedMode, configYaml) => {
    expect(() =>
      assertDecapBuildArtifacts({ configYaml, expectedMode, indexHtml: buildIndex(expectedMode) }),
    ).not.toThrow();
  });

  it('rejects an ordinary disabled build that falls back to localhost', () => {
    expect(() =>
      assertDecapBuildArtifacts({
        configYaml: `${disabledConfig}${localConfig.replace('# blackbox-decap-mode: local\n', '')}`,
        expectedMode: 'disabled',
        indexHtml: buildIndex('disabled'),
      }),
    ).toThrow('Disabled Decap config must not contain writable backend data.');
  });

  it('rejects hosted config containing fallback or placeholder data without echoing it', () => {
    const unsafeConfig = hostedConfig.replace('/sites/site-id/pkce', 'http://localhost/__SET_DECAPBRIDGE_SITE_ID__');

    expect(() =>
      assertDecapBuildArtifacts({ configYaml: unsafeConfig, expectedMode: 'hosted', indexHtml: buildIndex('hosted') }),
    ).toThrow('Hosted Decap config contains unsafe fallback data.');

    try {
      assertDecapBuildArtifacts({ configYaml: unsafeConfig, expectedMode: 'hosted', indexHtml: buildIndex('hosted') });
    } catch (error) {
      expect(String(error)).not.toContain('__SET_DECAPBRIDGE_SITE_ID__');
      expect(String(error)).not.toContain('http://localhost');
    }
  });

  it('rejects a page/config mode mismatch', () => {
    expect(() =>
      assertDecapBuildArtifacts({
        configYaml: disabledConfig,
        expectedMode: 'disabled',
        indexHtml: buildIndex('hosted'),
      }),
    ).toThrow('Generated Decap admin page mode does not match the selected build mode.');
  });

  it('inspects every generated disabled admin text asset for loopback and placeholder data', () => {
    expect(() =>
      assertDisabledAdminAssetTexts({
        'config.yml': disabledConfig,
        'index.html': buildIndex('disabled'),
        'init.js': 'window.__BLACKBOX_ADMIN__ = Object.freeze({ mode: "disabled" });',
      }),
    ).not.toThrow();
    expect(() =>
      assertDisabledAdminAssetTexts({ 'nested/runtime.js': 'const endpoint = "http://localhost/CHANGE_ME";' }),
    ).toThrow('Disabled Decap admin asset nested/runtime.js must not contain localhost or placeholder data.');
  });
});
