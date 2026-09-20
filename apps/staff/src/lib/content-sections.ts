export type ContentData = Record<string, unknown>;

export const contentSections = {
  artists: 'Artists',
  releases: 'Releases',
  distro: 'Distro and merch',
  news: 'News',
  home: 'Home page',
  about: 'About page',
  services: 'Services page',
  distro_page: 'Distro page',
  purchase_information: 'Buying & delivery',
  newsletter: 'Newsletter',
  navigation: 'Navigation',
  socials: 'Social links',
  settings: 'Label details',
} as const;

export type ContentSection = keyof typeof contentSections;

export const singletonContentSections: ContentSection[] = [
  'home',
  'about',
  'services',
  'distro_page',
  'purchase_information',
  'newsletter',
  'settings',
];
