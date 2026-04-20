import { describe, expect, it } from 'vitest';

import { createConfiguredPublicApiFetcher } from './api-client';

describe('createConfiguredPublicApiFetcher', () => {
    it('returns null when the backend base URL is unset', () => {
        expect(createConfiguredPublicApiFetcher()).toBeNull();
    });

    it('returns a configured fetcher when the backend base URL is set', () => {
        const fetcher = createConfiguredPublicApiFetcher('http://127.0.0.1:8787/');

        expect(fetcher).not.toBeNull();
        expect(typeof fetcher?.configure).toBe('function');
    });
});
