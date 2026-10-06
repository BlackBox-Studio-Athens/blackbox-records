import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cacheKey = 'blackbox:shopper-country';
const deliveryKey = 'blackbox:delivery-destination';
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
  const events = new EventTarget();
  vi.stubGlobal('window', {
    sessionStorage: storage,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  });
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
    expect(storage.setItem).not.toHaveBeenCalled();
    expect([...values]).toEqual([]);
  });

  it.each(['US', 'GR'])('ignores the old %s session hint and reads the current network', async (country) => {
    values.set(cacheKey, country);
    fetchMock.mockResolvedValue(trace(country === 'US' ? 'GR' : 'US'));
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe(country === 'US' ? 'GR' : 'US');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('reads a Greek network on reload after previously seeing a foreign network', async () => {
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe('US');
    fetchMock.mockResolvedValue(trace('GR'));
    vi.resetModules();
    const reloaded = await import('./shopper-country');
    await expect(reloaded.resolveShopperCountry()).resolves.toBe('GR');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(['XX', 'T1', 'us', 'malformed', ''])('ignores an invalid cache value %j', async (cached) => {
    values.set(cacheKey, cached);
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe('US');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('keeps a successful Greek lookup in memory without persisting the network hint', async () => {
    fetchMock.mockResolvedValue(trace('GR'));
    const { resolveShopperCountry } = await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe('GR');
    await expect(resolveShopperCountry()).resolves.toBe('GR');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(storage.setItem).not.toHaveBeenCalled();
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

describe('shopper delivery destination', () => {
  it('corrects a foreign hint for all placements, retains it on reload and permits changing back', async () => {
    values.set(cacheKey, 'US');
    const { getDeliveryDestination, setDeliveryDestination, subscribeDeliveryDestination, resolveShopperCountry } =
      await import('./shopper-country');
    await expect(resolveShopperCountry()).resolves.toBe('US');
    expect(getDeliveryDestination()).toBeNull();
    const listener = vi.fn();
    const unsubscribe = subscribeDeliveryDestination(listener);
    setDeliveryDestination('GR');
    expect(getDeliveryDestination()).toBe('GR');
    expect(values.get(deliveryKey)).toBe('GR');
    expect(values.get(cacheKey)).toBe('US');
    expect(listener).toHaveBeenCalledOnce();
    vi.resetModules();
    const reloaded = await import('./shopper-country');
    expect(reloaded.getDeliveryDestination()).toBe('GR');
    reloaded.setDeliveryDestination('international');
    expect(reloaded.getDeliveryDestination()).toBe('international');
    expect(values.get(deliveryKey)).toBe('international');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    setDeliveryDestination('international');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('keeps a Greek delivery choice when a late country lookup reports a foreign network', async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (finish = resolve)));
    const { getDeliveryDestination, setDeliveryDestination, resolveShopperCountry } = await import('./shopper-country');
    const pending = resolveShopperCountry();
    setDeliveryDestination('GR');
    finish(trace('US'));
    await expect(pending).resolves.toBe('US');
    expect(getDeliveryDestination()).toBe('GR');
    expect(values.get(deliveryKey)).toBe('GR');
  });

  it('retains the choice in this document when browser storage is blocked', async () => {
    const events = new EventTarget();
    vi.stubGlobal('window', {
      get sessionStorage() {
        throw new Error('blocked');
      },
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    });
    const { getDeliveryDestination, setDeliveryDestination, subscribeDeliveryDestination } =
      await import('./shopper-country');
    const listener = vi.fn();
    subscribeDeliveryDestination(listener);
    setDeliveryDestination('GR');
    expect(getDeliveryDestination()).toBe('GR');
    setDeliveryDestination('international');
    expect(getDeliveryDestination()).toBe('international');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it.each(['US', 'XX', 'gr', 'malformed', ''])('ignores an invalid stored destination %j', async (value) => {
    values.set(deliveryKey, value);
    const { getDeliveryDestination } = await import('./shopper-country');
    expect(getDeliveryDestination()).toBeNull();
  });

  it('starts without a choice in a fresh tab or during static rendering', async () => {
    const { setDeliveryDestination } = await import('./shopper-country');
    setDeliveryDestination('GR');
    vi.resetModules();
    values = new Map();
    const { getDeliveryDestination } = await import('./shopper-country');
    expect(getDeliveryDestination()).toBeNull();
    values.set(deliveryKey, 'GR');
    vi.stubGlobal('window', undefined);
    expect(getDeliveryDestination()).toBeNull();
  });
});
