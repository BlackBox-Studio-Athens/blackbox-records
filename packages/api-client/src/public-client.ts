import createClient from 'openapi-fetch';

import type { paths as PublicApiPaths } from './generated/public/schema';

export function createPublicApiClient(baseUrl: string) {
    return createClient<PublicApiPaths>({
        baseUrl,
    });
}

export type PublicApiClient = ReturnType<typeof createPublicApiClient>;
