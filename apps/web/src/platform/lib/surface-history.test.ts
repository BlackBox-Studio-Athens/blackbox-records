import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectSurfaceHistory, togglePageSurfaceHistoryEntry } from './surface-history';

afterEach(() => vi.unstubAllGlobals());

function browser() {
  const entries = [{ state: { page: 'store' } as Record<string, unknown>, href: 'https://example.test/store/' }];
  let index = 0;
  const location = { href: entries[0]!.href };
  const pop = (to: number) => {
    index = to;
    location.href = entries[index]!.href;
    return togglePageSurfaceHistoryEntry(entries[index]!.state, location.href);
  };
  const history = {
    get state() {
      return entries[index]!.state;
    },
    pushState(state: Record<string, unknown>, _title: string, href: string) {
      entries.splice(++index, Infinity, { state, href });
      location.href = href;
    },
    back: vi.fn(() => pop(index - 1)),
  };
  const window = {
    history,
    location,
  };
  vi.stubGlobal('window', window);
  return { entries, history, pop, window };
}

describe('page-local surface history', () => {
  it('closes with Back, reopens with Forward and keeps the underlying page state', () => {
    const state = browser();
    const change = vi.fn();
    const surface = connectSurfaceHistory('video', change);
    surface.push('chapter');
    surface.push('chapter');
    expect(state.entries).toHaveLength(2);
    expect(state.history.state).toEqual({ page: 'store', video: 'chapter' });
    expect(state.pop(0)).toBe(true);
    expect(change).toHaveBeenLastCalledWith(undefined);
    expect(state.pop(1)).toBe(true);
    expect(change).toHaveBeenLastCalledWith('chapter');
    surface.dispose();
  });

  it('consumes an explicit close and closes directly when no entry exists', () => {
    const state = browser();
    const change = vi.fn();
    const close = vi.fn();
    const surface = connectSurfaceHistory('artists', change);
    surface.push();
    surface.close(close);
    expect(state.history.back).toHaveBeenCalledOnce();
    expect(change).toHaveBeenCalledWith(undefined);
    expect(close).not.toHaveBeenCalled();
    surface.close(close);
    expect(close).toHaveBeenCalledOnce();
    surface.dispose();
  });

  it('leaves nested player steps and different-URL navigation to the shell', () => {
    const state = browser();
    const change = vi.fn();
    const surface = connectSurfaceHistory('crate', change);
    surface.push();
    state.history.pushState({ ...state.history.state, __appShellPlayerModal: true }, '', state.window.location.href);
    expect(state.pop(1)).toBe(false);
    expect(change).not.toHaveBeenCalled();
    state.entries.push({ state: { page: 'item' }, href: 'https://example.test/store/item/' });
    expect(state.pop(3)).toBe(false);
    expect(change).not.toHaveBeenCalled();
    surface.dispose();
    expect(state.pop(0)).toBe(false);
    expect(change).not.toHaveBeenCalled();
  });

  it('binds an entry to the current anchor URL without changing native anchor history', () => {
    const state = browser();
    const surface = connectSurfaceHistory('video', vi.fn());
    state.history.pushState({ page: 'store' }, '', 'https://example.test/store/#chapter');
    surface.push('chapter');
    expect(state.entries[2]!.href).toBe('https://example.test/store/#chapter');
    expect(state.pop(1)).toBe(true);
    expect(state.pop(0)).toBe(false);
    surface.dispose();
  });
});
