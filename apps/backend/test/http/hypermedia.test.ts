import { describe, expect, it } from 'vitest';

import {
  addHypermedia,
  addLinkHeader,
  apiAction,
  apiLink,
  apiPath,
  hypermediaMetadataSchema,
} from '../../src/interfaces/http/responses';

describe('HTTP hypermedia helpers', () => {
  it('encodes each app identity as one path segment', () => {
    expect(apiPath('api', 'store', 'items', 'a/b c?')).toBe('/api/store/items/a%2Fb%20c%3F');
  });

  it('does not emit unsafe external or malformed Link destinations', () => {
    const response = new Response();
    addLinkHeader(response, [
      { href: '/api/store/items/safe', rel: 'self' },
      { href: 'https://evil.example/steal', rel: 'evil' },
      { href: '//evil.example/steal', rel: 'evil' },
      { href: '/api/store/items/bad\r\nX-Evil: 1', rel: 'evil' },
    ]);

    expect(response.headers.get('Link')).toBe('</api/store/items/safe>; rel="self"');
  });

  it('keeps metadata optional for legacy object responses', () => {
    expect(hypermediaMetadataSchema.parse({})).toEqual({});
    expect(addHypermedia({ id: 'legacy' }, [])).toEqual({ id: 'legacy', links: [] });
  });

  it('defaults typed links and actions to JSON', () => {
    expect(apiLink({ href: '/api/store', rel: 'self' })).toEqual({
      href: '/api/store',
      rel: 'self',
      type: 'application/json',
    });
    expect(
      apiAction({ href: '/api/checkout/sessions', method: 'POST', operationRef: 'createCheckout', rel: 'checkout' }),
    ).toMatchObject({ type: 'application/json' });
  });
});
