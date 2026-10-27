import { describe, expect, it } from 'vitest';
import { changesTodo } from './unpublished-changes';

describe('Unpublished changes summary', () => {
  it('counts unpublished drafts and flags a collection that reached the read limit', () => {
    const drafts = Array.from({ length: 5 }, (_, index) => ({ collection: 'news', title: `News ${index}` }));
    expect(changesTodo([{ collection: 'pages', title: 'Who we are' }])).toEqual({
      count: 1,
      more: false,
      names: ['Who we are'],
    });
    expect(changesTodo(drafts)).toMatchObject({ count: 5, more: true, names: ['News 0', 'News 1', 'News 2'] });
  });
});
