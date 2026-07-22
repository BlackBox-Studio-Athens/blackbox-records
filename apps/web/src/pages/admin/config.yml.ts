import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

import {
  buildDecapConfig,
  createDecapConfigErrorResponse,
  createDecapConfigResponse,
  normalizeDecapConfigError,
} from '@/lib/admin/decap-config';
import { resolveDecapRuntimeConfig, resolveDecapSiteRootUrl } from '@/lib/admin/decap-runtime-config';
import { createProjectRelativeUrl } from '@/config/site';

export const prerender = true;

const localCmsPort = '4322';

export const GET: APIRoute = async () => {
  let runtimeConfig;

  try {
    runtimeConfig = resolveDecapRuntimeConfig({
      environment: {
        DECAP_BACKEND_MODE: import.meta.env.DECAP_BACKEND_MODE,
        DECAP_BRANCH: import.meta.env.DECAP_BRANCH,
        DECAP_LOCAL_PROXY_PORT: import.meta.env.DECAP_LOCAL_PROXY_PORT,
        DECAP_REPOSITORY: import.meta.env.DECAP_REPOSITORY,
        DECAP_SITE_URL: import.meta.env.DECAP_SITE_URL,
        DECAPBRIDGE_AUTH_ENDPOINT: import.meta.env.DECAPBRIDGE_AUTH_ENDPOINT,
        DECAPBRIDGE_AUTH_TOKEN_ENDPOINT: import.meta.env.DECAPBRIDGE_AUTH_TOKEN_ENDPOINT,
        DECAPBRIDGE_BASE_URL: import.meta.env.DECAPBRIDGE_BASE_URL,
        DECAPBRIDGE_GATEWAY_URL: import.meta.env.DECAPBRIDGE_GATEWAY_URL,
      },
      isDevelopment: import.meta.env.DEV,
    });
  } catch (error) {
    const safeError = normalizeDecapConfigError(error);
    if (import.meta.env.DEV) return createDecapConfigErrorResponse(safeError);
    throw safeError;
  }

  if (runtimeConfig.mode === 'disabled') {
    return createDecapConfigResponse(runtimeConfig);
  }

  const artistEntries = await getCollection('artists');
  const artistOptions = artistEntries
    .map((entry) => ({
      label: entry.data.title,
      value: entry.id,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const siteRootUrl = resolveDecapSiteRootUrl({
    baseUrl: import.meta.env.BASE_URL,
    ...(runtimeConfig.mode === 'hosted' ? { configuredSiteUrl: runtimeConfig.siteUrl } : {}),
    useLocalBackend: runtimeConfig.mode === 'local',
    localCmsPort: import.meta.env.CMS_DEV_PORT?.trim() || localCmsPort,
  });
  const logoUrl = new URL(createProjectRelativeUrl('/assets/images/brand/logo.png'), siteRootUrl).toString();

  const yaml = buildDecapConfig({
    artistOptions,
    logoUrl,
    runtimeConfig,
    siteRootUrl,
  });

  return createDecapConfigResponse({ mode: runtimeConfig.mode, yaml });
};
