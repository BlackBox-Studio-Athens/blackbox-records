import Lenis from 'lenis';
import { registerLenisScrollRoot, type ScrollRoot, type ScrollPort } from './lenis-scroll';

type ScrollFactory = (root: ScrollRoot, prevent: (element: HTMLElement) => boolean) => Promise<ScrollPort>;
const roots = new Map<ScrollRoot, () => void>();

async function createLenis(root: ScrollRoot, prevent: (element: HTMLElement) => boolean): Promise<ScrollPort> {
  return new Lenis({
    autoRaf: true,
    anchors: false,
    content: root instanceof HTMLElement ? root : document.documentElement,
    prevent,
    respectReducedMotion: true,
    // Native wheel scrolling must agree with form controls and contenteditable scrolling.
    smoothWheel: false,
    stopInertiaOnNavigate: true,
    wrapper: root,
  });
}

export function connectLenisScrollRoots(scope: HTMLElement, factory: ScrollFactory = createLenis) {
  const owned = new Set<ScrollRoot>();
  function register(root: ScrollRoot) {
    if (roots.has(root)) return;
    owned.add(root);
    let cancelled = false;
    let dispose: (() => void) | undefined;
    roots.set(root, () => {
      cancelled = true;
      dispose?.();
    });
    void factory(root, (element) => {
      const nestedRoot = element.closest<HTMLElement>('[data-lenis-scroll-root]');
      return Boolean(
        (nestedRoot && nestedRoot !== root) ||
        element.closest('input, textarea, select, iframe, video, audio, [contenteditable], [data-lenis-prevent]'),
      );
    }).then(
      (lenis) => {
        if (cancelled) lenis.destroy();
        else dispose = registerLenisScrollRoot(root, lenis);
      },
      () => {
        if (!cancelled) roots.delete(root);
      },
    );
  }

  function remove(root: ScrollRoot) {
    roots.get(root)?.();
    roots.delete(root);
    owned.delete(root);
  }

  function reconcile() {
    register(window);
    scope.querySelectorAll<HTMLElement>('[data-lenis-scroll-root]').forEach(register);
    if (scope.matches('[data-lenis-scroll-root]')) register(scope);
    for (const root of owned) {
      if (
        root !== window &&
        (!scope.contains(root as HTMLElement) || !(root as HTMLElement).matches('[data-lenis-scroll-root]'))
      )
        remove(root);
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
    for (const root of owned) remove(root);
  };
}
