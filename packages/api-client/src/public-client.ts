import { Fetcher } from 'openapi-typescript-fetch';

import type { paths as PublicApiPaths } from './generated/public/schema';

export function createPublicApiFetcher(baseUrl: string) {
    const fetcher = Fetcher.for<PublicApiPaths>();

    fetcher.configure({
        baseUrl,
    });

    return fetcher;
}

export type PublicApiFetcher = ReturnType<typeof createPublicApiFetcher>;
