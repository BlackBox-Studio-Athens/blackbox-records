import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('./AppShellRoot.tsx', import.meta.url)), 'utf8');

describe('app shell startup closure', () => {
  it('keeps dormant presentation behind direct intent-owned imports', () => {
    for (const moduleName of ['MobileNavigationSheet', 'StoreCartDrawer', 'ShellOverlayPanel', 'ShellPlayerSurface']) {
      expect(source).toContain(`const ${moduleName} = lazy(`);
    }

    expect(source).toContain('connectShellDocumentEventRouting');
    expect(source).toContain('openShellSectionNavigation');
  });
});
