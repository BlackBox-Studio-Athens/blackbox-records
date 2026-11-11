import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import CopiesArrivedStep from './CopiesArrivedStep';
import { copyWord, splitCopies } from './copies';

describe('splitCopies', () => {
  it('keeps sold copies for the people who paid and offers the rest for sale', () => {
    expect(splitCopies(300, 50)).toEqual({ forSale: 250, short: 0 });
    expect(splitCopies(40, 50)).toEqual({ forSale: 0, short: 10 });
    expect(splitCopies(0, 0)).toEqual({ forSale: 0, short: 0 });
  });

  it('says units for clothes and copies for everything else', () => {
    expect(copyWord('Clothes')).toBe('units');
    expect(copyWord('Vinyl')).toBe('copies');
    expect(copyWord(null)).toBe('copies');
  });
});

describe('CopiesArrivedStep', () => {
  const render = (planned: number, soldNotSent: number) =>
    renderToStaticMarkup(
      createElement(CopiesArrivedStep, {
        planned,
        soldNotSent,
        unit: 'copies',
        busy: false,
        onSave: vi.fn(),
        onCancel: vi.fn(),
      }),
    );

  it('fills in the planned number and shows the split', () => {
    const html = render(300, 50);
    expect(html).toContain('How many copies do we have now?');
    expect(html).toContain('value="300"');
    expect(html).toContain('250 for sale + 50 sold');
    expect(html).toContain('Save and end pre-order');
    expect(html).toContain('The records did not come');
  });

  it('warns and still allows saving when fewer copies came than were sold', () => {
    const html = render(40, 50);
    expect(html).toContain('10 short.');
    expect(html).toContain('href="/orders/"');
    expect(html).toContain('Save anyway');
  });
});
