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
  it('centers the animated indicator halo without fractional auto margins', () => {
    const haloRule = readCssBlockWith('.music-listen-trigger__indicator::after {', 'position: absolute;');

    expect(haloRule).toContain('inset: 1px;');
    expect(haloRule).toContain('transform-origin: center;');
    expect(haloRule).not.toContain('margin: auto;');
    expect(haloRule).not.toContain('width: calc(var(--music-listen-chamber-size) - 2px);');
    expect(haloRule).not.toContain('height: calc(var(--music-listen-chamber-size) - 2px);');
  });

  it('keeps hover and focus states position-stable', () => {
    const triggerHoverRule = readCssBlock('.music-listen-trigger:hover,');
    const indicatorHoverRule = readCssBlock('.music-listen-trigger:hover .music-listen-trigger__indicator,');

    expect(triggerHoverRule).toContain('transform: none;');
    expect(triggerHoverRule).not.toContain('translateY');
    expect(indicatorHoverRule).toContain('transform: none;');
    expect(indicatorHoverRule).not.toContain('scale(1.04)');
  });

  it('keeps the core dot visually centered', () => {
    const coreRule = readCssBlock('.music-listen-trigger__indicator::before {');

    expect(coreRule).toContain('circle at center');
    expect(coreRule).not.toContain('circle at 35% 35%');
  });
});
