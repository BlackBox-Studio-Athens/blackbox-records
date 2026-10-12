import type { PublicApiComponents } from '@blackbox/api-client/public';
import { describe, expect, it } from 'vitest';

import {
  createMusicAlbumStructuredData,
  createMusicGroupStructuredData,
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
  it('describes an in-stock offer with the displayed price', () => {
    expect(createProductStructuredData(ready, product)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Equilibrium',
      description: 'Second album.',
      image: 'https://example.test/cover.jpg',
      sku: 'variant_equilibrium-lp_standard',
      brand: { '@type': 'Brand', name: 'Blackbox Records' },
      offers: {
        '@type': 'Offer',
        url: 'https://example.test/store/equilibrium-lp/',
        price: '25.00',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      },
    });
  });

  it('marks a pre-order from its release date, and omits an unknown date', () => {
    const preorder = { ...ready, preorder: { shipEstimate: null } } as PublicStoreOffer;
    expect(createProductStructuredData(preorder, product)?.offers).toMatchObject({
      price: '25.00',
      availability: 'https://schema.org/PreOrder',
      availabilityStarts: '2026-10-16',
    });
    expect(createProductStructuredData(preorder, { ...product, releaseDate: null })?.offers).not.toHaveProperty(
      'availabilityStarts',
    );
  });

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
      name: 'Blackbox Records',
      url: 'https://example.test/',
    });
  });

  it('describes a release with its artist, date, label and tracks', () => {
    expect(
      createMusicAlbumStructuredData({
        name: 'Equilibrium',
        url: 'https://example.test/releases/equilibrium/',
        image: 'https://example.test/cover.jpg',
        label: 'Blackbox Records',
        artist: { name: 'Afterwise', url: 'https://example.test/artists/afterwise/' },
        releaseDate: new Date('2026-10-16T00:00:00Z'),
        tracks: [{ title: 'Opening', duration: '3:42' }, { title: 'Closing' }],
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'MusicAlbum',
      name: 'Equilibrium',
      url: 'https://example.test/releases/equilibrium/',
      image: 'https://example.test/cover.jpg',
      recordLabel: { '@type': 'Organization', name: 'Blackbox Records' },
      byArtist: { '@type': 'MusicGroup', name: 'Afterwise', url: 'https://example.test/artists/afterwise/' },
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
    expect(Object.keys(album)).toEqual(['@context', '@type', 'name', 'url', 'image', 'recordLabel']);
  });

  it('describes an artist with and without links', () => {
    const facts = { name: 'Afterwise', url: 'https://example.test/artists/afterwise/', genre: 'Post-rock' };
    expect(createMusicGroupStructuredData({ ...facts, sameAs: ['https://afterwise.bandcamp.com/'] })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      ...facts,
      sameAs: ['https://afterwise.bandcamp.com/'],
    });
    expect(createMusicGroupStructuredData({ ...facts, sameAs: [] })).not.toHaveProperty('sameAs');
  });

  it('escapes markup that could close the script', () => {
    expect(serializeStructuredData({ name: '</script>' })).toBe('{"name":"\\u003c/script>"}');
  });
});
