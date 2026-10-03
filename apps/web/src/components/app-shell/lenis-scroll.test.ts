import { afterEach, describe, expect, it, vi } from 'vitest';
const constructLenis = vi.hoisted(() => vi.fn());
vi.mock('lenis', () => ({ default: constructLenis }));
import {
  acquireLenisModalLock,
  connectLenisScrollRoots,
  scrollElementWithLenis,
  scrollWithLenis,
} from './lenis-scroll';
afterEach(() => vi.unstubAllGlobals());

function runtime({ fine = true, reduced = false } = {}) {
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  const eventHandlers = new Map<string, () => void>();
  const classList = { toggle: vi.fn() };
  const browser = {
    matchMedia: vi.fn((query: string) => ({ matches: query.includes('prefers-reduced') ? reduced : fine })),
    requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
      frames.set(++id, callback);
      return id;
    }),
    cancelAnimationFrame: vi.fn((handle: number) => frames.delete(handle)),
    scrollTo: vi.fn(),
  };
  vi.stubGlobal('window', browser);
  vi.stubGlobal('document', { body: { classList } });
  const instance = {
    destroy: vi.fn(),
    resize: vi.fn(),
    scrollTo: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    raf: vi.fn(),
    isScrolling: false as false | 'smooth' | 'native',
    on: vi.fn((event: string, callback: () => void) => {
      eventHandlers.set(event, callback);
      return () => eventHandlers.delete(event);
    }),
  };
  const factory = vi.fn(() => instance);
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(performance.now());
  };
  return { browser, classList, factory, flush, frames, eventHandlers, instance };
}

describe('shell scroll runtime', () => {
  it.each([{ fine: false }, { reduced: true }])('leaves native input untouched for %o', (preferences) => {
    const state = runtime(preferences);
    const disconnect = connectLenisScrollRoots({} as HTMLElement, state.factory);
    expect(state.factory).not.toHaveBeenCalled();
    expect(state.frames.size).toBe(0);
    disconnect();
  });
  it('does not initialize a lazy runtime after disconnect', async () => {
    runtime();
    constructLenis.mockClear();
    connectLenisScrollRoots({} as HTMLElement)();
    await vi.dynamicImportSettled();
    expect(constructLenis).not.toHaveBeenCalled();
  });
  it('keeps fine-pointer wheel native and smooth anchors browser-owned', () => {
    const state = runtime();
    const disconnect = connectLenisScrollRoots({} as HTMLElement, state.factory);
    expect(state.factory).not.toHaveBeenCalled();
    scrollWithLenis(null, 42, { immediate: false });
    expect(state.browser.scrollTo).toHaveBeenCalledWith({ top: 42, behavior: 'smooth' });
    expect(state.frames.size).toBe(0);
    disconnect();
  });
  it('keeps native modal locks until the last surface closes without a runtime', () => {
    const state = runtime({ fine: false });
    const unlockFirst = acquireLenisModalLock({} as HTMLElement);
    const unlockSecond = acquireLenisModalLock({} as HTMLElement);
    unlockFirst();
    expect(state.classList.toggle).toHaveBeenLastCalledWith('is-shell-scroll-locked', true);
    unlockSecond();
    unlockSecond();
    expect(state.classList.toggle).toHaveBeenLastCalledWith('is-shell-scroll-locked', false);
  });
  it('preserves centered native panes and immediate navigation reset', () => {
    const state = runtime({ fine: false });
    const scrollTo = vi.fn();
    const root = {
      clientHeight: 100,
      getBoundingClientRect: () => ({ top: 50 }),
      scrollTop: 20,
      scrollTo,
    } as unknown as HTMLElement;
    const target = {
      closest: () => root,
      getBoundingClientRect: () => ({ height: 20, top: 80 }),
    } as unknown as HTMLElement;
    vi.stubGlobal('getComputedStyle', () => ({ scrollMarginBottom: '5px', scrollMarginTop: '5px' }));
    scrollElementWithLenis(target, { block: 'center' });
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', top: 10 });
    scrollWithLenis(null, 0, { immediate: true });
    expect(state.browser.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
  it('uses immediate native scrolling under reduced motion', () => {
    const state = runtime({ reduced: true });
    scrollWithLenis(null, 80);
    expect(state.browser.scrollTo).toHaveBeenCalledWith({ top: 80, behavior: 'auto' });
  });
});
