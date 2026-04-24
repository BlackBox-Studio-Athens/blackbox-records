export { createPublicApiFetcher } from '@blackbox/api-client';

export type {
    InternalApiComponents,
    InternalApiFetcher,
    InternalApiOperations,
    InternalApiPaths,
    PublicApiComponents,
    PublicApiFetcher,
    PublicApiOperations,
    PublicApiPaths,
} from '@blackbox/api-client';

import { createPublicApiFetcher } from '@blackbox/api-client';

import { getPublicBackendBaseUrl } from './public-backend-config';

export function createConfiguredPublicApiFetcher(configuredValue?: string) {
    const backendBaseUrl = getPublicBackendBaseUrl(configuredValue);

    if (!backendBaseUrl) {
        return null;
    }

    return createPublicApiFetcher(backendBaseUrl);
}
