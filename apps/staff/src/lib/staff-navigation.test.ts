import { afterEach, expect, test, vi } from 'vitest';
import {
  staffLabel,
  staffParent,
  staffTarget,
  staffEntry,
  staffPages,
  writeStaffLocation,
  staffReturn,
  staffLink,
  followStaffHistory,
} from './staff-navigation';

const origin = 'https://staff.example';
afterEach(() => vi.unstubAllGlobals());

test('return targets accept only bounded same-origin staff navigation', () => {
  for (const target of [
    '//evil.test/',
    'https://evil.test/content/',
    'https://user:pass@staff.example/',
    '/api/internal/stock',
    '/_emdash/login',
    '/missing/',
    '/content/?collection=unknown',
    '/content/?tab=admin',
    '/content/?id=../secret',
    '/content/?q=a&q=b',
    `/content/?q=${'x'.repeat(201)}`,
    `/content/?cursor=${'x'.repeat(2049)}`,
  ]) {
    expect(staffTarget(target, origin), target).toBeNull();
  }
  expect(staffTarget('/content/?collection=distro&q=record&cursor=opaque%2F%2B%3D&returnTo=%2Forders%2F', origin)).toBe(
    '/content/?collection=distro&q=record&cursor=opaque%2F%2B%3D',
  );
  expect(staffTarget('/items/new/?kind=release&collection=releases&id=one', origin)).toBe(
    '/items/new/?kind=release&collection=releases&id=one',
  );
});

test('direct entries have named parents across the staff surface matrix', () => {
  for (const collection of ['home', 'about', 'services', 'distro_page', 'purchase_information', 'settings'])
    expect(staffParent(`/content/?collection=${collection}&id=one`)).toEqual({ url: '/content/', label: 'Pages' });
  for (const collection of ['newsletter', 'navigation', 'socials'])
    expect(staffParent(`/content/?collection=${collection}&id=one`)).toEqual({
      url: '/content/?view=footer',
      label: 'Navigation & footer',
    });
  for (const collection of ['artists', 'releases', 'distro', 'news'])
    expect(staffParent(`/content/?collection=${collection}&id=one`).url).toBe(`/content/?collection=${collection}`);
  expect(staffParent('/items/new/?kind=merch').url).toBe('/content/?collection=distro&area=merch');
  expect(staffParent('/stock/?variantId=one').url).toBe('/stock/');
  expect(staffParent('/orders/?checkoutSessionId=one').url).toBe('/orders/');
  for (const path of ['/review/', '/content/', '/content/?view=media', '/stock/', '/orders/'])
    expect(staffParent(path)).toEqual({ url: '/', label: 'Overview' });
  expect(staffLabel('/review/?q=record')).toBe('Review changes');
});

function browser(path = '/content/?collection=distro') {
  const location = new URL(path, origin);
  const history = {
    state: { unrelated: 'retained' } as Record<string, unknown>,
    replaceState: vi.fn((state, _title, url) => {
      history.state = state;
      location.href = new URL(url, origin).href;
    }),
    pushState: vi.fn((state, _title, url) => {
      history.state = state;
      location.href = new URL(url, origin).href;
    }),
  };
  const storage = new Map<string, string>();
  vi.stubGlobal('location', location);
  vi.stubGlobal('history', history);
  vi.stubGlobal('window', { dispatchEvent: vi.fn(), scrollY: 12 });
  vi.stubGlobal('document', { activeElement: null, querySelectorAll: () => [] });
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key),
    removeItem: (key: string) => storage.delete(key),
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  return { location, history, storage };
}

test('task returns reference the actual source entry and preserve unrelated state', () => {
  const { history } = browser();
  writeStaffLocation('/content/?collection=distro&cursor=opaque', { push: true, pages: ['', 'opaque'] });
  const second = staffEntry();
  writeStaffLocation('/content/?collection=distro&id=record', { push: true, task: true });
  writeStaffLocation('/content/?collection=distro&id=record&tab=selling');
  expect(staffReturn()).toEqual({ url: second.url, label: 'Distro and merch', delta: -1 });
  expect(history.state.unrelated).toBe('retained');
  expect(history.pushState).toHaveBeenCalledTimes(2);
  expect(staffPages('opaque')).toEqual(['', 'opaque']);
  expect(staffPages('copied')).toEqual(['copied']);
  history.state = { __TSR_index: 0 };
  expect(staffReturn()).toEqual({ url: second.url, label: 'Distro and merch', delta: -1 });
  expect(history.state.__TSR_index).toBe(0);
});

test('full-document handoff is exact, single-use and contains navigation only', () => {
  const { location, history, storage } = browser();
  const source = staffEntry();
  const link = staffLink('/review/?returnTo=%2Forders%2F');
  expect(new URL(link, origin).searchParams.get('returnTo')).toBe(source.url);
  history.state = {};
  location.href = new URL(link, origin).href;
  expect(staffEntry().origin).toEqual({ position: source.position, url: source.url });
  expect(storage.size).toBe(0);
  history.state = {};
  location.href = new URL('/orders/', origin).href;
  expect(staffEntry().origin).toBeUndefined();
  expect(staffReturn().delta).toBe(0);
});

test('denied storage and malformed state degrade to explicit parents', () => {
  const { history } = browser('/content/?collection=artists&id=one&returnTo=https://evil.test/');
  vi.stubGlobal('sessionStorage', {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
    removeItem: () => {
      throw new Error('denied');
    },
  });
  history.state.blackboxStaff = { position: -1, url: '/' };
  expect(staffReturn()).toEqual({ url: '/content/?collection=artists', label: 'Artists', delta: 0 });
  expect(() => staffLink('/review/')).not.toThrow();
  history.replaceState.mockImplementation(() => {
    throw new Error('denied');
  });
  history.state = {};
  expect(() => staffEntry()).not.toThrow();
});

test('pending history leaves keep the task URL, cancel coherently, and replay one allowed transition', async () => {
  const { location, history } = browser();
  const events = new EventTarget();
  vi.stubGlobal('window', events);
  const entries: { state: Record<string, unknown>; url: string }[] = [{ state: history.state, url: location.href }];
  let index = 0;
  history.replaceState.mockImplementation((state, _title, url) => {
    history.state = state;
    location.href = new URL(url, origin).href;
    entries[index] = { state, url: location.href };
  });
  history.pushState.mockImplementation((state, _title, url) => {
    index++;
    entries.splice(index);
    history.replaceState(state, '', url);
  });
  const go = vi.fn((distance: number) => {
    index += distance;
    history.state = entries[index]!.state;
    location.href = entries[index]!.url;
    queueMicrotask(() => events.dispatchEvent(new Event('popstate')));
  });
  vi.stubGlobal('history', Object.assign(history, { go }));
  staffEntry();
  writeStaffLocation('/content/?collection=distro&id=one', { push: true, task: true });
  let decision = Promise.withResolvers<boolean>();
  const guard = vi.fn(() => decision.promise);
  const restore = vi.fn();
  const stop = followStaffHistory(restore, guard);
  try {
    go(-1);
    await vi.waitFor(() => expect(location.search).toContain('id=one'));
    go(-1);
    await vi.waitFor(() => expect(index).toBe(1));
    expect(guard).toHaveBeenCalledTimes(1);
    decision.resolve(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(restore).not.toHaveBeenCalled();
    expect(location.search).toContain('id=one');
    decision = Promise.withResolvers<boolean>();
    go(-1);
    await vi.waitFor(() => expect(guard).toHaveBeenCalledTimes(2));
    decision.resolve(true);
    await vi.waitFor(() => expect(restore).toHaveBeenCalledTimes(1));
    expect(index).toBe(0);
    expect(location.search).not.toContain('id=');
    expect(entries).toHaveLength(2);
  } finally {
    stop();
  }
});
