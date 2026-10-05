import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cacheKey = 'blackbox:shopper-country';
const trace = (country: string) => new Response(`fl=123\nip=192.0.2.1\nloc=${country}\ntls=TLSv1.3\n`);

let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  values = new Map();
  storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
  fetchMock = vi.fn().mockResolvedValue(trace('US'));
  vi.stubGlobal('window', { sessionStorage: storage });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('parseShopperCountry', () => {
  it.each([
    ['loc=GR', 'GR'],
    ['loc=US', 'US'],
    ['fl=123\nloc=DE\r\ntls=TLSv1.3\r\n', 'DE'],
    ['loc=XX', null],
    ['loc=T1', null],
    ['ip=192.0.2.1\ntls=TLSv1.3', null],
    ['<html>Not found</html>', null],
    ['loc=us', null],
    ['loc=USA', null],
    ['loc= US', null],
    ['loc=US extra', null],
    ['location=US', null],
    ['loc=US\nloc=GR', null],
    ['loc=US\nloc=US', null],
    ['', null],
  ])('reads only a single valid loc from %j', async (body, expected) => {
    const { parseShopperCountry } = await import('./shopper-country');
    expect(parseShopperCountry(body)).toBe(expected);
  });
});

describe('resolveShopperCountry', () => {
  it('shares the same pending and resolved promise across concurrent callers', async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
    const { resolveShopperCountry } = await import('./shopper-country');
    const first = resolveShopperCountry();
    expect(resolveShopperCountry()).toBe(first);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/cdn-cgi/trace', { signal: expect.any(AbortSignal) });
    finish(trace('US'));
    await expect(first).resolves.toBe('US');
    expect(resolveShopperCountry()).toBe(first);
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(cacheKey, 'US');
    expect([...values]).toEqual([[cacheKey, 'US']]);
  });

  it.each(['US', 'GR'])('reads the %s session cache without a request', async (country) => {
    values.set(cacheKey, country);
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe(country);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each(['XX', 'T1', 'us', 'malformed', ''])('ignores an invalid cache value %j', async (cached) => {
    values.set(cacheKey, cached);
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe('US');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('caches a successful Greek lookup too', async () => {
    fetchMock.mockResolvedValue(trace('GR'));
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe('GR');
    expect(values.get(cacheKey)).toBe('GR');
  });

  it.each(['XX', 'T1', 'us', 'invalid'])('keeps %j hidden without caching or retrying', async (country) => {
    fetchMock.mockResolvedValue(trace(country));
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBeNull();
    await expect(resolveShopperCountry()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([
    new Response('loc=US', { status: 503 }),
    new Response('not a trace'),
    { ok: true, text: () => Promise.reject(new Error('body failed')) },
  ])('fails hidden on non-OK, malformed or unreadable responses', async (response) => {
    fetchMock.mockResolvedValue(response);
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBeNull();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('does not retry a failed request when another placement mounts', async () => {
    fetchMock.mockRejectedValue(new Error('network failed'));
    const { resolveShopperCountry } = await import('./shopper-country');
    const result = resolveShopperCountry();
    await expect(result).resolves.toBeNull();
    expect(resolveShopperCountry()).toBe(result);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each(['request', 'body'])('bounds a stalled %s at three seconds even if it ignores abort', async (stage) => {
    vi.useFakeTimers();
    const never = new Promise<never>(() => undefined);
    fetchMock.mockReturnValue(stage === 'request' ? never : Promise.resolve({ ok: true, text: () => never }));
    const { resolveShopperCountry } = await import('./shopper-country');
    const result = resolveShopperCountry();
    await vi.advanceTimersByTimeAsync(2999);
    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBeNull();
    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(true);
    expect(resolveShopperCountry()).toBe(result);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('works when the storage property itself is blocked', async () => {
    vi.stubGlobal('window', {
      get sessionStorage() {
        throw new Error('blocked');
      },
    });
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe('US');
    await expect(resolveShopperCountry()).resolves.toBe('US');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retains a successful result when storage reads and writes throw', async () => {
    storage.getItem.mockImplementation(() => {
      throw new Error('blocked read');
    });
    storage.setItem.mockImplementation(() => {
      throw new Error('blocked write');
    });
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe('US');
    await expect(resolveShopperCountry()).resolves.toBe('US');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('keeps static rendering hidden without poisoning the later browser lookup', async () => {
    vi.stubGlobal('window', undefined);
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.stubGlobal('window', { sessionStorage: storage });
    await expect(resolveShopperCountry()).resolves.toBe('US');
  });
});
