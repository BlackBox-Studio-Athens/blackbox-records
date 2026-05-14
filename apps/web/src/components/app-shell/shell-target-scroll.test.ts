import { describe, expect, it, vi } from 'vitest';

import { scrollShellTargetIntoView } from './shell-target-scroll';

type FakeTargetElement = HTMLElement & {
  scrollIntoView: ReturnType<typeof vi.fn>;
};

type FakeOverlayScrollContainer = HTMLElement & {
  scrollTo: ReturnType<typeof vi.fn>;
};

function createTargetElement(top = 0): FakeTargetElement {
  return {
    getBoundingClientRect: vi.fn(() => ({ top }) as DOMRect),
    scrollIntoView: vi.fn(),
  } as unknown as FakeTargetElement;
}

function createOverlayScrollContainer({
  contains = true,
  scrollTop = 0,
  targetElement = null,
  top = 0,
}: {
  contains?: boolean;
  scrollTop?: number;
  targetElement?: HTMLElement | null;
  top?: number;
}): FakeOverlayScrollContainer {
  return {
    contains: vi.fn((element: HTMLElement) => contains || element === targetElement),
    getBoundingClientRect: vi.fn(() => ({ top }) as DOMRect),
    querySelector: vi.fn(() => targetElement),
    scrollTo: vi.fn(),
    scrollTop,
  } as unknown as FakeOverlayScrollContainer;
}

describe('scrollShellTargetIntoView', () => {
  it('returns false when no target exists', () => {
    const documentRoot = {
      querySelector: vi.fn(() => null),
    };

    expect(
      scrollShellTargetIntoView({
        documentRoot,
        overlayScrollContainer: null,
        targetId: 'missing',
      }),
    ).toBe(false);
  });

  it('scrolls the document target into view when there is no overlay scroll root', () => {
    const targetElement = createTargetElement();
    const documentRoot = {
      querySelector: vi.fn(() => targetElement),
    };

    expect(
      scrollShellTargetIntoView({
        documentRoot,
        overlayScrollContainer: null,
        targetId: 'catalog',
      }),
    ).toBe(true);

    expect(targetElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('scrolls within the overlay when the trigger and target are inside the overlay scroll root', () => {
    const triggerElement = createTargetElement();
    const targetElement = createTargetElement(140);
    const overlayScrollContainer = createOverlayScrollContainer({
      scrollTop: 24,
      targetElement,
      top: 40,
    });

    expect(
      scrollShellTargetIntoView({
        documentRoot: { querySelector: vi.fn() },
        overlayScrollContainer,
        targetId: 'tracklist',
        triggerElement,
      }),
    ).toBe(true);

    expect(overlayScrollContainer.scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 108 });
    expect(targetElement.scrollIntoView).not.toHaveBeenCalled();
  });

  it('clamps overlay scroll targets at zero', () => {
    const triggerElement = createTargetElement();
    const targetElement = createTargetElement(10);
    const overlayScrollContainer = createOverlayScrollContainer({
      scrollTop: 0,
      targetElement,
      top: 40,
    });

    scrollShellTargetIntoView({
      documentRoot: { querySelector: vi.fn() },
      overlayScrollContainer,
      targetId: 'top',
      triggerElement,
    });

    expect(overlayScrollContainer.scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 0 });
  });
});
