import { afterEach, describe, expect, it, vi } from 'vitest';

import { acquireLenisModalLock, scrollElementWithLenis, scrollWithLenis } from './lenis-scroll';
import { connectLenisScrollRoots } from './lenis-scroll-roots';

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

function createScrollPort() {
  return {
    destroy: vi.fn<() => void>(),
    resize: vi.fn<() => void>(),
    scrollTo: vi.fn<() => void>(),
    start: vi.fn<() => void>(),
    stop: vi.fn<() => void>(),
  };
}

type TestScrollPort = ReturnType<typeof createScrollPort>;

describe('Lenis scroll roots', () => {
  it('isolates nested roots, routes immediate scrolls, and destroys disconnected instances', async () => {
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

    const disconnect = connectLenisScrollRoots(scope, async (root, prevent) => {
      const instance = createScrollPort();
      instances.set(root, instance);
      preventers.set(root, prevent);
      return instance;
    });
    await Promise.resolve();

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
    await Promise.resolve();
    expect(instances.size).toBe(3);

    scopeState.roots = [secondRoot];
    observerCallback?.([], {} as MutationObserver);
    expect(instances.get(firstRoot)?.destroy).toHaveBeenCalledOnce();

    disconnect();
    expect(instances.get(windowRoot)?.destroy).toHaveBeenCalledOnce();
    expect(instances.get(secondRoot)?.destroy).toHaveBeenCalledOnce();
  });

  it('applies modal locks when asynchronously created roots become active', async () => {
    const windowRoot = {};
    const firstRoot = createRoot();
    const secondRoot = createRoot();
    const scope = {
      contains: () => true,
      matches: () => false,
      querySelectorAll: () => [firstRoot, secondRoot],
    } as unknown as HTMLElement;
    const pending = new Map<object, (instance: TestScrollPort) => void>();
    const instances = new Map<object, TestScrollPort>();
    vi.stubGlobal('window', windowRoot);
    vi.stubGlobal('MutationObserver', TestMutationObserver);

    const disconnect = connectLenisScrollRoots(
      scope,
      (root) => new Promise<TestScrollPort>((resolve) => pending.set(root, resolve)),
    );
    const unlock = acquireLenisModalLock(firstRoot);

    for (const [root, resolve] of pending) {
      const instance = createScrollPort();
      instances.set(root, instance);
      resolve(instance);
    }
    await Promise.resolve();

    expect(instances.get(windowRoot)?.stop).toHaveBeenCalledOnce();
    expect(instances.get(firstRoot)?.stop).not.toHaveBeenCalled();
    expect(instances.get(secondRoot)?.stop).toHaveBeenCalledOnce();

    unlock();
    expect(instances.get(windowRoot)?.start).toHaveBeenCalledOnce();
    expect(instances.get(secondRoot)?.start).toHaveBeenCalledOnce();
    disconnect();
    for (const instance of instances.values()) expect(instance.destroy).toHaveBeenCalledOnce();
  });

  it('destroys roots whose asynchronous initialization finishes after teardown', async () => {
    const windowRoot = {};
    const root = createRoot();
    const scope = {
      contains: () => true,
      matches: () => false,
      querySelectorAll: () => [root],
    } as unknown as HTMLElement;
    const pending = new Map<object, (instance: TestScrollPort) => void>();
    const instances: TestScrollPort[] = [];
    vi.stubGlobal('window', windowRoot);
    vi.stubGlobal('MutationObserver', TestMutationObserver);

    const disconnect = connectLenisScrollRoots(
      scope,
      (scrollRoot) => new Promise<TestScrollPort>((resolve) => pending.set(scrollRoot, resolve)),
    );
    disconnect();
    for (const resolve of pending.values()) {
      const instance = createScrollPort();
      instances.push(instance);
      resolve(instance);
    }
    await Promise.resolve();

    for (const instance of instances) expect(instance.destroy).toHaveBeenCalledOnce();
  });

  it('keeps overlapping modal locks active until every modal closes', async () => {
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
    const disconnect = connectLenisScrollRoots(scope, async (root) => {
      const instance = createScrollPort();
      instances.set(root, instance);
      return instance;
    });
    await Promise.resolve();

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

  it('preserves immediate centered alignment across nested scroll ancestors', () => {
    const target = {
      scrollIntoView: vi.fn(),
    } as unknown as HTMLElement;

    scrollElementWithLenis(target, { block: 'center' });

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'center' });
  });
});
