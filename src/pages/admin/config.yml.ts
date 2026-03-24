import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

import { buildDecapConfig, resolveDecapSiteRootUrl, shouldUseLocalDecapBackend } from '@/lib/admin/decap-config';
import { createProjectRelativeUrl } from '@/config/site';

export const prerender = true;

const defaultRepository = 'BlackBox-Studio-Athens/blackbox-records';
const defaultBranch = 'main';
const defaultDecapBridgeBaseUrl = 'https://auth.decapbridge.com';
const defaultDecapBridgeAuthEndpoint = '/sites/__SET_DECAPBRIDGE_SITE_ID__/pkce';
const defaultDecapBridgeAuthTokenEndpoint = '/sites/__SET_DECAPBRIDGE_SITE_ID__/token';
const defaultDecapBridgeGatewayUrl = 'https://gateway.decapbridge.com';
const localBackendPort = '8082';
const localCmsPort = '4322';

export const GET: APIRoute = async () => {
  const artistEntries = await getCollection('artists');
  const artistOptions = artistEntries
    .map((entry) => ({
      label: entry.data.title,
      value: entry.id,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const authEndpoint = import.meta.env.DECAPBRIDGE_AUTH_ENDPOINT?.trim() || defaultDecapBridgeAuthEndpoint;
  const authTokenEndpoint =
    import.meta.env.DECAPBRIDGE_AUTH_TOKEN_ENDPOINT?.trim() || defaultDecapBridgeAuthTokenEndpoint;
  const useLocalBackend = shouldUseLocalDecapBackend({
    authEndpoint,
    authTokenEndpoint,
    isDevelopment: import.meta.env.DEV,
  });
  const siteRootUrl = resolveDecapSiteRootUrl({
    baseUrl: import.meta.env.BASE_URL,
    configuredSiteUrl: import.meta.env.DECAP_SITE_URL,
    useLocalBackend,
    localCmsPort: import.meta.env.CMS_DEV_PORT?.trim() || localCmsPort,
    site: import.meta.env.SITE,
  });
  const logoUrl = new URL(createProjectRelativeUrl('/assets/images/brand/logo.png'), siteRootUrl).toString();

  const yaml = buildDecapConfig({
    artistOptions,
    authEndpoint,
    authTokenEndpoint,
    baseUrl: import.meta.env.DECAPBRIDGE_BASE_URL?.trim() || defaultDecapBridgeBaseUrl,
    branch: import.meta.env.DECAP_BRANCH?.trim() || defaultBranch,
    gatewayUrl: import.meta.env.DECAPBRIDGE_GATEWAY_URL?.trim() || defaultDecapBridgeGatewayUrl,
    useLocalBackend,
    localBackendPort: import.meta.env.DECAP_LOCAL_PROXY_PORT?.trim() || localBackendPort,
    logoUrl,
    repository: import.meta.env.DECAP_REPOSITORY?.trim() || defaultRepository,
    siteRootUrl,
  });

  return new Response(yaml, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/yaml; charset=utf-8',
    },
  });
};
