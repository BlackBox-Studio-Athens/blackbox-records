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
  releaseDate?: Date | string | null | undefined;
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
  return { '@context': context, '@type': 'WebSite', name, url };
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
    address: { '@type': 'PostalAddress', ...organization.address },
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
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      url: product.url,
      price: (offer.price.amountMinor / 100).toFixed(2),
      priceCurrency: offer.price.currencyCode,
      availability: `https://schema.org/${preorder ? 'PreOrder' : 'InStock'}`,
      ...(preorder && product.releaseDate ? { availabilityStarts: isoDate(product.releaseDate) } : {}),
    },
  };
}

export function createMusicGroupStructuredData(group: MusicGroupFacts): Entity {
  return {
    '@context': context,
    '@type': 'MusicGroup',
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
    name: album.name,
    url: album.url,
    image: album.image,
    albumRelease: {
      '@type': 'MusicRelease',
      recordLabel: { '@type': 'Organization', name: album.label },
    },
    ...(album.artist
      ? {
          byArtist: {
            '@type': 'MusicGroup',
            name: album.artist.name,
            ...(album.artist.url ? { url: album.artist.url } : {}),
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
