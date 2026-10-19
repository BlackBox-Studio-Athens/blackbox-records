import { describe, expect, it } from 'vitest';
import { footerNavigationItems } from './footer-navigation';

describe('footer destinations', () => {
  it('keeps configured browse order and labels, then delivery, withdrawal and available privacy', () => {
    expect(
      footerNavigationItems(
        [
          { title: 'Shipping & returns', url: '/terms/' },
          { title: 'Our records', url: '/releases/' },
          { title: 'Artists', url: '/artists/' },
          { title: 'Privacy duplicate', url: '/privacy/' },
          { title: 'Duplicate records', url: '/releases/' },
        ],
        true,
      ),
    ).toEqual([
      { title: 'Our records', url: '/releases/' },
      { title: 'Artists', url: '/artists/' },
      { title: 'Shipping & returns', url: '/terms/' },
      { title: 'Withdraw from an order', url: '/withdrawal/' },
      { title: 'Privacy information', url: '/privacy/' },
    ]);
  });

  it('does not restore hidden delivery or expose privacy without purchase information', () => {
    expect(footerNavigationItems([{ title: 'Privacy', url: '/privacy/' }], false)).toEqual([
      { title: 'Withdraw from an order', url: '/withdrawal/' },
    ]);
  });
});
