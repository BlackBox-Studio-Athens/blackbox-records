import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('./global.css', import.meta.url));

describe('Artists roster layout', () => {
  it('reserves the filter panel height before its portal mounts', () => {
    const css = readFileSync(globalCssPath, 'utf8');

    expect(css).toMatch(/\[data-artists-roster-filters\]\s*{[^}]*min-block-size:\s*7rem/s);
  });
});
