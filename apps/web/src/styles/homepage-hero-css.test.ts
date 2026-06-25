import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const globalCssPath = fileURLToPath(new URL('./global.css', import.meta.url));
const globalCss = readFileSync(globalCssPath, 'utf8');

function readCssBlock(marker: string) {
  const markerIndex = globalCss.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Unable to find CSS marker: ${marker}`);
  }

  const blockStart = globalCss.indexOf('{', markerIndex);
  if (blockStart === -1) {
    throw new Error(`Unable to find CSS block for marker: ${marker}`);
  }

  const blockEnd = globalCss.indexOf('}', blockStart);
  if (blockEnd === -1) {
    throw new Error(`Unable to close CSS block for marker: ${marker}`);
  }

  return globalCss.slice(blockStart + 1, blockEnd);
}

describe('Homepage hero CSS', () => {
  it('keeps threshold opacity targets transition-free', () => {
    const scrollProgressOpacitySelectors = [
      '.homepage-hero-section__media-layer {',
      '.homepage-hero-section__shade-layer {',
      '.homepage-hero-section__grain-layer {',
      '.homepage-hero-section__scroll-indicator {',
    ];

    for (const selector of scrollProgressOpacitySelectors) {
      const block = readCssBlock(selector);

      expect(block).toMatch(/opacity\s*:/i);
      expect(block).not.toMatch(/transition\s*:[^;]*opacity/i);
    }

    expect(globalCss).not.toContain('--homepage-hero-scroll-progress');
    expect(globalCss).toContain('.homepage-hero-section--scrolled .homepage-hero-section__media-layer');
  });
});
