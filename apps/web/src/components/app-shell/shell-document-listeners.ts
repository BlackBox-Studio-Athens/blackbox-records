type ShellDocumentEventTarget = {
  addEventListener(type: 'click', listener: (event: MouseEvent) => void, options: true): void;
  addEventListener(type: 'focusin', listener: (event: FocusEvent) => void): void;
  addEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void;
  addEventListener(type: 'pointerover', listener: (event: PointerEvent) => void): void;
  removeEventListener(type: 'click', listener: (event: MouseEvent) => void, options: true): void;
  removeEventListener(type: 'focusin', listener: (event: FocusEvent) => void): void;
  removeEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void;
  removeEventListener(type: 'pointerover', listener: (event: PointerEvent) => void): void;
};

type ShellWindowEventTarget = {
  addEventListener(type: 'blur', listener: () => void): void;
  addEventListener(type: 'popstate', listener: () => void): void;
  removeEventListener(type: 'blur', listener: () => void): void;
  removeEventListener(type: 'popstate', listener: () => void): void;
};

export function connectShellDocumentListeners({
  documentTarget,
  onBlur,
  onClick,
  onFocusIn,
  onKeyDown,
  onPointerOver,
  onPopState,
  windowTarget,
}: {
  documentTarget: ShellDocumentEventTarget;
  onBlur: () => void;
  onClick: (event: MouseEvent) => void;
  onFocusIn: (event: FocusEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onPointerOver: (event: PointerEvent) => void;
  onPopState: () => void;
  windowTarget: ShellWindowEventTarget;
}) {
  documentTarget.addEventListener('click', onClick, true);
  documentTarget.addEventListener('pointerover', onPointerOver);
  documentTarget.addEventListener('focusin', onFocusIn);
  documentTarget.addEventListener('keydown', onKeyDown);
  windowTarget.addEventListener('popstate', onPopState);
  windowTarget.addEventListener('blur', onBlur);

  return () => {
    documentTarget.removeEventListener('click', onClick, true);
    documentTarget.removeEventListener('pointerover', onPointerOver);
    documentTarget.removeEventListener('focusin', onFocusIn);
    documentTarget.removeEventListener('keydown', onKeyDown);
    windowTarget.removeEventListener('popstate', onPopState);
    windowTarget.removeEventListener('blur', onBlur);
  };
}
