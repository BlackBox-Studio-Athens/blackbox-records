export type DecapBackendMode = 'local' | 'hosted' | 'disabled';

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
