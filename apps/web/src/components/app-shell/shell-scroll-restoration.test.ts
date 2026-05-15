import { describe, expect, it } from 'vitest';

import { enableManualShellScrollRestoration } from './shell-scroll-restoration';

describe('enableManualShellScrollRestoration', () => {
  it('sets history scroll restoration to manual and restores the previous value', () => {
    const history = {
      scrollRestoration: 'auto',
    };

    const restoreScrollRestoration = enableManualShellScrollRestoration(history);

    expect(history.scrollRestoration).toBe('manual');

    restoreScrollRestoration();

    expect(history.scrollRestoration).toBe('auto');
  });

  it('leaves unsupported history objects unchanged', () => {
    const history = {};

    const restoreScrollRestoration = enableManualShellScrollRestoration(history);

    expect(history).toEqual({});

    restoreScrollRestoration();

    expect(history).toEqual({});
  });
});
