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

  it('emits the internal API document', () => {
    const document = getInternalOpenApiDocument();

    expect(document.info.title).toBe('BlackBox Records Internal API');
    expect(document.openapi).toBe('3.1.0');
    expect(Object.keys(document.paths ?? {})).toEqual(internalContractPaths);
    expect(JSON.stringify(document).toLowerCase()).not.toContain('cache-control');
  });
});
