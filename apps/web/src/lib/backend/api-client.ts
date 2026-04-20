export { createPublicApiClient } from '@blackbox/api-client';

export type { PublicApiClient, PublicApiComponents, PublicApiOperations, PublicApiPaths } from '@blackbox/api-client';

import { createPublicApiClient } from '@blackbox/api-client';

import { getPublicBackendBaseUrl } from './public-backend-config';

export function createConfiguredPublicApiClient() {
    const backendBaseUrl = getPublicBackendBaseUrl();

    if (!backendBaseUrl) {
        return null;
    }

    return createPublicApiClient(backendBaseUrl);
}
