export type DecapBackendMode = 'local' | 'hosted' | 'disabled';

export type DecapLocalRuntimeConfig = {
  localBackendPort: string;
  mode: 'local';
  useLocalBackend: true;
};

export type DecapHostedRuntimeConfig = {
  authEndpoint: string;
  authTokenEndpoint: string;
  mode: 'hosted';
  repository: string;
  siteUrl: string;
  useLocalBackend: false;
};

const decapBackendModes: readonly DecapBackendMode[] = ['local', 'hosted', 'disabled'];
const defaultLocalBackendPort = '8082';

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
    throw new Error(
      'DECAP_BACKEND_MODE must be local, hosted, or disabled when set. Leave it unset to use the environment default.',
    );
  }

  return mode;
}

export function resolveDecapLocalRuntimeConfig(options: {
  environment: Readonly<Record<string, string | undefined>>;
  isDevelopment: boolean;
}): DecapLocalRuntimeConfig | undefined {
  if (resolveDecapBackendMode(options) !== 'local') {
    return undefined;
  }

  const configuredLocalBackendPort = options.environment.DECAP_LOCAL_PROXY_PORT;
  const localBackendPort = configuredLocalBackendPort?.trim() ?? defaultLocalBackendPort;
  const numericLocalBackendPort = Number(localBackendPort);

  if (!/^\d+$/.test(localBackendPort) || numericLocalBackendPort < 1 || numericLocalBackendPort > 65535) {
    throw new Error(
      'DECAP_LOCAL_PROXY_PORT must be a base-10 TCP port from 1 through 65535 when set. Leave it unset to use 8082.',
    );
  }

  return {
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

  const repository = options.environment.DECAP_REPOSITORY?.trim();
  const siteUrl = options.environment.DECAP_SITE_URL?.trim();
  const authEndpoint = options.environment.DECAPBRIDGE_AUTH_ENDPOINT?.trim();
  const authTokenEndpoint = options.environment.DECAPBRIDGE_AUTH_TOKEN_ENDPOINT?.trim();

  if (!repository || !siteUrl || !authEndpoint || !authTokenEndpoint) {
    const missingSettingNames: string[] = [];
    if (!repository) missingSettingNames.push('DECAP_REPOSITORY');
    if (!siteUrl) missingSettingNames.push('DECAP_SITE_URL');
    if (!authEndpoint) missingSettingNames.push('DECAPBRIDGE_AUTH_ENDPOINT');
    if (!authTokenEndpoint) missingSettingNames.push('DECAPBRIDGE_AUTH_TOKEN_ENDPOINT');

    throw new Error(
      `Hosted Decap configuration is missing required setting(s): ${missingSettingNames.join(', ')}. Set each named setting before building with DECAP_BACKEND_MODE=hosted.`,
    );
  }

  return {
    authEndpoint,
    authTokenEndpoint,
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
    authEndpoint.includes('__SET_DECAPBRIDGE_SITE_ID__') || authTokenEndpoint.includes('__SET_DECAPBRIDGE_SITE_ID__')
  );
}
