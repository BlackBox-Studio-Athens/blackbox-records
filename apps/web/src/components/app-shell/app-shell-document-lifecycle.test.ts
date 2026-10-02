import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('./AppShellRoot.tsx', import.meta.url)), 'utf8');

// The effect that connects document routing, from its opening line to its dependency list.
function readDocumentRoutingEffect() {
  const start = source.lastIndexOf('useEffect(() => {', source.indexOf('connectShellDocumentEventRouting({'));
  const closing = '\n  }, ';
  const end = source.indexOf(`${closing}[`, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return { body: source.slice(start, end), deps: source.slice(end + closing.length, source.indexOf(');', end)) };
}

describe('app shell document lifecycle', () => {
  it('connects document routing once, so opening or closing the player does not re-run it', () => {
    const { body, deps } = readDocumentRoutingEffect();

    // Re-running would re-snapshot main, re-bind every document listener and abort an in-flight navigation.
    expect(deps).toBe('[]');
    expect(body).toContain('isPlayerModalOpen: () => isPlayerModalOpenRef.current');
    expect(body).not.toMatch(/isPlayerModalOpen: \(\) => isPlayerModalOpen[,\n]/);
    expect(source).toContain('getIsPlayerModalOpen: () => isPlayerModalOpenRef.current');
    expect(source).toContain('isPlayerModalOpenRef.current = isPlayerModalOpen;');
  });

  it('defers the mount snapshot to idle time and cancels it on unmount', () => {
    const { body } = readDocumentRoutingEffect();

    expect(body).toContain('rememberDocumentIslandServerMarkup(document);');
    expect(body).toContain('scheduleIdleShellTask(');
    expect(body).toContain('cancelIdleSnapshot();');
    expect(body).not.toMatch(/^\s*cacheDocumentSnapshot\(\);$/m);
  });
});
