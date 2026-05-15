import { describe, expect, it, vi } from 'vitest';

import { connectShellDocumentListeners } from './shell-document-listeners';

function createEventTarget() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('connectShellDocumentListeners', () => {
  it('registers shell document and window listeners', () => {
    const documentTarget = createEventTarget();
    const windowTarget = createEventTarget();
    const handlers = {
      onBlur: vi.fn(),
      onClick: vi.fn(),
      onFocusIn: vi.fn(),
      onKeyDown: vi.fn(),
      onPointerOver: vi.fn(),
      onPopState: vi.fn(),
    };

    connectShellDocumentListeners({
      documentTarget,
      windowTarget,
      ...handlers,
    });

    expect(documentTarget.addEventListener).toHaveBeenCalledWith('click', handlers.onClick, true);
    expect(documentTarget.addEventListener).toHaveBeenCalledWith('pointerover', handlers.onPointerOver);
    expect(documentTarget.addEventListener).toHaveBeenCalledWith('focusin', handlers.onFocusIn);
    expect(documentTarget.addEventListener).toHaveBeenCalledWith('keydown', handlers.onKeyDown);
    expect(windowTarget.addEventListener).toHaveBeenCalledWith('popstate', handlers.onPopState);
    expect(windowTarget.addEventListener).toHaveBeenCalledWith('blur', handlers.onBlur);
  });

  it('removes the same shell document and window listeners during cleanup', () => {
    const documentTarget = createEventTarget();
    const windowTarget = createEventTarget();
    const handlers = {
      onBlur: vi.fn(),
      onClick: vi.fn(),
      onFocusIn: vi.fn(),
      onKeyDown: vi.fn(),
      onPointerOver: vi.fn(),
      onPopState: vi.fn(),
    };

    const cleanup = connectShellDocumentListeners({
      documentTarget,
      windowTarget,
      ...handlers,
    });

    cleanup();

    expect(documentTarget.removeEventListener).toHaveBeenCalledWith('click', handlers.onClick, true);
    expect(documentTarget.removeEventListener).toHaveBeenCalledWith('pointerover', handlers.onPointerOver);
    expect(documentTarget.removeEventListener).toHaveBeenCalledWith('focusin', handlers.onFocusIn);
    expect(documentTarget.removeEventListener).toHaveBeenCalledWith('keydown', handlers.onKeyDown);
    expect(windowTarget.removeEventListener).toHaveBeenCalledWith('popstate', handlers.onPopState);
    expect(windowTarget.removeEventListener).toHaveBeenCalledWith('blur', handlers.onBlur);
  });
});
