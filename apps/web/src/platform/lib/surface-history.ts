export type SurfaceHistoryTarget = Pick<History, 'back' | 'pushState'> & { readonly state: unknown };

export function readHistoryEntryMarker(state: unknown, key: string) {
  return typeof state === 'object' && state !== null ? (state as Record<string, unknown>)[key] : undefined;
}

export function pushHistoryEntry(history: SurfaceHistoryTarget, href: string, key: string, value: unknown = true) {
  if (readHistoryEntryMarker(history.state, key)) return false;
  history.pushState({ ...(history.state as object), [key]: value }, '', href);
  return true;
}

export function closeWithHistoryBack(history: SurfaceHistoryTarget, key: string, close: () => void) {
  if (readHistoryEntryMarker(history.state, key)) history.back();
  else close();
}

type SurfaceHistoryHandler = (state: unknown, href: string) => boolean;
const surfaceHistoryHandlers: SurfaceHistoryHandler[] = [];

// Called by the existing shell popstate router after its player and sheet entries.
export function togglePageSurfaceHistoryEntry(state: unknown, href: string) {
  return [...surfaceHistoryHandlers].reverse().some((handle) => handle(state, href));
}

export function connectSurfaceHistory(key: string, onChange: (value: unknown) => void) {
  let href = window.location.href;
  let marker = readHistoryEntryMarker(window.history.state, key);
  const onPopState: SurfaceHistoryHandler = (state, currentHref) => {
    const next = readHistoryEntryMarker(state, key);
    if (currentHref !== href || next === marker) return false;
    marker = next;
    onChange(next);
    return true;
  };
  surfaceHistoryHandlers.push(onPopState);
  return {
    push(value: unknown = true) {
      href = window.location.href;
      pushHistoryEntry(window.history, href, key, value);
      marker = readHistoryEntryMarker(window.history.state, key);
    },
    close(close: () => void) {
      closeWithHistoryBack(window.history, key, close);
    },
    dispose() {
      const index = surfaceHistoryHandlers.indexOf(onPopState);
      if (index !== -1) surfaceHistoryHandlers.splice(index, 1);
    },
  };
}
