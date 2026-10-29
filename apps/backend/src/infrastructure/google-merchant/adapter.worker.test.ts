import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import type { MerchantProductInput } from '../../application/commerce/merchant-sync';
import { GoogleMerchantAdapter, GoogleMerchantError, type GoogleMerchantConfig } from './adapter';

let keyPair: CryptoKeyPair;
let config: GoogleMerchantConfig;
const input: MerchantProductInput = {
  offerId: 'variant_record',
  contentLanguage: 'en',
  feedLabel: 'GR',
  productAttributes: {
    title: 'Record',
    description: 'Physical record',
    link: 'https://shop.example/record/',
    imageLink: 'https://shop.example/record.jpg',
    availability: 'IN_STOCK',
    condition: 'NEW',
    price: { amountMicros: '25000000', currencyCode: 'EUR' },
  },
};
const source = {
  name: 'accounts/123/dataSources/456',
  input: 'API',
  primaryProductDataSource: {
    contentLanguage: 'en',
    feedLabel: 'GR',
    countries: ['GR'],
    destinations: [
      { destination: 'FREE_LISTINGS', state: 'ENABLED' },
      { destination: 'SHOPPING_ADS', state: 'DISABLED' },
    ],
  },
};

beforeAll(async () => {
  keyPair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  config = {
    accountId: '123',
    dataSourceId: '456',
    expectedTestAccount: true,
    serviceAccount: {
      client_email: 'fixture@project.iam.gserviceaccount.com',
      private_key: `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey))))}\n-----END PRIVATE KEY-----`,
    },
  };
});
afterEach(() => vi.useRealTimers());

function fixture() {
  const fetcher = vi.fn<typeof fetch>(async (url, init) => {
    const path = String(url);
    if (path.includes('oauth2'))
      return Response.json({ access_token: 'fixture-access', token_type: 'Bearer', expires_in: 3600 });
    if (path.includes('/datasources/')) return Response.json(source);
    if (path.endsWith('/accounts/123'))
      return Response.json({ name: 'accounts/123', accountId: '123', testAccount: true });
    if (init?.method === 'DELETE') return Response.json({});
    const body = JSON.parse(String(init?.body)) as MerchantProductInput;
    return Response.json({ ...body, name: `accounts/123/productInputs/en~GR~${body.offerId}` });
  });
  return { fetcher, adapter: new GoogleMerchantAdapter(config, { fetch: fetcher }) };
}

it('preserves the native workerd fetch receiver on the default transport', async () => {
  const nativeFetch = globalThis.fetch;
  const checkReceiver = async (receiver: unknown) => {
    const response = await Reflect.apply(nativeFetch, receiver, ['data:text/plain,receiver-check']);
    await response.body?.cancel();
  };
  await expect(checkReceiver({})).rejects.toThrow('Illegal invocation');
  const { fetcher } = fixture();
  const transport = vi.spyOn(globalThis, 'fetch').mockImplementation(async function (this: unknown, url, init) {
    await checkReceiver(this);
    return fetcher(url, init);
  });
  try {
    await new GoogleMerchantAdapter(config).verifySource();
    expect(transport).toHaveBeenCalledTimes(3);
  } finally {
    transport.mockRestore();
  }
});

it('signs the content-scope assertion and reuses its token only inside the adapter instance', async () => {
  const { adapter, fetcher } = fixture();
  const started = Math.floor(Date.now() / 1000);
  await adapter.verifySource();
  await adapter.upsert(input);
  await adapter.remove(input.offerId);
  expect(fetcher).toHaveBeenCalledTimes(5);
  const [tokenUrl, tokenInit] = fetcher.mock.calls[0]!;
  expect(tokenUrl).toBe('https://oauth2.googleapis.com/token');
  const body = new URLSearchParams(String(tokenInit?.body));
  expect(body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
  const assertion = body.get('assertion')!;
  const [header, claims, signature] = assertion.split('.') as [string, string, string];
  const decode = (value: string) =>
    Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  expect(JSON.parse(new TextDecoder().decode(decode(header)))).toEqual({ alg: 'RS256', typ: 'JWT' });
  expect(JSON.parse(new TextDecoder().decode(decode(claims)))).toMatchObject({
    iss: config.serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/content',
    aud: 'https://oauth2.googleapis.com/token',
    iat: expect.any(Number),
    exp: expect.any(Number),
  });
  const times = JSON.parse(new TextDecoder().decode(decode(claims))) as { iat: number; exp: number };
  expect(times.iat).toBeGreaterThanOrEqual(started);
  expect(times.exp - times.iat).toBe(3600);
  expect(
    await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      keyPair.publicKey,
      decode(signature),
      new TextEncoder().encode(`${header}.${claims}`),
    ),
  ).toBe(true);
  for (const [, init] of fetcher.mock.calls) {
    expect(init?.redirect).toBe('manual');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  }
  expect(
    fetcher.mock.calls
      .slice(1)
      .every(([, init]) => new Headers(init?.headers).get('Authorization') === 'Bearer fixture-access'),
  ).toBe(true);
  await new GoogleMerchantAdapter(config, { fetch: fetcher }).upsert(input);
  expect(fetcher.mock.calls.filter(([url]) => String(url).includes('oauth2'))).toHaveLength(2);
});

it('upserts the exact payload and removes the same encoded identity from its configured source', async () => {
  const { adapter, fetcher } = fixture();
  const product = { ...input, offerId: 'variant/record~50%' };
  await adapter.upsert(product);
  await adapter.remove(product.offerId);
  const upsert = new URL(String(fetcher.mock.calls[1]![0]));
  expect(upsert.origin).toBe('https://merchantapi.googleapis.com');
  expect(upsert.pathname).toBe('/products/v1/accounts/123/productInputs:insert');
  expect(upsert.searchParams.get('dataSource')).toBe('accounts/123/dataSources/456');
  expect(JSON.parse(String(fetcher.mock.calls[1]![1]?.body))).toEqual(product);
  const removal = new URL(String(fetcher.mock.calls[2]![0]));
  const encoded = removal.pathname.split('/').at(-1)!;
  expect(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))).toBe('en~GR~variant/record~50%');
  expect(removal.searchParams.get('dataSource')).toBe('accounts/123/dataSources/456');
  expect(fetcher.mock.calls[2]![1]?.method).toBe('DELETE');
});

it('maps long variants to stable distinct Google IDs for insert, response validation and removal', async () => {
  const { adapter, fetcher } = fixture();
  const first = { ...input, offerId: `variant_${'record_'.repeat(20)}one` };
  const second = { ...input, offerId: `variant_${'record_'.repeat(20)}two` };
  await adapter.upsert(first);
  await adapter.remove(first.offerId);
  await adapter.upsert(second);
  await adapter.remove(second.offerId);
  await adapter.upsert(first);
  const firstSent = JSON.parse(String(fetcher.mock.calls[1]![1]?.body)) as MerchantProductInput;
  const secondSent = JSON.parse(String(fetcher.mock.calls[3]![1]?.body)) as MerchantProductInput;
  const repeated = JSON.parse(String(fetcher.mock.calls[5]![1]?.body)) as MerchantProductInput;
  expect(firstSent.offerId).toMatch(/^bb_[A-Za-z0-9_-]{43}$/);
  expect(firstSent.offerId).toHaveLength(46);
  expect(secondSent.offerId).not.toBe(firstSent.offerId);
  expect(repeated.offerId).toBe(firstSent.offerId);
  expect(first.offerId).toBe(`variant_${'record_'.repeat(20)}one`);
  for (const [index, sent] of [
    [2, firstSent],
    [4, secondSent],
  ] as const) {
    const encoded = new URL(String(fetcher.mock.calls[index]![0])).pathname.split('/').at(-1)!;
    expect(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))).toBe(`en~GR~${sent.offerId}`);
  }
  fetcher.mockImplementationOnce(async () =>
    Response.json({ ...first, name: `accounts/123/productInputs/en~GR~${first.offerId}` }),
  );
  await expect(adapter.upsert(first)).rejects.toMatchObject({ reason: 'invalid-response' });
});

it.each([404, 204])('accepts an already absent or empty deleted offer (%s)', async (status) => {
  const { adapter, fetcher } = fixture();
  fetcher.mockImplementationOnce(async () =>
    Response.json({ access_token: 'fixture-access', token_type: 'Bearer', expires_in: 3600 }),
  );
  fetcher.mockImplementationOnce(async () => new Response(null, { status }));
  await expect(adapter.remove(input.offerId)).resolves.toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it.each([
  [401, 'auth', true],
  [403, 'auth', true],
  [429, 'quota', true],
  [503, 'provider', false],
  [400, 'provider', false],
  [302, 'provider', false],
] as const)('classifies HTTP %s without retries or exposing provider details', async (status, reason, sourceStop) => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(
    async () =>
      new Response('secret credential reflected by provider', {
        status,
        headers: { location: 'https://elsewhere.example/' },
      }),
  );
  const error = await adapter.remove(input.offerId).catch((failure: unknown) => failure);
  expect(error).toBeInstanceOf(GoogleMerchantError);
  expect(error).toMatchObject({ reason, status, sourceStop, message: `Google Merchant ${reason}` });
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it('fails closed on a wrong account type before reading its source', async () => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(async () => Response.json({ name: 'accounts/123', accountId: '123' }));
  await expect(adapter.verifySource()).rejects.toMatchObject({ reason: 'invalid-source', sourceStop: true });
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it('stops the batch when account/source verification is temporarily unavailable', async () => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(async () => new Response(null, { status: 503 }));
  await expect(adapter.verifySource()).rejects.toMatchObject({ reason: 'provider', status: 503, sourceStop: true });
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it('accepts omitted testAccount only for the configured production account', async () => {
  const { fetcher } = fixture();
  const adapter = new GoogleMerchantAdapter({ ...config, expectedTestAccount: false }, { fetch: fetcher });
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(async () => Response.json({ name: 'accounts/123', accountId: '123' }));
  await expect(adapter.verifySource()).resolves.toBeUndefined();
});

it('checks one complete quota page and compares int64 daily counters without precision loss', async () => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(async () =>
    Response.json({
      quotaGroups: [
        {
          name: 'accounts/123/quotas/products',
          quotaUsage: '9007199254740992',
          quotaLimit: '9007199254740993',
          quotaMinuteLimit: '60',
        },
        { name: 'accounts/123/quotas/unused', quotaLimit: '100', quotaMinuteLimit: '10' },
      ],
    }),
  );
  await expect(adapter.checkQuota()).resolves.toBeUndefined();
  expect(fetcher.mock.calls[2]![0]).toBe(
    'https://merchantapi.googleapis.com/quota/v1/accounts/123/quotas?pageSize=1000',
  );
  expect(fetcher.mock.calls[2]![1]?.method).toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it.each([
  { quotaUsage: '0', quotaLimit: '0', quotaMinuteLimit: '10' },
  { quotaUsage: '10', quotaLimit: '10', quotaMinuteLimit: '10' },
  { quotaUsage: '11', quotaLimit: '10', quotaMinuteLimit: '10' },
  { quotaUsage: '0', quotaLimit: '10', quotaMinuteLimit: '0' },
])('blocks recovery for an exhausted quota group: %j', async (counters) => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(async () =>
    Response.json({ quotaGroups: [{ name: 'accounts/123/quotas/products', ...counters }] }),
  );
  await expect(adapter.checkQuota()).rejects.toMatchObject({ reason: 'quota', sourceStop: true });
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it.each([
  {
    quotaGroups: [{ name: 'accounts/123/quotas/products', quotaLimit: '10', quotaMinuteLimit: '1' }],
    nextPageToken: 'more-results',
  },
  { quotaGroups: [] },
  { quotaGroups: [{ name: 'accounts/999/quotas/products', quotaLimit: '10', quotaMinuteLimit: '1' }] },
  {
    quotaGroups: [{ name: 'accounts/123/quotas/products', quotaUsage: '-1', quotaLimit: '10', quotaMinuteLimit: '1' }],
  },
  { quotaGroups: [{ name: 'accounts/123/quotas/products', quotaLimit: 'unknown', quotaMinuteLimit: '1' }] },
])('fails closed on incomplete or unknown quota evidence: %j', async (response) => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(async () => Response.json(response));
  await expect(adapter.checkQuota()).rejects.toMatchObject({ reason: 'invalid-response', sourceStop: true });
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it.each([
  { ...source, name: 'accounts/999/dataSources/456' },
  { ...source, input: 'FILE' },
  { ...source, primaryProductDataSource: { ...source.primaryProductDataSource, countries: ['GR', 'CY'] } },
  { ...source, primaryProductDataSource: { ...source.primaryProductDataSource, feedLabel: 'OTHER' } },
  { ...source, primaryProductDataSource: { ...source.primaryProductDataSource, contentLanguage: 'el' } },
  { ...source, primaryProductDataSource: { ...source.primaryProductDataSource, legacyLocal: true } },
  { ...source, primaryProductDataSource: { ...source.primaryProductDataSource, destinations: [] } },
  {
    ...source,
    primaryProductDataSource: {
      ...source.primaryProductDataSource,
      destinations: [{ destination: 'FREE_LISTINGS', state: 'DISABLED' }],
    },
  },
  {
    ...source,
    primaryProductDataSource: {
      ...source.primaryProductDataSource,
      destinations: [
        { destination: 'FREE_LISTINGS', state: 'ENABLED' },
        { destination: 'SHOPPING_ADS', state: 'ENABLED' },
      ],
    },
  },
])('rejects an incompatible source before mutations: %j', async (invalidSource) => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(async () =>
    Response.json({ name: 'accounts/123', accountId: '123', testAccount: true }),
  );
  fetcher.mockImplementationOnce(async () => Response.json(invalidSource));
  await expect(adapter.verifySource()).rejects.toMatchObject({ reason: 'invalid-source', sourceStop: true });
});

it.each([
  { ...input, name: 'accounts/999/productInputs/en~GR~variant_record' },
  { ...input, name: 'accounts/123/productInputs/en~GR~different', offerId: 'different' },
])('does not record a mismatched accepted identity as success: %j', async (response) => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(async () => Response.json(response));
  await expect(adapter.upsert(input)).rejects.toMatchObject({ reason: 'invalid-response' });
});

it('bounds streamed response bytes and rejects invalid JSON', async () => {
  const { adapter, fetcher } = fixture();
  await adapter.upsert(input);
  const cancelled = vi.fn();
  fetcher.mockImplementationOnce(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(64 * 1024 + 1));
          },
          cancel: cancelled,
        }),
      ),
  );
  await expect(adapter.upsert(input)).rejects.toMatchObject({ reason: 'invalid-response' });
  expect(cancelled).toHaveBeenCalledOnce();
  fetcher.mockImplementationOnce(async () => new Response('{broken'));
  await expect(adapter.upsert(input)).rejects.toMatchObject({ reason: 'invalid-response' });
});

it('aborts timed out requests without retries and sanitizes network failures', async () => {
  const { fetcher } = fixture();
  const adapter = new GoogleMerchantAdapter(config, { fetch: fetcher, timeoutMs: 25 });
  await adapter.upsert(input);
  fetcher.mockImplementationOnce(
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        init!.signal!.addEventListener('abort', () => reject(new Error('secret reflected by transport')), {
          once: true,
        });
      }),
  );
  await expect(adapter.upsert(input)).rejects.toMatchObject({ reason: 'timeout', message: 'Google Merchant timeout' });
  fetcher.mockRejectedValueOnce(new Error('secret private key'));
  await expect(adapter.upsert(input)).rejects.toMatchObject({ reason: 'network', message: 'Google Merchant network' });
  expect(fetcher).toHaveBeenCalledTimes(4);
});

it('rejects bad credentials locally and invalid OAuth responses as authentication failures', async () => {
  const { fetcher } = fixture();
  const adapter = new GoogleMerchantAdapter(
    { ...config, serviceAccount: { ...config.serviceAccount, private_key: 'bad key' } },
    { fetch: fetcher },
  );
  await expect(adapter.upsert(input)).rejects.toMatchObject({ reason: 'auth', sourceStop: true });
  expect(fetcher).not.toHaveBeenCalled();
  fetcher.mockImplementationOnce(async () =>
    Response.json({ access_token: 'secret', token_type: 'NotBearer', expires_in: 3600 }),
  );
  await expect(new GoogleMerchantAdapter(config, { fetch: fetcher }).upsert(input)).rejects.toMatchObject({
    reason: 'auth',
    sourceStop: true,
  });
});

it('stops the batch on an OAuth transport failure without another token attempt', async () => {
  const { adapter, fetcher } = fixture();
  fetcher.mockRejectedValueOnce(new Error('credential reflected by OAuth transport'));
  await expect(adapter.upsert(input)).rejects.toMatchObject({
    reason: 'network',
    sourceStop: true,
    message: 'Google Merchant network',
  });
  expect(fetcher).toHaveBeenCalledOnce();
});

it('refreshes an expired instance token before sending another product', async () => {
  const { adapter, fetcher } = fixture();
  vi.useFakeTimers({ toFake: ['Date'] });
  const now = Date.now();
  await adapter.upsert(input);
  vi.setSystemTime(now + 3600 * 1000);
  await adapter.upsert(input);
  expect(fetcher.mock.calls.filter(([url]) => String(url).includes('oauth2'))).toHaveLength(2);
});

it('rejects unsafe configured paths and invalid identities without network calls', async () => {
  const { adapter, fetcher } = fixture();
  expect(() => new GoogleMerchantAdapter({ ...config, accountId: '../999' }, { fetch: fetcher })).toThrow(
    GoogleMerchantError,
  );
  await expect(adapter.remove('')).rejects.toMatchObject({ reason: 'invalid-source' });
  await expect(adapter.remove('invalid\nidentity')).rejects.toMatchObject({ reason: 'invalid-source' });
  expect(fetcher).not.toHaveBeenCalled();
});
