import type { APIRoute } from 'astro';
import {
  buildSveltiaConfig,
  createSveltiaConfigErrorResponse,
  createSveltiaConfigResponse,
  normalizeSveltiaConfigError,
} from '@/lib/admin/sveltia-config';
import { resolveSveltiaRuntimeConfig } from '@/lib/admin/sveltia-runtime-config';
import { createProjectRelativeUrl, siteBrandAssets } from '@/config/site';

export const prerender = true;

export const GET: APIRoute = async ({ site, url }) => {
  try {
    const runtimeConfig = resolveSveltiaRuntimeConfig({
      environment: {
        SVELTIA_BACKEND_MODE: import.meta.env.SVELTIA_BACKEND_MODE,
        SVELTIA_AUTH_BASE_URL: import.meta.env.SVELTIA_AUTH_BASE_URL,
      },
      isDevelopment: import.meta.env.DEV,
    });
    if (runtimeConfig.mode === 'disabled') return createSveltiaConfigResponse({ mode: 'disabled' });
    const siteRootUrl = new URL(import.meta.env.BASE_URL, runtimeConfig.mode === 'local' ? url.origin : site).href;
    const logoUrl = new URL(createProjectRelativeUrl(siteBrandAssets.wordmarkLogo), siteRootUrl).href;
    const yaml = buildSveltiaConfig({ logoUrl, runtimeConfig, siteRootUrl });
    return createSveltiaConfigResponse({ mode: runtimeConfig.mode, yaml });
  } catch (error) {
    const safeError = normalizeSveltiaConfigError(error);
    if (import.meta.env.DEV) return createSveltiaConfigErrorResponse(safeError);
    throw safeError;
  }
};
