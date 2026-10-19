import type { NavigationLink } from './site-data';

export function footerNavigationItems(
  navigation: readonly Pick<NavigationLink, 'title' | 'url'>[],
  hasPurchaseInformation: boolean,
) {
  const links = [
    ...navigation.filter((item) => item.url !== '/terms/' && item.url !== '/privacy/'),
    ...navigation.filter((item) => item.url === '/terms/'),
    { title: 'Withdraw from an order', url: '/withdrawal/' as const },
    ...(hasPurchaseInformation ? [{ title: 'Privacy information', url: '/privacy/' as const }] : []),
  ];
  return links.filter((item, index) => links.findIndex((other) => other.url === item.url) === index);
}
