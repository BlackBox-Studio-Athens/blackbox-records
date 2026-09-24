import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('./global.css', import.meta.url));
const globalCss = readFileSync(globalCssPath, 'utf8');

function readCssBlock(marker: string) {
  return readCssBlockWith(marker);
}

function readCssBlockWith(marker: string, requiredContent?: string) {
  let markerIndex = globalCss.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Unable to find CSS marker: ${marker}`);
  }

  while (markerIndex !== -1) {
    const blockStart = globalCss.indexOf('{', markerIndex);
    if (blockStart === -1) {
      throw new Error(`Unable to find CSS block for marker: ${marker}`);
    }

    let depth = 0;
    for (let index = blockStart; index < globalCss.length; index += 1) {
      const character = globalCss[index];
      if (character === '{') {
        depth += 1;
      }
      if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          const cssBlock = globalCss.slice(blockStart + 1, index);
          if (!requiredContent || cssBlock.includes(requiredContent)) {
            return cssBlock;
          }
          break;
        }
      }
    }

    markerIndex = globalCss.indexOf(marker, markerIndex + marker.length);
  }

  throw new Error(`Unable to read CSS block for marker: ${marker}`);
}

describe('Listen trigger CSS', () => {
  it('keeps musical motion finite and disables it for reduced motion', () => {
    const intentRule = readCssBlock('.music-listen-trigger:is(:hover, :focus-visible, :active)');
    const reducedRule = readCssBlockWith('@media (prefers-reduced-motion: reduce)', '.music-equalizer__bar');

    expect(intentRule).toContain('animation-iteration-count: 2;');
    expect(intentRule).not.toContain('infinite');
    expect(reducedRule).toContain('animation: none !important;');
    expect(readCssBlockWith('.music-equalizer__bar {', 'fill: currentColor;')).not.toContain('animation-name:');
  });

  it('keeps hover and focus states position-stable', () => {
    const triggerHoverRule = readCssBlock('.music-listen-trigger:hover,');

    expect(triggerHoverRule).toContain('transform: none;');
    expect(triggerHoverRule).not.toContain('translateY');
    expect(triggerHoverRule).not.toContain('outline: none;');
    expect(readCssBlock('.music-listen-trigger:focus-visible {')).toContain('outline: 2px solid');
  });

  it('keeps bar scaling centered and the compact action touch-sized', () => {
    const barRule = readCssBlockWith('.music-equalizer__bar {', 'fill: currentColor;');
    expect(barRule).toContain('transform-origin: center;');
    expect(barRule).toContain('transform-box: fill-box;');
    expect(readCssBlock('.music-listen-trigger {')).toContain('min-height: 2.75rem;');
  });
});
