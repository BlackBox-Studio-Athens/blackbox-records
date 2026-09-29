import { createPublicApiFetcher } from '@blackbox/api-client/public';

import { getPublicBackendBaseUrl } from './public-backend-config';

export function createConfiguredPublicApiFetcher(configuredValue?: string) {
  const backendBaseUrl = getPublicBackendBaseUrl(configuredValue);

  if (!backendBaseUrl) {
    return null;
  }

  return createPublicApiFetcher(backendBaseUrl);
}
