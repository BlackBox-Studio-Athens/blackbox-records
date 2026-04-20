import { describe, expect, it } from 'vitest';

import { createHttpApp } from '../../src/interfaces/http/app';

describe('createHttpApp', () => {
    it('returns 404 for unmatched routes', async () => {
        const app = createHttpApp();

        const response = await app.request('http://backend.test/nope');

        expect(response.status).toBe(404);
    });

    it('returns a JSON fallback body for unmatched routes', async () => {
        const app = createHttpApp();

        const response = await app.request('http://backend.test/nope');

        await expect(response.json()).resolves.toEqual({
            error: 'Not Found',
        });
    });

    it('returns JSON content type for unmatched routes', async () => {
        const app = createHttpApp();

        const response = await app.request('http://backend.test/nope');

        expect(response.headers.get('content-type')).toContain('application/json');
    });
});
