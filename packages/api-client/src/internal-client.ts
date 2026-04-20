import createClient from 'openapi-fetch';

import type { paths as InternalApiPaths } from './generated/internal/schema';

export function createInternalApiClient(baseUrl: string) {
    return createClient<InternalApiPaths>({
        baseUrl,
    });
}

export type InternalApiClient = ReturnType<typeof createInternalApiClient>;
