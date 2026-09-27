import type Lenis from 'lenis';

export type ScrollRoot = Window | HTMLElement;
type ScrollTarget = number | HTMLElement;
export type ScrollPort = Pick<Lenis, 'destroy' | 'resize' | 'scrollTo' | 'start' | 'stop'>;

const active = new Map<ScrollRoot, ScrollPort>();
const stoppedRoots = new Set<ScrollRoot>();
const modalLocks = new Map<symbol, HTMLElement>();

function syncModalLocks() {
  for (const [root, lenis] of active) {
    const blocked =
      modalLocks.size > 0 &&
      (root === window || [...modalLocks.values()].some((modalRoot) => !modalRoot.contains(root as HTMLElement)));

    if (blocked === stoppedRoots.has(root)) continue;
    if (blocked) {
      lenis.stop();
      stoppedRoots.add(root);
    } else {
      lenis.start();
      stoppedRoots.delete(root);
    }
  }
}

export function registerLenisScrollRoot(root: ScrollRoot, lenis: ScrollPort) {
  active.set(root, lenis);
  syncModalLocks();
  return () => {
    lenis.destroy();
    active.delete(root);
    stoppedRoots.delete(root);
  };
}

export function acquireLenisModalLock(modalRoot: HTMLElement) {
  const lock = Symbol();
  modalLocks.set(lock, modalRoot);
  syncModalLocks();

  return () => {
    if (modalLocks.delete(lock)) syncModalLocks();
  };
}

export function scrollElementWithLenis(target: HTMLElement, options: { block?: 'center' | 'end' | 'start' } = {}) {
  // Cancel inertia first; native immediate alignment reveals all scrolling ancestors and respects scroll margins.
  for (const [root, lenis] of active) {
    if (root !== window && !(root as HTMLElement).contains(target)) continue;
    lenis.resize();
    lenis.scrollTo(root === window ? window.scrollY : (root as HTMLElement).scrollTop, {
      force: true,
      immediate: true,
    });
  }
  target.scrollIntoView({ behavior: 'instant', block: options.block ?? 'start' });
}

export function scrollWithLenis(
  root: HTMLElement | null,
  target: ScrollTarget,
  options: { immediate?: boolean; offset?: number } = {},
) {
  const scrollRoot = root ?? window;
  const lenis = active.get(scrollRoot);

  if (lenis) {
    lenis.resize();
    lenis.scrollTo(target, { force: true, ...options });
    return true;
  }

  if (typeof target !== 'number') {
    target.scrollIntoView({ behavior: options.immediate ? 'auto' : 'smooth', block: 'start' });
  } else if (typeof scrollRoot.scrollTo === 'function') {
    scrollRoot.scrollTo({ top: target, behavior: options.immediate ? 'auto' : 'smooth' });
  } else if (root) {
    root.scrollTop = target;
  }

  return false;
}
