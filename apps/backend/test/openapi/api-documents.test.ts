import { describe, expect, it } from 'vitest';

import { internalContractPaths } from '../../src/interfaces/http/contracts/internal-contracts';
import { publicContractPaths } from '../../src/interfaces/http/contracts/public-contracts';
import { getInternalOpenApiDocument, getPublicOpenApiDocument } from '../../src/interfaces/http/openapi/api-documents';

describe('OpenAPI documents', () => {
  it('emits the public API document', () => {
    const document = getPublicOpenApiDocument();

    expect(document.info.title).toBe('BlackBox Records Public API');
    expect(document.openapi).toBe('3.1.0');
    expect(Object.keys(document.paths ?? {})).toEqual(publicContractPaths);
    expect(JSON.stringify(document).toLowerCase()).not.toContain('cache-control');
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
  });
});
