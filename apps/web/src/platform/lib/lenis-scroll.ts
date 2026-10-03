type ScrollTarget = number | HTMLElement;
const modalLocks = new Set<symbol>();

function syncModalLocks() {
  document.body.classList.toggle('is-shell-scroll-locked', modalLocks.size > 0);
}

// Keep the existing public scroll interface; measured native input uses less main-thread work.
export function connectLenisScrollRoots(_scope: HTMLElement, _factory?: unknown) {
  return () => {};
}

export function acquireLenisModalLock(_modalRoot: HTMLElement) {
  const lock = Symbol('shell-modal-lock');
  modalLocks.add(lock);
  syncModalLocks();
  return () => {
    if (modalLocks.delete(lock)) syncModalLocks();
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
  const nativeBehavior =
    options.immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  if (root) {
    if (typeof target === 'number' && typeof root.scrollTo === 'function') {
      root.scrollTo({ top: target, behavior: nativeBehavior });
    } else if (typeof target === 'number') {
      root.scrollTop = target;
    } else {
      target.scrollIntoView({ behavior: nativeBehavior, block: 'start' });
    }
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: nativeBehavior });
  } else {
    target.scrollIntoView({ behavior: nativeBehavior, block: 'start' });
  }

  return false;
}
