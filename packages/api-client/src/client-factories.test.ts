import { describe, expect, it } from 'vitest';

import { createInternalApiFetcher } from './internal-client';
import { createPublicApiFetcher } from './public-client';

describe('api client fetchers', () => {
  it('creates a public API fetcher', () => {
    const fetcher = createPublicApiFetcher('http://127.0.0.1:8787');

    expect(fetcher).toBeDefined();
    expect(typeof fetcher.configure).toBe('function');
  });

  it('creates an internal API fetcher', () => {
    const fetcher = createInternalApiFetcher('https://sandbox.example.workers.dev');

    expect(fetcher).toBeDefined();
    expect(typeof fetcher.configure).toBe('function');
  });
});
