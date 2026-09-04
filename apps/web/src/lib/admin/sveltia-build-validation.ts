import { parse } from 'yaml';
import { resolveSveltiaRuntimeConfig, type SveltiaBackendMode } from './sveltia-runtime-config';

export class SveltiaBuildArtifactError extends Error {
  override name = 'SveltiaBuildArtifactError';
}

export function assertSveltiaBuildArtifacts(input: {
  configYaml: string;
  expectedMode: SveltiaBackendMode;
  indexHtml: string;
  bootstrapJs: string;
}): void {
  const { configYaml, expectedMode, indexHtml, bootstrapJs } = input;
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new SveltiaBuildArtifactError(message);
  };
  assert(
    /^# blackbox-sveltia-mode: (local|hosted|disabled)$/m.exec(configYaml)?.[1] === expectedMode,
    'CMS artifact mode does not match the selected build mode.',
  );
  assert(
    indexHtml.includes('id="cms-status"') &&
      indexHtml.includes('src="./init.js"') &&
      indexHtml.includes('href="./config.yml"'),
    'CMS artifact must use the static admin document and relative assets.',
  );
  assert(
    bootstrapJs.includes('https://unpkg.com/@sveltia/cms@0.205.2/dist/sveltia-cms.js'),
    'CMS artifact must pin Sveltia 0.205.2.',
  );
  assert(
    !/decap-cms|decapbridge|git-gateway|\/admin\/media\/|preview-assets\.js/i.test(
      indexHtml + bootstrapJs + configYaml,
    ),
    'CMS artifact contains a retired provider or media route.',
  );
  const config = parse(configYaml);
  if (expectedMode === 'disabled') {
    assert(
      config === null && configYaml.includes('CMS unavailable'),
      'Disabled CMS artifact must contain no writable configuration.',
    );
    return;
  }
  assert(
    config?.backend?.name === 'github' &&
      config.backend.repo === 'BlackBox-Studio-Athens/blackbox-records' &&
      config.backend.branch === 'main' &&
      config.publish_mode === 'simple',
    'Writable CMS must target the fixed GitHub repository and main.',
  );
  assert(
    !/allow_multiple:|options_length:|local_backend:|proxy_url:/.test(configYaml),
    'CMS artifact contains unsupported configuration.',
  );
  if (expectedMode === 'hosted') {
    resolveSveltiaRuntimeConfig({
      environment: { SVELTIA_BACKEND_MODE: 'hosted', SVELTIA_AUTH_BASE_URL: config.backend.base_url ?? '' },
      isDevelopment: false,
    });
    for (const value of [config.site_url, config.display_url, config.logo?.src]) {
      assert(
        typeof value === 'string' &&
          value.startsWith('https://') &&
          !/localhost|127\.|\.invalid\b|example\.com|__|CHANGE_ME|REPLACE_ME/i.test(value),
        'Hosted CMS artifact contains an unsafe site or asset URL.',
      );
    }
    assert(config.site_url === config.display_url, 'Hosted CMS display URL must match the site root.');
  } else {
    assert(!('base_url' in config.backend), 'Local CMS must not configure hosted authentication.');
  }
}

export function assertDisabledAdminAssetTexts(assets: Readonly<Record<string, string>>): void {
  for (const text of Object.values(assets)) {
    if (/https?:\/\/(?:localhost|127\.)|GITHUB_CLIENT_SECRET\s*[:=]|gh[pousr]_[a-zA-Z0-9]{20,}/i.test(text)) {
      throw new SveltiaBuildArtifactError('Disabled CMS assets contain a local endpoint or credential.');
    }
  }
}
