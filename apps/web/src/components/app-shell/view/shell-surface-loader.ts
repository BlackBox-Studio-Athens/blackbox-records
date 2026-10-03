import { useEffect, useRef, useState } from 'react';

// Dormant shell surfaces (Menu, cart drawer, detail overlay, player) stay out of the eager graph. They are loaded
// through a module promise instead of React.lazy: a lazy component that suspends inside a Suspense boundary created
// on open is revealed under React's fallback throttle (300 ms after the fallback), even when the chunk is cached.
// A surface requested before its module resolves re-renders with an ordinary state update, which commits at once.
export type ShellSurfaceLoader<T> = {
  load: () => Promise<T>;
  peek: () => T | undefined;
};

export function createShellSurfaceLoader<T>(importSurface: () => Promise<T>): ShellSurfaceLoader<T> {
  let resolved: T | undefined;
  let pending: Promise<T> | null = null;

  return {
    load() {
      if (resolved !== undefined) return Promise.resolve(resolved);
      pending ??= importSurface().then(
        (surface) => {
          resolved = surface;
          return surface;
        },
        (error: unknown) => {
          // A failed chunk request may succeed on the next intent.
          pending = null;
          throw error;
        },
      );
      return pending;
    },
    peek: () => resolved,
  };
}

// Warm-up is speculative: a failure leaves the surface to load (and report) on its real request.
export function warmShellSurface(loader: ShellSurfaceLoader<unknown>) {
  void loader.load().catch(() => undefined);
}

export function useShellSurface<T>(
  loader: ShellSurfaceLoader<T>,
  requested: boolean,
  onError?: (error: unknown) => void,
): T | undefined {
  const [, setResolvedCount] = useState(0);
  const onErrorRef = useRef(onError);
  const surface = loader.peek();

  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!requested || surface !== undefined) return;

    let current = true;
    loader.load().then(
      () => {
        if (current) setResolvedCount((count) => count + 1);
      },
      (error: unknown) => {
        if (current) onErrorRef.current?.(error);
      },
    );
    return () => {
      current = false;
    };
  }, [loader, requested, surface]);

  return surface;
}

type ShellIdleScheduler = Pick<Window, 'setTimeout' | 'clearTimeout'> & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

// Runs a warm-up after the page settles; browsers without requestIdleCallback fall back to a short timeout.
export function scheduleShellIdleTask(scheduler: ShellIdleScheduler, task: () => void, timeout = 2000) {
  if (typeof scheduler.requestIdleCallback === 'function') {
    const handle = scheduler.requestIdleCallback(task, { timeout });
    return () => scheduler.cancelIdleCallback?.(handle);
  }

  const handle = scheduler.setTimeout(task, 200);
  return () => scheduler.clearTimeout(handle);
}

type ShellSurfaceIntent = {
  selector: string;
  warm: () => void;
};

// Pointer and focus intent on a surface's trigger starts its module before the click that opens it.
export function connectShellSurfaceIntent(
  target: Pick<Document, 'addEventListener' | 'removeEventListener'>,
  intents: ShellSurfaceIntent[],
) {
  const handleIntent = (event: Event) => {
    const element = event.target as { closest?: (selector: string) => Element | null } | null;
    if (typeof element?.closest !== 'function') return;
    for (const intent of intents) {
      if (element.closest(intent.selector)) intent.warm();
    }
  };
  const eventTypes = ['pointerover', 'pointerdown', 'focusin'] as const;

  for (const eventType of eventTypes) target.addEventListener(eventType, handleIntent, { passive: true });
  return () => {
    for (const eventType of eventTypes) target.removeEventListener(eventType, handleIntent);
  };
}
