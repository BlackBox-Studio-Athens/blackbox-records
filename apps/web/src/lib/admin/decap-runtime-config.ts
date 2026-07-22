export type DecapBackendMode = 'local' | 'hosted' | 'disabled';

export type DecapLocalRuntimeConfig = {
  branch: 'main';
  localBackendPort: string;
  mode: 'local';
  useLocalBackend: true;
};

export type DecapHostedRuntimeConfig = {
  authEndpoint: string;
  authTokenEndpoint: string;
  baseUrl: string;
  branch: 'main';
  gatewayUrl: string;
  mode: 'hosted';
  repository: string;
  siteUrl: string;
  useLocalBackend: false;
};

export type DecapDisabledRuntimeConfig = {
  mode: 'disabled';
};

export type DecapRuntimeConfig = DecapLocalRuntimeConfig | DecapHostedRuntimeConfig | DecapDisabledRuntimeConfig;

export class DecapRuntimeConfigError extends Error {
  override name = 'DecapRuntimeConfigError';
}

const decapBackendModes: readonly DecapBackendMode[] = ['local', 'hosted', 'disabled'];
export const decapPublishingBranch = 'main';
const defaultDecapBridgeBaseUrl = 'https://auth.decapbridge.com';
const defaultDecapBridgeGatewayUrl = 'https://gateway.decapbridge.com';
const defaultLocalBackendPort = '8082';
const decapBridgeSiteIdPlaceholder = '__SET_DECAPBRIDGE_SITE_ID__';
const hostedEndpointBaseUrl = 'https://decap.invalid';

function isValidHostedAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

function isValidHostedEndpointPath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false;

  try {
    const url = new URL(value, hostedEndpointBaseUrl);
    return url.origin === hostedEndpointBaseUrl && !url.hash;
  } catch {
    return false;
  }
}

function hasLoopbackUrlHost(value: string | undefined): boolean {
  if (!value) return false;

  let hostname: string;

  try {
    hostname = new URL(value).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return false;
  }

  const unbracketedHostname = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;

  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname) ||
    unbracketedHostname === '::1'
  );
}

export function parseDecapBackendMode(environment: Readonly<Record<string, string | undefined>>): {
  configuredValue: string | undefined;
  mode: DecapBackendMode | undefined;
} {
  const configuredValue = environment.DECAP_BACKEND_MODE?.trim();

  // Defaulting and explicit-value rejection belong to later resolution steps.
  return {
    configuredValue,
    mode: decapBackendModes.find((mode) => mode === configuredValue),
  };
}

export function resolveDecapBackendMode(options: {
  environment: Readonly<Record<string, string | undefined>>;
  isDevelopment: boolean;
}): DecapBackendMode {
  const { configuredValue, mode } = parseDecapBackendMode(options.environment);

  if (configuredValue === undefined) {
    return options.isDevelopment ? 'local' : 'disabled';
  }

  if (!mode) {
    throw new DecapRuntimeConfigError(
      'DECAP_BACKEND_MODE must be local, hosted, or disabled when set. Leave it unset to use the environment default.',
    );
  }

  return mode;
}

export function resolveDecapPublishingBranch(
  environment: Readonly<Record<string, string | undefined>>,
): typeof decapPublishingBranch {
  const configuredBranch = environment.DECAP_BRANCH?.trim();

  if (configuredBranch && configuredBranch !== decapPublishingBranch) {
    throw new DecapRuntimeConfigError(
      'DECAP_BRANCH must be main when set. Leave it unset or set it to main for direct-to-main publishing.',
    );
  }

  return decapPublishingBranch;
}

export function resolveDecapRuntimeConfig(options: {
  environment: Readonly<Record<string, string | undefined>>;
  isDevelopment: boolean;
}): DecapRuntimeConfig {
  const mode = resolveDecapBackendMode(options);

  if (mode === 'disabled') {
    return { mode };
  }

  return mode === 'local' ? resolveDecapLocalRuntimeConfig(options)! : resolveDecapHostedRuntimeConfig(options)!;
}

export function resolveDecapLocalRuntimeConfig(options: {
  environment: Readonly<Record<string, string | undefined>>;
  isDevelopment: boolean;
}): DecapLocalRuntimeConfig | undefined {
  if (resolveDecapBackendMode(options) !== 'local') {
    return undefined;
  }

  const branch = resolveDecapPublishingBranch(options.environment);
  const configuredLocalBackendPort = options.environment.DECAP_LOCAL_PROXY_PORT;
  const localBackendPort = configuredLocalBackendPort?.trim() ?? defaultLocalBackendPort;
  const numericLocalBackendPort = Number(localBackendPort);

  if (!/^\d+$/.test(localBackendPort) || numericLocalBackendPort < 1 || numericLocalBackendPort > 65535) {
    throw new DecapRuntimeConfigError(
      'DECAP_LOCAL_PROXY_PORT must be a base-10 TCP port from 1 through 65535 when set. Leave it unset to use 8082.',
    );
  }

  return {
    branch,
    localBackendPort,
    mode: 'local',
    useLocalBackend: true,
  };
}

export function resolveDecapHostedRuntimeConfig(options: {
  environment: Readonly<Record<string, string | undefined>>;
  isDevelopment: boolean;
}): DecapHostedRuntimeConfig | undefined {
  if (resolveDecapBackendMode(options) !== 'hosted') {
    return undefined;
  }

  const branch = resolveDecapPublishingBranch(options.environment);
  const repository = options.environment.DECAP_REPOSITORY?.trim();
  const siteUrl = options.environment.DECAP_SITE_URL?.trim();
  const baseUrl = options.environment.DECAPBRIDGE_BASE_URL?.trim() || defaultDecapBridgeBaseUrl;
  const authEndpoint = options.environment.DECAPBRIDGE_AUTH_ENDPOINT?.trim();
  const authTokenEndpoint = options.environment.DECAPBRIDGE_AUTH_TOKEN_ENDPOINT?.trim();
  const gatewayUrl = options.environment.DECAPBRIDGE_GATEWAY_URL?.trim() || defaultDecapBridgeGatewayUrl;

  if (!repository || !siteUrl || !authEndpoint || !authTokenEndpoint) {
    const missingSettingNames: string[] = [];
    if (!repository) missingSettingNames.push('DECAP_REPOSITORY');
    if (!siteUrl) missingSettingNames.push('DECAP_SITE_URL');
    if (!authEndpoint) missingSettingNames.push('DECAPBRIDGE_AUTH_ENDPOINT');
    if (!authTokenEndpoint) missingSettingNames.push('DECAPBRIDGE_AUTH_TOKEN_ENDPOINT');

    throw new DecapRuntimeConfigError(
      `Hosted Decap configuration is missing required setting(s): ${missingSettingNames.join(', ')}. Set each named setting before building with DECAP_BACKEND_MODE=hosted.`,
    );
  }

  const placeholderSettingNames = [
    ['DECAP_REPOSITORY', repository],
    ['DECAP_SITE_URL', siteUrl],
    ['DECAPBRIDGE_AUTH_ENDPOINT', authEndpoint],
    ['DECAPBRIDGE_AUTH_TOKEN_ENDPOINT', authTokenEndpoint],
  ]
    .filter(([, value]) => value?.includes(decapBridgeSiteIdPlaceholder))
    .map(([settingName]) => settingName);

  if (placeholderSettingNames.length > 0) {
    throw new DecapRuntimeConfigError(
      `Hosted Decap configuration contains placeholder value(s) for setting(s): ${placeholderSettingNames.join(', ')}. Replace each named setting with its deployment value before building with DECAP_BACKEND_MODE=hosted.`,
    );
  }

  const loopbackSettingNames = [
    ['DECAP_SITE_URL', siteUrl],
    ['DECAPBRIDGE_BASE_URL', baseUrl],
    ['DECAPBRIDGE_AUTH_ENDPOINT', authEndpoint],
    ['DECAPBRIDGE_AUTH_TOKEN_ENDPOINT', authTokenEndpoint],
    ['DECAPBRIDGE_GATEWAY_URL', gatewayUrl],
  ]
    .filter(([, value]) => hasLoopbackUrlHost(value))
    .map(([settingName]) => settingName);

  if (loopbackSettingNames.length > 0) {
    throw new DecapRuntimeConfigError(
      `Hosted Decap configuration uses loopback host(s) for setting(s): ${loopbackSettingNames.join(', ')}. Replace each named setting with a hosted deployment URL before building with DECAP_BACKEND_MODE=hosted.`,
    );
  }

  const invalidUrlSettingNames = [
    ['DECAP_SITE_URL', isValidHostedAbsoluteUrl(siteUrl)],
    ['DECAPBRIDGE_BASE_URL', isValidHostedAbsoluteUrl(baseUrl)],
    ['DECAPBRIDGE_AUTH_ENDPOINT', isValidHostedEndpointPath(authEndpoint)],
    ['DECAPBRIDGE_AUTH_TOKEN_ENDPOINT', isValidHostedEndpointPath(authTokenEndpoint)],
    ['DECAPBRIDGE_GATEWAY_URL', isValidHostedAbsoluteUrl(gatewayUrl)],
  ]
    .filter(([, isValid]) => !isValid)
    .map(([settingName]) => settingName);

  if (invalidUrlSettingNames.length > 0) {
    throw new DecapRuntimeConfigError(
      `Hosted Decap configuration has invalid URL setting(s): ${invalidUrlSettingNames.join(', ')}. DECAP_SITE_URL, DECAPBRIDGE_BASE_URL, and DECAPBRIDGE_GATEWAY_URL must be absolute HTTPS URLs. DECAPBRIDGE_AUTH_ENDPOINT and DECAPBRIDGE_AUTH_TOKEN_ENDPOINT must be root-relative endpoint paths. URL settings must not include credentials or fragments.`,
    );
  }

  return {
    authEndpoint,
    authTokenEndpoint,
    baseUrl,
    branch,
    gatewayUrl,
    mode: 'hosted',
    repository,
    siteUrl,
    useLocalBackend: false,
  };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

export function resolveDecapSiteRootUrl(options: {
  baseUrl: string;
  configuredSiteUrl?: string;
  useLocalBackend: boolean;
  localCmsPort: string;
  site?: string;
}): string {
  if (!options.useLocalBackend && options.site) {
    return ensureTrailingSlash(new URL(options.baseUrl, options.site).toString());
  }

  const configuredSiteUrl = options.configuredSiteUrl?.trim();
  if (!options.useLocalBackend && configuredSiteUrl) {
    return ensureTrailingSlash(configuredSiteUrl);
  }

  const siteOrigin = options.useLocalBackend ? `http://127.0.0.1:${options.localCmsPort}` : options.site;
  return ensureTrailingSlash(new URL(options.baseUrl, siteOrigin).toString());
}

export function shouldUseLocalDecapBackend(options: {
  authEndpoint?: string;
  authTokenEndpoint?: string;
  isDevelopment: boolean;
}): boolean {
  if (options.isDevelopment) {
    return true;
  }

  const authEndpoint = options.authEndpoint?.trim();
  const authTokenEndpoint = options.authTokenEndpoint?.trim();

  if (!authEndpoint || !authTokenEndpoint) {
    return true;
  }

  return (
    authEndpoint.includes(decapBridgeSiteIdPlaceholder) || authTokenEndpoint.includes(decapBridgeSiteIdPlaceholder)
  );
}
