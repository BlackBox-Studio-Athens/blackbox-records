import { describe, expect, it } from 'vitest';

import {
  buildProblemDetails,
  cmsNestedProblemResponse,
  cmsStringProblemResponse,
} from '../../src/interfaces/http/responses';

describe('RFC 9457 problem details', () => {
  it('keeps standard fields stable while preserving CMS legacy errors', async () => {
    expect(buildProblemDetails({ code: 'publication_unavailable', status: 503 })).toEqual({
      type: '/problems/publication_unavailable',
      title: 'Publication unavailable.',
      status: 503,
      detail: 'Publication is temporarily unavailable.',
      code: 'publication_unavailable',
    });

    const stringResponse = cmsStringProblemResponse(503, 'PUBLICATION_UNAVAILABLE');
    expect(stringResponse.headers.get('content-type')).toBe('application/problem+json');
    expect(stringResponse.headers.get('cache-control')).toBe('private, no-store');
    await expect(stringResponse.json()).resolves.toMatchObject({
      type: '/problems/publication_unavailable',
      status: 503,
      code: 'publication_unavailable',
      error: 'PUBLICATION_UNAVAILABLE',
    });

    const nestedResponse = cmsNestedProblemResponse(400, { code: 'INVALID_IMAGE' });
    await expect(nestedResponse.json()).resolves.toMatchObject({
      type: '/problems/invalid_image',
      status: 400,
      code: 'invalid_image',
      error: { code: 'INVALID_IMAGE' },
    });
  });
});
