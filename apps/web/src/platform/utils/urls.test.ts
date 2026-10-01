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

  it('keeps Store current across its categories and accents only Store and Services', () => {
    const store = navigationLinkAttributes('/store/', '/blackbox-records/store/distro/');
    expect(store).toMatchObject({ 'aria-current': 'page', 'data-nav-accent': 'store' });
    expect(navigationLinkAttributes('/store/merch/', '/')['data-nav-accent']).toBe('store');
    expect(navigationLinkAttributes('/services/', '/')['data-nav-accent']).toBe('services');
    expect(navigationLinkAttributes('/about/', '/')['data-nav-accent']).toBeUndefined();
  });
});
