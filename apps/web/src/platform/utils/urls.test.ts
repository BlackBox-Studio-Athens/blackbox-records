import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({ base: '/blackbox-records/', site: undefined }));

import { navigationLinkAttributes } from './urls';

describe('navigationLinkAttributes', () => {
  it('marks Home only on the home page', () => {
    expect(navigationLinkAttributes('/', '/blackbox-records/')).toMatchObject({
      href: '/blackbox-records/',
      'aria-current': 'page',
      'data-nav-link': '/',
    });
    expect(navigationLinkAttributes('/', '/blackbox-records/artists/')['aria-current']).toBeUndefined();
  });

  it('keeps Store current across its categories without a section accent', () => {
    const store = navigationLinkAttributes('/store/', '/blackbox-records/store/distro/');
    expect(store).toMatchObject({ 'aria-current': 'page' });
    for (const url of ['/store/', '/services/', '/about/'] as const) {
      expect(navigationLinkAttributes(url, '/')).not.toHaveProperty('data-nav-accent');
    }
  });
});
