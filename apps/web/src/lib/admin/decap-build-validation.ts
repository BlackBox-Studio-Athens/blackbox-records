import type { DecapBackendMode } from './decap-runtime-config';

export class DecapBuildArtifactError extends Error {
  override name = 'DecapBuildArtifactError';
}

export type DecapBuildArtifacts = {
  configYaml: string;
  expectedMode: DecapBackendMode;
  indexHtml: string;
};

const decapModeMarkerPattern = /^# blackbox-decap-mode: (local|hosted|disabled)$/m;
const unsafeHostedValuePattern =
  /(?:__SET_DECAPBRIDGE_SITE_ID__|CHANGE_ME|REPLACE_ME|example\.com|\.invalid\b|localhost|127(?:\.\d{1,3}){3}|\[?::1\]?)/i;
const hostedConnectionValuePattern =
  /^\s*(?:repo|base_url|auth_endpoint|auth_token_endpoint|gateway_url|site_url|display_url|logo_url):\s*(.+?)\s*$/;

function hasUnsafeHostedConnectionValue(configYaml: string): boolean {
  return configYaml.split('\n').some((line) => {
    const configuredValue = hostedConnectionValuePattern.exec(line)?.[1];
    return configuredValue !== undefined && unsafeHostedValuePattern.test(configuredValue);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasHtmlAttribute(html: string, name: string, value?: string): boolean {
  const attributeName = escapeRegExp(name);
  const attributePattern =
    value === undefined
      ? `\\b${attributeName}(?=\\s|=|>|/)`
      : `\\b${attributeName}\\s*=\\s*["']${escapeRegExp(value)}["'](?=\\s|>|/)`;
  return new RegExp(attributePattern, 'i').test(html);
}

function hasCmsConfigLink(html: string): boolean {
  return /<link\b[^>]*\brel\s*=\s*["']cms-config-url["'][^>]*>/i.test(html);
}

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new DecapBuildArtifactError(message);
  }
}

function assertSharedWritableConfig(configYaml: string): void {
  assertCondition(/^publish_mode:\s*simple\s*$/m.test(configYaml), 'Writable Decap build must publish directly.');
  assertCondition(/^\s*branch:\s*["']?main["']?\s*$/m.test(configYaml), 'Writable Decap build must target main.');
}

function assertDisabledBuild(indexHtml: string, configYaml: string): void {
  assertCondition(
    hasHtmlAttribute(indexHtml, 'data-admin-boot-state', 'disabled'),
    'Disabled Decap build must render the unavailable state.',
  );
  assertCondition(!hasCmsConfigLink(indexHtml), 'Disabled Decap build must not advertise a writable config.');
  assertCondition(
    !hasHtmlAttribute(indexHtml, 'data-admin-boot-init-url'),
    'Disabled Decap build must not register the runtime initializer.',
  );
  assertCondition(
    configYaml.includes('BlackBox CMS unavailable for this build.'),
    'Disabled Decap config must identify the unavailable build.',
  );
  assertCondition(
    !/(?:^|\n)\s*(?:backend|repo|proxy_url|auth_endpoint|auth_token_endpoint):/m.test(configYaml),
    'Disabled Decap config must not contain writable backend data.',
  );
  assertCondition(!unsafeHostedValuePattern.test(configYaml), 'Disabled Decap config must not contain loopback data.');
}

function assertLocalBuild(indexHtml: string, configYaml: string): void {
  assertCondition(
    hasHtmlAttribute(indexHtml, 'data-admin-boot-state', 'loading'),
    'Local Decap build must render the loading state.',
  );
  assertCondition(hasCmsConfigLink(indexHtml), 'Local Decap build must advertise its config.');
  assertSharedWritableConfig(configYaml);
  assertCondition(/^\s*name:\s*proxy\s*$/m.test(configYaml), 'Local Decap config must use the proxy backend.');
  assertCondition(
    /^\s*proxy_url:\s*["']?http:\/\/127\.0\.0\.1:\d+\/api\/v1["']?\s*$/m.test(configYaml),
    'Local Decap config must use the explicit loopback proxy.',
  );
}

function assertHostedBuild(indexHtml: string, configYaml: string): void {
  assertCondition(
    hasHtmlAttribute(indexHtml, 'data-admin-boot-state', 'loading'),
    'Hosted Decap build must render the loading state.',
  );
  assertCondition(hasCmsConfigLink(indexHtml), 'Hosted Decap build must advertise its config.');
  assertSharedWritableConfig(configYaml);
  assertCondition(/^\s*name:\s*git-gateway\s*$/m.test(configYaml), 'Hosted Decap config must use git-gateway.');
  assertCondition(/^\s*auth_type:\s*pkce\s*$/m.test(configYaml), 'Hosted Decap config must use PKCE.');
  assertCondition(
    /^\s*repo:\s*(?:["'][^"']+["']|\S+)\s*$/m.test(configYaml),
    'Hosted Decap config must name a repository.',
  );
  assertCondition(
    /^\s*auth_endpoint:\s*(?:["'][^"']+["']|\S+)\s*$/m.test(configYaml),
    'Hosted Decap config must include an auth endpoint.',
  );
  assertCondition(
    /^\s*auth_token_endpoint:\s*(?:["'][^"']+["']|\S+)\s*$/m.test(configYaml),
    'Hosted Decap config must include a token endpoint.',
  );
  assertCondition(!/^\s*name:\s*proxy\s*$/m.test(configYaml), 'Hosted Decap config must not use the proxy backend.');
  assertCondition(!/^\s*proxy_url:/m.test(configYaml), 'Hosted Decap config must not contain a proxy URL.');
  assertCondition(!hasUnsafeHostedConnectionValue(configYaml), 'Hosted Decap config contains unsafe fallback data.');
}

export function assertDecapBuildArtifacts({ configYaml, expectedMode, indexHtml }: DecapBuildArtifacts): void {
  const configMode = decapModeMarkerPattern.exec(configYaml)?.[1];

  assertCondition(configMode !== undefined, 'Generated Decap config is missing its mode marker.');
  assertCondition(configMode === expectedMode, 'Generated Decap config mode does not match the selected build mode.');
  assertCondition(
    hasHtmlAttribute(indexHtml, 'data-admin-boot-root'),
    'Generated Decap admin page is missing the branded boot surface.',
  );
  assertCondition(
    hasHtmlAttribute(indexHtml, 'data-admin-boot-mode', expectedMode),
    'Generated Decap admin page mode does not match the selected build mode.',
  );

  switch (expectedMode) {
    case 'disabled':
      assertDisabledBuild(indexHtml, configYaml);
      break;
    case 'local':
      assertLocalBuild(indexHtml, configYaml);
      break;
    case 'hosted':
      assertHostedBuild(indexHtml, configYaml);
      break;
  }
}

export function assertDisabledAdminAssetTexts(assets: Readonly<Record<string, string>>): void {
  for (const [assetPath, text] of Object.entries(assets)) {
    assertCondition(
      !unsafeHostedValuePattern.test(text),
      `Disabled Decap admin asset ${assetPath} must not contain localhost or placeholder data.`,
    );
  }
}
