import { deliveryQuantityBands, type PublicApiComponents } from '@blackbox/api-client/public';
import { describe, expect, it } from 'vitest';

import {
  createArticleStructuredData,
  createBreadcrumbStructuredData,
  createMusicAlbumStructuredData,
  createMusicGroupStructuredData,
  createOrganizationStructuredData,
  createProductStructuredData,
  createWebSiteStructuredData,
  serializeStructuredData,
} from './structured-data';

type PublicStoreOffer = PublicApiComponents['schemas']['PublicStoreOffer'];

const ready: PublicStoreOffer = {
  availability: { label: 'Available', status: 'available' },
  canCheckout: true,
  catalogStatus: 'ready',
  preorder: null,
  price: { amountMinor: 2500, currencyCode: 'EUR', display: '€25.00', kind: 'fixed' },
  storeItemSlug: 'equilibrium-lp',
  variantId: 'variant_equilibrium-lp_standard',
};
const product = {
  name: 'Equilibrium',
  description: 'Second album.',
  image: 'https://example.test/cover.jpg',
  url: 'https://example.test/store/equilibrium-lp/',
  brand: 'Blackbox Records',
  releaseDate: new Date('2026-10-16T00:00:00Z'),
};

function soldOut(state: 'coming_soon' | 'repressing' | 'sold_out' | 'unavailable'): PublicStoreOffer {
  return {
    availability: { label: '', state, status: 'sold_out' },
    canCheckout: false,
    catalogStatus: 'sold_out',
    price: null,
    storeItemSlug: ready.storeItemSlug,
    variantId: ready.variantId,
  };
}

describe('structured data', () => {
  it('preserves Organization facts with the published Greece return and quantity-based locker policies', () => {
    const facts = {
      name: 'BlackBox </script>',
      url: 'https://example.test/',
      logo: 'https://example.test/logo.png',
      description: 'Independent label',
      foundingDate: '2012',
      address: { addressLocality: 'Athens', addressCountry: 'GR' },
      sameAs: ['https://example.test/social'],
    };
    const organization = createOrganizationStructuredData(facts, 'https://example.test/terms/');
    expect(organization).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      ...facts,
      '@id': 'https://example.test/#organization',
      address: { '@type': 'PostalAddress', ...facts.address },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'GR',
        returnPolicyCountry: 'GR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        refundType: 'https://schema.org/FullRefund',
        customerRemorseReturnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
        itemDefectReturnFees: 'https://schema.org/FreeReturn',
        merchantReturnLink: 'https://example.test/terms/',
      },
      hasShippingService: {
        '@type': 'ShippingService',
        fulfillmentType: 'https://schema.org/FulfillmentTypeCollectionPoint',
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
    });
    const serialized = serializeStructuredData(organization);
    expect(serialized).not.toContain('<');
    expect(serialized).toContain('\\u003c/script>');
    expect(JSON.parse(serialized)).toEqual(organization);
  });

  it('normalizes the published country name only in schema and excludes the collective hub identity', () => {
    const facts = {
      name: 'BlackBox Records',
      url: 'https://example.test/',
      logo: 'https://example.test/logo.png',
      description: 'Independent label',
      foundingDate: '2026',
      address: { addressLocality: 'Athens', addressCountry: 'Greece' },
      sameAs: ['https://www.instagram.com/blackboxrecordsath/', 'https://linktr.ee/blackboxstudio82/'],
    };
    const entity = createOrganizationStructuredData(facts, 'https://example.test/terms/');
    expect(entity.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Athens', addressCountry: 'GR' });
    expect(entity.sameAs).toEqual(['https://www.instagram.com/blackboxrecordsath/']);
    expect(facts.address.addressCountry).toBe('Greece');
    expect(facts.sameAs).toHaveLength(2);
  });

  it('describes an in-stock offer with the displayed price', () => {
    expect(createProductStructuredData(ready, product)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': 'https://example.test/store/equilibrium-lp/#product',
      name: 'Equilibrium',
      description: 'Second album.',
      image: 'https://example.test/cover.jpg',
      brand: { '@type': 'Brand', name: 'Blackbox Records' },
      offers: {
        '@type': 'Offer',
        '@id': 'https://example.test/store/equilibrium-lp/#offer',
        url: 'https://example.test/store/equilibrium-lp/',
        price: '25.00',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      },
    });
  });

  it.each([null, { kind: 'month', month: '2026-11', part: null }] as const)(
    'keeps a physical pre-order truthful without deriving availability from its digital date or estimate %j',
    (shipEstimate) => {
      const preorder = { ...ready, preorder: { shipEstimate } } as PublicStoreOffer;
      expect(createProductStructuredData(preorder, product)?.offers).toMatchObject({
        price: '25.00',
        availability: 'https://schema.org/PreOrder',
      });
      expect(createProductStructuredData(preorder, product)?.offers).not.toHaveProperty('availabilityStarts');
    },
  );

  it.each(['coming_soon', 'repressing', 'sold_out', 'unavailable'] as const)(
    'publishes nothing for a %s offer, which shows no price',
    (state) => {
      expect(createProductStructuredData(soldOut(state), product)).toBeNull();
    },
  );

  it('publishes nothing for catalog drift or a pay-what-you-want price', () => {
    expect(
      createProductStructuredData(
        {
          availability: { label: '', status: 'unavailable' },
          canCheckout: false,
          catalogStatus: 'catalog_drift',
          price: null,
          storeItemSlug: ready.storeItemSlug,
          variantId: ready.variantId,
        },
        product,
      ),
    ).toBeNull();
    expect(
      createProductStructuredData(
        {
          ...ready,
          price: {
            currencyCode: 'EUR',
            display: 'Pay what you want',
            kind: 'pay_what_you_want',
            maximumAmountMinor: 5000,
            minimumAmountMinor: 500,
            presetAmountMinor: 1000,
          },
        },
        product,
      ),
    ).toBeNull();
  });

  it('names the site on Home', () => {
    expect(createWebSiteStructuredData('Blackbox Records', 'https://example.test/')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://example.test/#website',
      name: 'Blackbox Records',
      url: 'https://example.test/',
      publisher: { '@id': 'https://example.test/#organization' },
    });
  });

  it('describes a release with its artist, date, label and tracks', () => {
    expect(
      createMusicAlbumStructuredData({
        name: 'Equilibrium',
        url: 'https://example.test/releases/equilibrium/',
        image: 'https://example.test/cover.jpg',
        label: 'Blackbox Records',
        labelUrl: 'https://example.test/',
        artist: { name: 'Afterwise', url: 'https://example.test/artists/afterwise/' },
        releaseDate: new Date('2026-10-16T00:00:00Z'),
        tracks: [{ title: 'Opening', duration: '3:42' }, { title: 'Closing' }],
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'MusicAlbum',
      '@id': 'https://example.test/releases/equilibrium/#music-album',
      name: 'Equilibrium',
      url: 'https://example.test/releases/equilibrium/',
      image: 'https://example.test/cover.jpg',
      albumRelease: {
        '@type': 'MusicRelease',
        '@id': 'https://example.test/releases/equilibrium/#music-release',
        recordLabel: { '@type': 'Organization', '@id': 'https://example.test/#organization', name: 'Blackbox Records' },
      },
      byArtist: {
        '@type': 'MusicGroup',
        '@id': 'https://example.test/artists/afterwise/#music-group',
        name: 'Afterwise',
        url: 'https://example.test/artists/afterwise/',
      },
      datePublished: '2026-10-16',
      numTracks: 2,
      track: [
        { '@type': 'MusicRecording', name: 'Opening', duration: 'PT3M42S' },
        { '@type': 'MusicRecording', name: 'Closing' },
      ],
    });
  });

  it('omits the artist, date and tracks a release does not have', () => {
    const album = createMusicAlbumStructuredData({
      name: 'Equilibrium',
      url: 'https://example.test/releases/equilibrium/',
      image: 'https://example.test/cover.jpg',
      label: 'Blackbox Records',
      tracks: [],
    });
    expect(Object.keys(album)).toEqual(['@context', '@type', '@id', 'name', 'url', 'image', 'albumRelease']);
    expect(album.albumRelease).toMatchObject({ recordLabel: { name: 'Blackbox Records' } });
    expect((album.albumRelease as Record<string, unknown>).recordLabel).not.toHaveProperty('@id');
  });

  it('describes an artist with and without links', () => {
    const facts = { name: 'Afterwise', url: 'https://example.test/artists/afterwise/', genre: 'Post-rock' };
    expect(createMusicGroupStructuredData({ ...facts, sameAs: ['https://afterwise.bandcamp.com/'] })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      '@id': 'https://example.test/artists/afterwise/#music-group',
      ...facts,
      sameAs: ['https://afterwise.bandcamp.com/'],
    });
    expect(createMusicGroupStructuredData({ ...facts, sameAs: [] })).not.toHaveProperty('sameAs');
  });

  it('describes published news facts without inventing an author or modification time', () => {
    const facts = {
      headline: 'Disintegration </script>',
      description: 'A published release announcement.',
      url: 'https://example.test/news/disintegration/',
      image: 'https://example.test/cover.jpg',
      datePublished: new Date('2026-06-09T00:00:00Z'),
      publisherUrl: 'https://example.test/',
    };
    const article = createArticleStructuredData(facts);
    expect(article).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': 'https://example.test/news/disintegration/#article',
      headline: facts.headline,
      description: facts.description,
      url: facts.url,
      mainEntityOfPage: facts.url,
      image: facts.image,
      datePublished: '2026-06-09',
      publisher: { '@id': 'https://example.test/#organization' },
    });
    expect(serializeStructuredData(article)).not.toContain('<');
    const updated = createArticleStructuredData({ ...facts, headline: 'Updated announcement' });
    expect(updated['@id']).toBe(article['@id']);
    expect(updated.headline).toBe('Updated announcement');
    expect(article.headline).toBe(facts.headline);
  });

  it('keeps breadcrumb hierarchy and labels from the page instead of deriving labels from slugs', () => {
    const items = [
      { name: 'Home', url: 'https://example.test/' },
      { name: 'Store', url: 'https://example.test/store/' },
      { name: 'Afterwise — Disintegration </script>', url: 'https://example.test/store/disintegration-cd/' },
    ];
    const entity = createBreadcrumbStructuredData(items);
    expect(entity).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });
    const serialized = serializeStructuredData(entity);
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toEqual(entity);
  });

  it('escapes markup that could close the script', () => {
    expect(serializeStructuredData({ name: '</script>' })).toBe('{"name":"\\u003c/script>"}');
  });

  it('rebuilds offer facts from the current authoritative read without mutating earlier data', () => {
    const first = createProductStructuredData(ready, product);
    const current = createProductStructuredData(
      {
        ...ready,
        price: { amountMinor: 2800, currencyCode: 'EUR', display: '€28.00', kind: 'fixed' },
      },
      product,
    );
    expect(first?.offers).toMatchObject({ price: '25.00' });
    expect(current?.offers).toMatchObject({ price: '28.00' });
    expect(current?.['@id']).toBe(first?.['@id']);
    expect(createProductStructuredData(soldOut('sold_out'), product)).toBeNull();
  });

  it('preserves the configured canonical base path in entity references and breadcrumbs', () => {
    const home = 'https://example.test/blackbox-records/';
    const url = `${home}news/disintegration/`;
    const article = createArticleStructuredData({
      headline: 'Disintegration',
      description: 'Published announcement.',
      url,
      image: `${home}cover.jpg`,
      datePublished: new Date('2026-06-09T00:00:00Z'),
      publisherUrl: home,
    });
    expect(article['@id']).toBe(`${url}#article`);
    expect(article.publisher).toEqual({ '@id': `${home}#organization` });
    expect(createWebSiteStructuredData('BlackBox Records', home).publisher).toEqual(article.publisher);
    expect(
      createBreadcrumbStructuredData([
        { name: 'Home', url: home },
        { name: 'News', url: `${home}news/` },
        { name: 'Disintegration', url },
      ]).itemListElement,
    ).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: 'News', item: `${home}news/` },
      { '@type': 'ListItem', position: 3, name: 'Disintegration', item: url },
    ]);
  });
});
