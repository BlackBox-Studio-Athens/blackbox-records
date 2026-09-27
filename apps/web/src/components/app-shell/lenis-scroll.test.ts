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

function createRoot(): HTMLElement {
  const root = {
    closest: vi.fn(),
    contains: vi.fn((element: HTMLElement) => element === root),
    matches: vi.fn(() => true),
  } as unknown as HTMLElement;
  return root;
}

class TestMutationObserver {
  constructor(_callback: MutationCallback) {}

  observe() {}

  disconnect() {}
}

describe('Lenis scroll roots', () => {
  it('does not initialize a lazily loaded runtime after its owner disconnects', async () => {
    constructLenis.mockClear();
    const disconnect = connectLenisScrollRoots({} as HTMLElement);
    disconnect();
    await vi.dynamicImportSettled();
    expect(constructLenis).not.toHaveBeenCalled();
  });

  it('isolates nested roots, routes immediate scrolls, and destroys disconnected instances', () => {
    const windowRoot = {};
    const firstRoot = createRoot();
    const secondRoot = createRoot();
    const scopeState = { roots: [firstRoot] as HTMLElement[] };
    let observerCallback: MutationCallback | undefined;
    const instances = new Map<
      object,
      {
        destroy: ReturnType<typeof vi.fn>;
        scrollTo: ReturnType<typeof vi.fn>;
        start: ReturnType<typeof vi.fn>;
        stop: ReturnType<typeof vi.fn>;
      }
    >();
    const preventers = new Map<object, (element: HTMLElement) => boolean>();

    class Observer extends TestMutationObserver {
      constructor(callback: MutationCallback) {
        super(callback);
        observerCallback = callback;
      }
    }

    const scope = {
      contains: (root: HTMLElement) => scopeState.roots.includes(root),
      matches: () => false,
      querySelectorAll: () => scopeState.roots,
    } as unknown as HTMLElement;

    vi.stubGlobal('window', windowRoot);
    vi.stubGlobal('MutationObserver', Observer);

    const disconnect = connectLenisScrollRoots(scope, (root, prevent) => {
      const instance = { destroy: vi.fn(), resize: vi.fn(), scrollTo: vi.fn(), start: vi.fn(), stop: vi.fn() };
      instances.set(root, instance);
      preventers.set(root, prevent);
      return instance;
    });

    const descendant = {
      closest: vi.fn((selector: string) => (selector === '[data-lenis-scroll-root]' ? firstRoot : null)),
    } as unknown as HTMLElement;
    expect(preventers.get(windowRoot)?.(descendant)).toBe(true);
    expect(preventers.get(firstRoot)?.(descendant)).toBe(false);

    const nativeControl = {
      closest: vi.fn((selector: string) =>
        selector === '[data-lenis-scroll-root]' ? null : ({ tagName: 'TEXTAREA' } as HTMLElement),
      ),
    } as unknown as HTMLElement;
    expect(preventers.get(firstRoot)?.(nativeControl)).toBe(true);

    scrollWithLenis(firstRoot, 42, { immediate: true });
    expect(instances.get(firstRoot)?.scrollTo).toHaveBeenCalledWith(42, { force: true, immediate: true });

    scopeState.roots = [firstRoot, secondRoot];
    observerCallback?.([], {} as MutationObserver);
    expect(instances.size).toBe(3);

    scopeState.roots = [secondRoot];
    observerCallback?.([], {} as MutationObserver);
    expect(instances.get(firstRoot)?.destroy).toHaveBeenCalledOnce();

    disconnect();
    expect(instances.get(windowRoot)?.destroy).toHaveBeenCalledOnce();
    expect(instances.get(secondRoot)?.destroy).toHaveBeenCalledOnce();
  });

  it('keeps overlapping modal locks active until every modal closes', () => {
    const windowRoot = {};
    const firstRoot = createRoot();
    const secondRoot = createRoot();
    vi.stubGlobal('window', windowRoot);
    vi.stubGlobal('MutationObserver', TestMutationObserver);

    const instances = new Map<
      object,
      {
        destroy: ReturnType<typeof vi.fn>;
        scrollTo: ReturnType<typeof vi.fn>;
        start: ReturnType<typeof vi.fn>;
        stop: ReturnType<typeof vi.fn>;
      }
    >();
    const scope = {
      contains: () => true,
      matches: () => false,
      querySelectorAll: () => [firstRoot, secondRoot],
    } as unknown as HTMLElement;
    const disconnect = connectLenisScrollRoots(scope, (root) => {
      const instance = { destroy: vi.fn(), resize: vi.fn(), scrollTo: vi.fn(), start: vi.fn(), stop: vi.fn() };
      instances.set(root, instance);
      return instance;
    });

    const unlockFirst = acquireLenisModalLock(firstRoot);
    const unlockSecond = acquireLenisModalLock(secondRoot);

    expect(instances.get(windowRoot)?.stop).toHaveBeenCalledOnce();
    expect(instances.get(firstRoot)?.stop).toHaveBeenCalledOnce();
    expect(instances.get(secondRoot)?.stop).toHaveBeenCalledOnce();

    unlockFirst();
    expect(instances.get(windowRoot)?.start).not.toHaveBeenCalled();
    expect(instances.get(firstRoot)?.start).not.toHaveBeenCalled();
    expect(instances.get(secondRoot)?.start).toHaveBeenCalledOnce();

    unlockSecond();
    expect(instances.get(windowRoot)?.start).toHaveBeenCalledOnce();
    expect(instances.get(firstRoot)?.start).toHaveBeenCalledOnce();

    unlockSecond();
    expect(instances.get(firstRoot)?.start).toHaveBeenCalledOnce();
    disconnect();
  });

  it('preserves centered positioning inside the nearest scroll root', () => {
    const scrollTo = vi.fn();
    const root = {
      clientHeight: 100,
      getBoundingClientRect: vi.fn(() => ({ top: 50 }) as DOMRect),
      scrollTop: 20,
      scrollTo,
    } as unknown as HTMLElement;
    const target = {
      closest: vi.fn(() => root),
      getBoundingClientRect: vi.fn(() => ({ height: 20, top: 80 }) as DOMRect),
    } as unknown as HTMLElement;
    vi.stubGlobal('getComputedStyle', () => ({ scrollMarginBottom: '5px', scrollMarginTop: '5px' }));

    scrollElementWithLenis(target, { block: 'center' });

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', top: 10 });
  });
});
