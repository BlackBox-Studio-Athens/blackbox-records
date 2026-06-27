import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('./global.css', import.meta.url));
const globalCss = readFileSync(globalCssPath, 'utf8');

function readCssRule(source: string, marker: string) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Unable to find CSS marker: ${marker}`);
  }

  const blockStart = source.indexOf('{', markerIndex);
  if (blockStart === -1) {
    throw new Error(`Unable to find CSS block for marker: ${marker}`);
  }

  let depth = 0;
  for (let index = blockStart; index < source.length; index += 1) {
    const character = source[index];
    if (character === '{') {
      depth += 1;
    }
    if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(markerIndex, index + 1);
      }
    }
  }

  throw new Error(`Unable to close CSS block for marker: ${marker}`);
}

describe('Newsletter signup CSS', () => {
  it('keeps signup confirmation motion scoped and reduced-motion safe', () => {
    expect(globalCss).toContain('@keyframes newsletter-success-confirm');
    expect(globalCss).toContain('@keyframes newsletter-success-proof-line');
    expect(globalCss).toContain('@keyframes newsletter-checkbox-confirm');
    expect(globalCss).toContain('.newsletter-signup-status--success::after');
    expect(globalCss).not.toContain('newsletter-success-proof-tick');
    expect(globalCss).not.toContain('.newsletter-signup-status--success::before');
    expect(globalCss).toContain('.newsletter-signup-consent-checkbox:checked');

    const reducedMotionIndex = globalCss.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(reducedMotionIndex).toBeGreaterThanOrEqual(0);

    const reducedMotionCss = globalCss.slice(reducedMotionIndex);
    const reducedMotionRule = readCssRule(reducedMotionCss, '.newsletter-signup-status--success,');

    expect(reducedMotionRule).toContain('.newsletter-signup-status--success::after');
    expect(reducedMotionRule).toContain('.newsletter-signup-consent-checkbox:checked');
    expect(reducedMotionRule).toContain('animation: none;');
    expect(reducedMotionRule).toContain('transform: none;');
  });
});
