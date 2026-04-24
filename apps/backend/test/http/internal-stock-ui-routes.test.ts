import { describe, expect, it } from 'vitest';

import { CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER } from '../../src/interfaces/http/auth';
import { createHttpApp } from '../../src/interfaces/http/app';

describe('internal stock UI routes', () => {
    it('requires an Access-authenticated operator identity for the stock overview', async () => {
        const app = createHttpApp();

        const response = await app.request('http://backend.test/stock/');

        expect(response.status).toBe(401);
        await expect(response.text()).resolves.toBe('Missing operator identity.');
    });

    it('requires an Access-authenticated operator identity for stock detail', async () => {
        const app = createHttpApp();

        const response = await app.request('http://backend.test/stock/variant_barren-point_standard/');

        expect(response.status).toBe(401);
    });

    it('renders the stock overview HTML for operators', async () => {
        const app = createHttpApp();

        const response = await app.request('http://backend.test/stock/', {
            headers: {
                [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
            },
        });
        const html = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/html');
        expect(html).toContain('data-stock-overview');
        expect(html).toContain('data-stock-search-form');
        expect(html).toContain('/api/internal/variants?');
        expect(html).toContain('operator@blackboxrecords.example');
    });

    it('renders stock detail HTML with forms and target variant id', async () => {
        const app = createHttpApp();

        const response = await app.request('http://backend.test/stock/variant_barren-point_standard/', {
            headers: {
                [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
            },
        });
        const html = await response.text();

        expect(response.status).toBe(200);
        expect(html).toContain('data-stock-detail');
        expect(html).toContain('variant_barren-point_standard');
        expect(html).toContain('data-stock-change-form');
        expect(html).toContain('data-stock-count-form');
        expect(html).toContain('data-stock-history');
        expect(html).toContain('/api/internal/variants/');
    });
});
