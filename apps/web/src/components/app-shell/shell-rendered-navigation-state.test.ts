import { describe, expect, it, vi } from 'vitest';

import { syncShellRenderedNavigationState } from './shell-rendered-navigation-state';

describe('syncShellRenderedNavigationState', () => {
  it('updates rendered pathname, active shell state, and desktop navigation state', () => {
    const renderedPagePathnameRef = { current: '/artists/' };
    const setActiveShellPathname = vi.fn();
    const syncDesktopNavigationState = vi.fn();

    syncShellRenderedNavigationState({
      pathname: '/releases/',
      renderedPagePathnameRef,
      setActiveShellPathname,
      syncDesktopNavigationState,
    });

    expect(renderedPagePathnameRef.current).toBe('/releases/');
    expect(setActiveShellPathname).toHaveBeenCalledWith('/releases/');
    expect(syncDesktopNavigationState).toHaveBeenCalledWith('/releases/');
  });
});
