import { deliveryQuantityBands, type PublicApiComponents } from '@blackbox/api-client/public';

type PublicStoreOffer = PublicApiComponents['schemas']['PublicStoreOffer'];

// schema.org objects for search engines. Callers pass absolute URLs and only values the page itself shows.
type Entity = Record<string, unknown>;

export type ProductFacts = {
  name: string;
  description: string;
  image: string;
  url: string;
  brand: string;
};

export type MusicGroupFacts = {
  name: string;
  url: string;
  image?: string;
  genre?: string;
  sameAs?: string[];
};

export type MusicAlbumFacts = {
  name: string;
  url: string;
  image: string;
  label: string;
  labelUrl?: string;
  artist?: { name: string; url?: string | undefined } | undefined;
  releaseDate?: Date | null | undefined;
  tracks?: { title: string; duration?: string | undefined }[];
};

const context = 'https://schema.org';
const isoDate = (date: Date | string) => new Date(date).toISOString().slice(0, 10);

/** JSON for an inline `application/ld+json` script; `<` is escaped so content cannot close the script. */
export function serializeStructuredData(entity: Entity) {
  return JSON.stringify(entity).replaceAll('<', '\\u003c');
}

export function createWebSiteStructuredData(name: string, url: string): Entity {
  return {
    '@context': context,
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name,
    url,
    publisher: { '@id': `${url}#organization` },
  };
}

export function createOrganizationStructuredData(
  organization: {
    name: string;
    url: string;
    logo: string;
    description: string;
    foundingDate: string;
    address: { addressLocality: string; addressCountry: string };
    sameAs: string[];
  },
  termsUrl: string,
): Entity {
  return {
    '@context': context,
    '@type': 'Organization',
    ...organization,
    '@id': `${organization.url}#organization`,
    address: {
      '@type': 'PostalAddress',
      ...organization.address,
      addressCountry: organization.address.addressCountry === 'Greece' ? 'GR' : organization.address.addressCountry,
    },
    // This collective's hub links the label alongside separate studio/art projects; it is not the label's identity.
    sameAs: organization.sameAs.filter((url) => !/^https:\/\/linktr\.ee\/blackboxstudio82\/?$/i.test(url)),
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'GR',
      returnPolicyCountry: 'GR',
      returnPolicyCategory: `${context}/MerchantReturnFiniteReturnWindow`,
      merchantReturnDays: 14,
      returnMethod: `${context}/ReturnByMail`,
      refundType: `${context}/FullRefund`,
      customerRemorseReturnFees: `${context}/ReturnFeesCustomerResponsibility`,
      itemDefectReturnFees: `${context}/FreeReturn`,
      // The full terms carry the sealed-recording exception, which schema.org cannot express.
      merchantReturnLink: termsUrl,
    },
    hasShippingService: {
      '@type': 'ShippingService',
      fulfillmentType: `${context}/FulfillmentTypeCollectionPoint`,
      shippingConditions: deliveryQuantityBands.map((band, index) => ({
        '@type': 'ShippingConditions',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GR' },
        numItems: {
          '@type': 'QuantitativeValue',
          minValue: index === 0 ? 1 : deliveryQuantityBands[index - 1]!.maxUnits! + 1,
          ...(band.maxUnits === null ? {} : { maxValue: band.maxUnits }),
        },
        shippingRate: { '@type': 'MonetaryAmount', currency: 'EUR', value: band.amountMinor / 100 },
      })),
    },
  };
}

/** Null unless the offer shows a fixed price, so markup never disagrees with the page. */
export function createProductStructuredData(offer: PublicStoreOffer, product: ProductFacts): Entity | null {
  if (offer.catalogStatus !== 'ready' || offer.price.kind !== 'fixed') return null;
  const preorder = Boolean(offer.preorder);
  return {
    '@context': context,
    '@type': 'Product',
    '@id': `${product.url}#product`,
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      '@id': `${product.url}#offer`,
      url: product.url,
      price: (offer.price.amountMinor / 100).toFixed(2),
      priceCurrency: offer.price.currencyCode,
      availability: `https://schema.org/${preorder ? 'PreOrder' : 'InStock'}`,
    },
  };
}

export function createMusicGroupStructuredData(group: MusicGroupFacts): Entity {
  return {
    '@context': context,
    '@type': 'MusicGroup',
    '@id': `${group.url}#music-group`,
    name: group.name,
    url: group.url,
    ...(group.image ? { image: group.image } : {}),
    ...(group.genre ? { genre: group.genre } : {}),
    ...(group.sameAs?.length ? { sameAs: group.sameAs } : {}),
  };
}

function trackDuration(duration: string) {
  const [minutes, seconds] = duration.split(':').map(Number);
  return `PT${minutes}M${seconds}S`;
}

export function createMusicAlbumStructuredData(album: MusicAlbumFacts): Entity {
  return {
    '@context': context,
    '@type': 'MusicAlbum',
    '@id': `${album.url}#music-album`,
    name: album.name,
    url: album.url,
    image: album.image,
    albumRelease: {
      '@type': 'MusicRelease',
      '@id': `${album.url}#music-release`,
      recordLabel: {
        '@type': 'Organization',
        ...(album.labelUrl ? { '@id': `${album.labelUrl}#organization` } : {}),
        name: album.label,
      },
    },
    ...(album.artist
      ? {
          byArtist: {
            '@type': 'MusicGroup',
            name: album.artist.name,
            ...(album.artist.url ? { '@id': `${album.artist.url}#music-group`, url: album.artist.url } : {}),
          },
        }
      : {}),
    ...(album.releaseDate ? { datePublished: isoDate(album.releaseDate) } : {}),
    ...(album.tracks?.length
      ? {
          numTracks: album.tracks.length,
          track: album.tracks.map((track) => ({
            '@type': 'MusicRecording',
            name: track.title,
            ...(track.duration ? { duration: trackDuration(track.duration) } : {}),
          })),
        }
      : {}),
  };
}

export function createArticleStructuredData(article: {
  headline: string;
  description: string;
  url: string;
  image: string;
  datePublished: Date;
  publisherUrl: string;
}): Entity {
  return {
    '@context': context,
    '@type': 'Article',
    '@id': `${article.url}#article`,
    headline: article.headline,
    description: article.description,
    url: article.url,
    mainEntityOfPage: article.url,
    image: article.image,
    datePublished: isoDate(article.datePublished),
    publisher: { '@id': `${article.publisherUrl}#organization` },
  };
}

export function createBreadcrumbStructuredData(items: readonly { name: string; url: string }[]): Entity {
  return {
    '@context': context,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
