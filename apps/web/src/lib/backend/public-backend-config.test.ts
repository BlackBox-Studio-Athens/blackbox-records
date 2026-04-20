import { describe, expect, it } from 'vitest';

import { getPublicBackendBaseUrl, normalizePublicBackendBaseUrl } from './public-backend-config';

describe('getPublicBackendBaseUrl', () => {
    it('returns null when PUBLIC_BACKEND_BASE_URL is unset', () => {
        expect(getPublicBackendBaseUrl(undefined)).toBeNull();
    });

    it('returns null when PUBLIC_BACKEND_BASE_URL is blank', () => {
        expect(getPublicBackendBaseUrl('   ')).toBeNull();
    });

    it('normalizes a trailing slash from PUBLIC_BACKEND_BASE_URL', () => {
        expect(getPublicBackendBaseUrl('http://127.0.0.1:8787/')).toBe('http://127.0.0.1:8787');
    });
});

describe('normalizePublicBackendBaseUrl', () => {
    it('removes repeated trailing slashes', () => {
        expect(normalizePublicBackendBaseUrl('https://sandbox.example.workers.dev///')).toBe(
            'https://sandbox.example.workers.dev',
        );
    });
});
