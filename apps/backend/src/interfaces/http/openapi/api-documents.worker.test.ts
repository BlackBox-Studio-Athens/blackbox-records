import { describe, expect, it } from 'vitest';

import { internalContractPaths } from '../stock/internal-contracts';
import { publicContractPaths } from '../contracts/public-contracts';
import { getInternalOpenApiDocument, getPublicOpenApiDocument } from './api-documents';

describe('OpenAPI documents', () => {
  it('emits the public API document', () => {
    const document = getPublicOpenApiDocument();

    expect(document.info.title).toBe('BlackBox Records Public API');
    expect(document.openapi).toBe('3.1.0');
    expect(Object.keys(document.paths ?? {})).toEqual(publicContractPaths);
    expect(JSON.stringify(document).toLowerCase()).not.toContain('cache-control');
    expect(document.paths?.['/api/checkout/sessions']?.post?.operationId).toBe('createCheckoutSession');
    expect(document.paths?.['/api/store/items/{storeItemSlug}']?.get?.operationId).toBe('getStoreItem');
    expect(document.paths?.['/api/store/']?.get?.operationId).toBe('getPublicApiDiscovery');
    expect(document.paths).not.toHaveProperty('/api/internal/');
    expect(JSON.stringify(document)).not.toMatch(/CMS_RUNTIME|STRIPE_SECRET_KEY|\/api\/internal/);
  });

  it('emits coherent catalogStatus-discriminated Store Offer branches', () => {
    const document = getPublicOpenApiDocument();
    const storeOffer = document.components?.schemas?.PublicStoreOffer as {
      oneOf?: Array<{
        properties?: {
          availability?: { properties?: { status?: { enum?: string[] } } };
          canCheckout?: { enum?: boolean[] };
          catalogStatus?: { enum?: string[] };
          price?: { $ref?: string; type?: string };
        };
      }>;
    };

    expect(
      storeOffer.oneOf?.map((branch) => ({
        availability: branch.properties?.availability?.properties?.status?.enum?.[0],
        canCheckout: branch.properties?.canCheckout?.enum?.[0],
        catalogStatus: branch.properties?.catalogStatus?.enum?.[0],
        price: branch.properties?.price?.$ref ?? branch.properties?.price?.type,
      })),
    ).toEqual([
      {
        availability: 'available',
        canCheckout: true,
        catalogStatus: 'ready',
        price: '#/components/schemas/PublicStoreOfferPrice',
      },
      { availability: 'sold_out', canCheckout: false, catalogStatus: 'sold_out', price: 'null' },
      { availability: 'unavailable', canCheckout: false, catalogStatus: 'catalog_drift', price: 'null' },
    ]);
  });

  it('emits the internal API document', () => {
    const document = getInternalOpenApiDocument();

    expect(document.info.title).toBe('BlackBox Records Internal API');
    expect(document.openapi).toBe('3.1.0');
    expect(Object.keys(document.paths ?? {})).toEqual(internalContractPaths);
    expect(JSON.stringify(document).toLowerCase()).not.toContain('cache-control');
    expect(document.paths?.['/api/internal/']?.get?.operationId).toBe('getInternalApiDiscovery');
    expect(document.paths?.['/api/internal/variants/{variantId}/stock']?.get?.operationId).toBe('readVariantStock');
    expect(document.paths?.['/api/internal/variants/{variantId}/stock/zero-stock-state']?.patch?.operationId).toBe(
      'setZeroStockState',
    );
    expect(document.paths?.['/api/internal/variants/{variantId}/price']?.post?.operationId).toBe('changeCatalogPrice');
    expect(document.paths?.['/api/internal/variants/{variantId}/stock/preorder']?.patch?.operationId).toBe(
      'setStockPreorder',
    );
    expect(document.paths?.['/api/internal/variants/{variantId}/publication']?.post?.operationId).toBe(
      'publishCatalogItem',
    );
    expect(document.paths?.['/api/internal/variants']?.get?.responses?.['200']?.headers?.Link).toBeDefined();
    const paths = Object.keys(document.paths ?? {});
    expect(paths.indexOf('/api/internal/variants/{variantId}/stock/preorder')).toBe(
      paths.indexOf('/api/internal/variants/{variantId}/stock/low-stock-notice') + 1,
    );
    const preorder = document.paths?.['/api/internal/variants/{variantId}/stock/preorder']?.patch;
    expect(Object.keys(preorder?.responses ?? {})).toEqual(['200', '400', '401', '404', '409', '503']);
    expect(preorder?.requestBody).toMatchObject({
      content: { 'application/json': { schema: { $ref: '#/components/schemas/SetStockPreorderBody' } } },
    });
    expect(document.components?.schemas?.SetStockPreorderBody).toMatchObject({
      required: ['expectedRevision', 'shipEstimate'],
    });
    expect(document.components?.schemas?.InternalStockState).toMatchObject({
      required: expect.arrayContaining(['showLowStock', 'preorder']),
      properties: { preorder: expect.any(Object) },
    });
  });
});
