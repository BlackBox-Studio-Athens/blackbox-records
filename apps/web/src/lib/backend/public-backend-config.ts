import { privatePreview } from '../private-preview';

export function normalizePublicBackendBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getPublicBackendBaseUrl(configuredValue = import.meta.env.PUBLIC_BACKEND_BASE_URL): string | null {
  const preview = privatePreview();
  if (preview) return `${window.location.origin}/_preview/api/${preview.context}`;
  const configuredBaseUrl = configuredValue?.trim();

  if (!configuredBaseUrl) {
    return null;
  }

  return normalizePublicBackendBaseUrl(configuredBaseUrl);
}
