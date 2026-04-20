import { Fetcher } from 'openapi-typescript-fetch';

import type { paths as InternalApiPaths } from './generated/internal/schema';

export function createInternalApiFetcher(baseUrl: string) {
    const fetcher = Fetcher.for<InternalApiPaths>();

    fetcher.configure({
        baseUrl,
    });

    return fetcher;
}

export type InternalApiFetcher = ReturnType<typeof createInternalApiFetcher>;
