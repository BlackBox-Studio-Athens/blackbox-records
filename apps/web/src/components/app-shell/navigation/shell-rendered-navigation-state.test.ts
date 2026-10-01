import { describe, expect, it, vi } from 'vitest';

import { syncShellRenderedNavigationState } from './shell-rendered-navigation-state';

describe('syncShellRenderedNavigationState', () => {
  it('updates rendered pathname, active shell state, and header and footer navigation state', () => {
    const renderedPagePathnameRef = { current: '/artists/' };
    const setActiveShellPathname = vi.fn();
    const syncNavigationCurrentState = vi.fn();

    syncShellRenderedNavigationState({
      pathname: '/releases/',
      renderedPagePathnameRef,
      setActiveShellPathname,
      syncNavigationCurrentState,
    });

    expect(renderedPagePathnameRef.current).toBe('/releases/');
    expect(setActiveShellPathname).toHaveBeenCalledWith('/releases/');
    expect(syncNavigationCurrentState).toHaveBeenCalledWith('/releases/');
  });
});
