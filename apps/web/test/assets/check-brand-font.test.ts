import { describe, expect, it } from 'vitest';

import { checkBrandFontSources } from '../../scripts/check-brand-font';

describe('Veneer delivery', () => {
  it('keeps the bundled and stable font bytes identical with optional display ownership', () => {
    expect(() => checkBrandFontSources()).not.toThrow();
  });
});
