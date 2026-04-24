import { describe, expect, it } from 'vitest';

import { getInternalOpenApiDocument, getPublicOpenApiDocument } from '../../src/interfaces/http/openapi/api-documents';

describe('OpenAPI documents', () => {
    it('emits the public API document', () => {
        const document = getPublicOpenApiDocument();

        expect(document.info.title).toBe('BlackBox Records Public API');
        expect(document.openapi).toBe('3.1.0');
        expect(Object.keys(document.paths ?? {})).toHaveLength(0);
    });

    it('emits the internal API document', () => {
        const document = getInternalOpenApiDocument();

        expect(document.info.title).toBe('BlackBox Records Internal API');
        expect(document.openapi).toBe('3.1.0');
        expect(Object.keys(document.paths ?? {})).toEqual([
            '/api/internal/variants',
            '/api/internal/variants/{variantId}/stock',
            '/api/internal/variants/{variantId}/stock/history',
            '/api/internal/variants/{variantId}/stock/changes',
            '/api/internal/variants/{variantId}/stock/counts',
        ]);
    });
});
