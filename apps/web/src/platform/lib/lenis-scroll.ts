import type Lenis from 'lenis';

type ScrollRoot = Window | HTMLElement;
type ScrollTarget = number | HTMLElement;
type ScrollPort = Pick<Lenis, 'destroy' | 'resize' | 'scrollTo' | 'start' | 'stop'>;
type ScrollFactory = (root: ScrollRoot, prevent: (element: HTMLElement) => boolean) => ScrollPort;

const active = new Map<ScrollRoot, ScrollPort>();
const stoppedRoots = new Set<ScrollRoot>();
const modalLocks = new Map<symbol, HTMLElement>();

function preventsNativeSurface(element: HTMLElement, root: ScrollRoot) {
  const nestedRoot = element.closest<HTMLElement>('[data-lenis-scroll-root]');
  if (nestedRoot && nestedRoot !== root) return true;
  return Boolean(
    element.closest('input, textarea, select, iframe, video, audio, [contenteditable], [data-lenis-prevent]'),
  );
}

function syncModalLocks() {
  for (const [root, lenis] of active) {
    const blocked =
      modalLocks.size > 0 &&
      (root === window || [...modalLocks.values()].some((modalRoot) => !modalRoot.contains(root as HTMLElement)));

    if (blocked && !stoppedRoots.has(root)) {
      lenis.stop();
      stoppedRoots.add(root);
    } else if (!blocked && stoppedRoots.has(root)) {
      lenis.start();
      stoppedRoots.delete(root);
    }
  }
}

export function connectLenisScrollRoots(scope: HTMLElement, factory?: ScrollFactory) {
  if (!factory) {
    let cancelled = false;
    let disconnect: (() => void) | undefined;
    void import('lenis')
      .then(({ default: Lenis }) => {
        if (cancelled) return;
        disconnect = connectLenisScrollRoots(
          scope,
          (root, prevent) =>
            new Lenis({
              autoRaf: true,
              anchors: false,
              content: root instanceof HTMLElement ? root : document.documentElement,
              prevent,
              respectReducedMotion: true,
              smoothWheel: true,
              stopInertiaOnNavigate: true,
              wrapper: root,
            }),
        );
      })
      .catch(() => {
        /* Native scrolling remains available if initialization fails. */
      });
    return () => {
      cancelled = true;
      disconnect?.();
    };
  }
  const owned = new Set<ScrollRoot>();
  const create = factory;

  function register(root: ScrollRoot) {
    if (active.has(root)) return;
    active.set(
      root,
      create(root, (element) => preventsNativeSurface(element, root)),
    );
    owned.add(root);
    syncModalLocks();
  }

  function reconcile() {
    register(window);
    const roots = new Set(scope.querySelectorAll<HTMLElement>('[data-lenis-scroll-root]'));
    if (scope.matches('[data-lenis-scroll-root]')) roots.add(scope);

    for (const root of roots) register(root);
    for (const root of owned) {
      if (
        root !== window &&
        (!scope.contains(root as HTMLElement) || !(root as HTMLElement).matches('[data-lenis-scroll-root]'))
      ) {
        active.get(root)?.destroy();
        active.delete(root);
        stoppedRoots.delete(root);
        owned.delete(root);
      }
    }
  }

  reconcile();
  const observer = new MutationObserver(reconcile);
  observer.observe(scope, {
    attributes: true,
    attributeFilter: ['data-lenis-scroll-root'],
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
    for (const root of owned) {
      active.get(root)?.destroy();
      active.delete(root);
      stoppedRoots.delete(root);
    }
  };
}

export function acquireLenisModalLock(modalRoot: HTMLElement) {
  const lock = Symbol('lenis-modal-lock');
  modalLocks.set(lock, modalRoot);
  syncModalLocks();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    modalLocks.delete(lock);
    syncModalLocks();
  };
}

export function scrollElementWithLenis(
  target: HTMLElement,
  options: { block?: 'center' | 'end' | 'start'; immediate?: boolean } = {},
) {
  const root = target.closest<HTMLElement>('[data-lenis-scroll-root]');
  const targetRect = target.getBoundingClientRect();
  const rootRect = root?.getBoundingClientRect();
  const scrollMargin = typeof getComputedStyle === 'function' ? getComputedStyle(target) : null;
  const marginTop = Number.parseFloat(scrollMargin?.scrollMarginTop ?? '') || 0;
  const marginBottom = Number.parseFloat(scrollMargin?.scrollMarginBottom ?? '') || 0;
  const viewportHeight = root?.clientHeight ?? window.innerHeight;
  const visibleHeight = targetRect.height + marginTop + marginBottom;
  const alignmentOffset =
    options.block === 'center'
      ? (viewportHeight - visibleHeight) / 2
      : options.block === 'end'
        ? viewportHeight - visibleHeight
        : 0;
  const targetTop = root ? targetRect.top - rootRect!.top + root.scrollTop : targetRect.top + window.scrollY;

  return scrollWithLenis(root, Math.max(targetTop - marginTop - alignmentOffset, 0), {
    immediate: options.immediate ?? true,
  });
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

  if (root) {
    if (typeof target === 'number' && typeof root.scrollTo === 'function') {
      root.scrollTo({ top: target, behavior: options.immediate ? 'auto' : 'smooth' });
    } else if (typeof target === 'number') {
      root.scrollTop = target;
    } else {
      target.scrollIntoView({ behavior: options.immediate ? 'auto' : 'smooth', block: 'start' });
    }
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: options.immediate ? 'auto' : 'smooth' });
  } else {
    target.scrollIntoView({ behavior: options.immediate ? 'auto' : 'smooth', block: 'start' });
  }

  return false;
}
