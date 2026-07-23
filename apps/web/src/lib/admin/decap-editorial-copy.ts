export const decapDirectPublishNotice = 'Publishing commits immediately to main and starts the normal site deployment.';

export const decapCollectionDescriptions = {
  home: `Homepage hero, News, and Artists content. ${decapDirectPublishNotice}`,
  artists: `Artist roster cards and artist detail pages. ${decapDirectPublishNotice}`,
  releases: `Editorial release pages and artwork. Price, stock, and checkout are managed outside Decap. ${decapDirectPublishNotice}`,
  distro: `Editorial Store Item titles, images, grouping, format, order, and public copy. Price, stock, checkout, orders, and fulfillment are managed outside Decap. ${decapDirectPublishNotice}`,
  news: `News listing cards and article pages. ${decapDirectPublishNotice}`,
  about: `Public About page copy, images, links, contacts, and stats. ${decapDirectPublishNotice}`,
  services: `Public Services page copy, images, service items, process steps, and contact details. ${decapDirectPublishNotice}`,
  newsletter: `Visible newsletter signup heading, copy, labels, and feedback messages. ${decapDirectPublishNotice}`,
  distroPage: `Public Store and Distro page headings, introductions, and group copy. ${decapDirectPublishNotice}`,
  navigation: `Advanced: site-wide navigation labels, destinations, visibility, and order. ${decapDirectPublishNotice}`,
  socials: `Advanced: site-wide social identity links and order. ${decapDirectPublishNotice}`,
  settings: `Advanced: site-wide label identity, contact details, and metadata. ${decapDirectPublishNotice}`,
} as const;
