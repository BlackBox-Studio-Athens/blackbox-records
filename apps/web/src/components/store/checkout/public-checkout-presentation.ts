import { getPublicBackendBaseUrl } from '../../../platform/lib/backend/public-backend-config';

// These presentation helpers must not pull the request client into the listing's eager graph.
export function formatStoreLowStockLabel(lowStockQuantity: number | undefined): string | null {
  return lowStockQuantity && lowStockQuantity > 0 ? `Only ${lowStockQuantity} left` : null;
}

export function resolvePublicCheckoutApiBaseUrl(configuredValue = import.meta.env.PUBLIC_BACKEND_BASE_URL): string {
  return getPublicBackendBaseUrl(configuredValue) ?? '';
}
