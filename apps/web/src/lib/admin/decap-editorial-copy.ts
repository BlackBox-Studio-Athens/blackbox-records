export const decapDirectPublishNotice = 'Publishing commits immediately to main and starts the normal site deployment.';

export const decapCollectionDescriptions = {
  home: `Homepage hero, News, and Artists content. ${decapDirectPublishNotice}`,
  artists: `Artist roster cards and detail pages. Artist identities also support public routes and Release references, so structural removal requires maintainer review. ${decapDirectPublishNotice}`,
  releases: `Editorial release pages and artwork. Release identities also support public routes and Store Item projection, so structural removal requires maintainer review. Price, stock, and checkout are managed outside Decap. ${decapDirectPublishNotice}`,
  distro: `Editorial Store Item titles, images, grouping, format, order, and public copy. To stop selling, use protected stock or commerce-operator controls; do not delete the content entry. Price, stock, checkout availability, orders, and fulfillment are managed outside Decap. ${decapDirectPublishNotice}`,
  news: `News listing cards and article pages. News entries may be deleted after confirming the public article should be removed. ${decapDirectPublishNotice}`,
  about: `Public About page copy, images, links, contacts, and stats. ${decapDirectPublishNotice}`,
  services: `Public Services page copy, images, service items, process steps, and contact details. ${decapDirectPublishNotice}`,
  newsletter: `Visible newsletter signup heading, description, field prompt, button label, and note. ${decapDirectPublishNotice}`,
  distroPage: `Public Store/Distro heading, introduction, and group-specific shelf copy. ${decapDirectPublishNotice}`,
  navigation: `Advanced: site-wide navigation labels, destinations, visibility, and order. ${decapDirectPublishNotice}`,
  socials: `Advanced: site-wide social identity links and order. ${decapDirectPublishNotice}`,
  settings: `Advanced: site-wide label identity, contact details, and metadata. ${decapDirectPublishNotice}`,
} as const;
