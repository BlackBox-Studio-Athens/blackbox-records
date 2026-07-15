import { describe, expect, it } from 'vitest';

import { reservedStoreRouteSegments, storeCatalogCategories } from './store-categories';

describe('Store category registry', () => {
  it('defines the exact public category order, labels, and paths', () => {
    expect(storeCatalogCategories.map(({ id, label, path }) => ({ id, label, path }))).toEqual([
      { id: 'all', label: 'All', path: '/store/' },
      { id: 'blackbox-releases', label: 'BlackBox Releases', path: '/store/blackbox-releases/' },
      { id: 'distro', label: 'Distro', path: '/store/distro/' },
      { id: 'merch', label: 'Merch', path: '/store/merch/' },
    ]);
  });

  it('reserves the collection segments without treating All as item membership', () => {
    expect([...reservedStoreRouteSegments]).toEqual(['checkout', 'blackbox-releases', 'distro', 'merch']);
    expect(reservedStoreRouteSegments.has('all')).toBe(false);
  });
});
