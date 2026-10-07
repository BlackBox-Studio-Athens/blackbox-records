import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const globalCss = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

describe('Home swipe row CSS', () => {
  it('declares the neighbour fade only where scroll timelines exist', () => {
    // Without timeline support a fill-both animation holds its last keyframe and would dim every card.
    const supportsIndex = globalCss.indexOf('@supports (animation-timeline: view()) {');
    const fadeIndex = globalCss.indexOf('animation-name: home-swipe-row-fade;');

    expect(supportsIndex).toBeGreaterThan(-1);
    expect(fadeIndex).toBeGreaterThan(supportsIndex);
    expect(globalCss.indexOf('animation-name: home-swipe-row-fade;', fadeIndex + 1)).toBe(-1);
    expect(globalCss.slice(supportsIndex, fadeIndex)).toContain('(prefers-reduced-motion: no-preference)');
    expect(globalCss.slice(fadeIndex, globalCss.indexOf('}', fadeIndex))).toContain(
      'animation-timeline: view(inline);',
    );
  });

  it('never pairs the fade timeline with an animation shorthand', () => {
    expect(globalCss).not.toMatch(/animation:\s*[^;]*home-swipe-row-fade/);
  });
});
