import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { currentRowIndex, SwipeRowDots } from './swipe-row-dots';

describe('currentRowIndex', () => {
  const row = { count: 3, maxScrollLeft: 400, step: 280 };

  it('follows the card nearest the gutter', () => {
    expect(currentRowIndex({ ...row, scrollLeft: 0 })).toBe(0);
    expect(currentRowIndex({ ...row, scrollLeft: 130 })).toBe(0);
    expect(currentRowIndex({ ...row, scrollLeft: 150 })).toBe(1);
    expect(currentRowIndex({ ...row, scrollLeft: 280 })).toBe(1);
  });

  it('marks the last card once the row reaches its end', () => {
    expect(currentRowIndex({ ...row, scrollLeft: 399 })).toBe(2);
  });

  it('rests on the first card when the row does not scroll', () => {
    expect(currentRowIndex({ ...row, maxScrollLeft: 0, scrollLeft: 0 })).toBe(0);
    expect(currentRowIndex({ ...row, step: 0, scrollLeft: 0 })).toBe(0);
    expect(currentRowIndex({ count: 1, maxScrollLeft: 0, scrollLeft: 0, step: 0 })).toBe(0);
  });
});

describe('SwipeRowDots', () => {
  it('renders one labelled 24px button per card with the first current', () => {
    const html = renderToStaticMarkup(<SwipeRowDots rowId="row" count={3} label="Artists position" />);

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Artists position"');
    expect(html.match(/<button/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Show 1 of 3" aria-current="true"');
    expect(html).toContain('aria-label="Show 2 of 3" aria-current="false"');
    expect(html).toContain('size-6');
  });

  it('renders nothing for a single card', () => {
    expect(renderToStaticMarkup(<SwipeRowDots rowId="row" count={1} label="News position" />)).toBe('');
  });
});
