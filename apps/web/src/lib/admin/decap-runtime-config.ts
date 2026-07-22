export type DecapBackendMode = 'local' | 'hosted' | 'disabled';

const decapBackendModes: readonly DecapBackendMode[] = ['local', 'hosted', 'disabled'];

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
