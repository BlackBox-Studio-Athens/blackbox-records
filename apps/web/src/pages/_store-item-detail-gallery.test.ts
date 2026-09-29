import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('./store/[slug]/index.astro', import.meta.url)), 'utf8');
const releaseDetail = readFileSync(
  fileURLToPath(new URL('../components/editorial/ReleaseDetailContent.astro', import.meta.url)),
  'utf8',
);
const gallerySource = readFileSync(
  fileURLToPath(new URL('../components/store/StoreImageGallery.tsx', import.meta.url)),
  'utf8',
);
const storeCard = readFileSync(
  fileURLToPath(new URL('../components/store/StoreItemCard.astro', import.meta.url)),
  'utf8',
);

describe('Store Item detail gallery contract', () => {
  it('contains complete artwork and preserves alternate-photo nodes in the compact frame', () => {
    expect(source).toContain('aspect-square h-auto w-full object-contain');
    expect(source.indexOf('data-store-purchase-group')).toBeLessThan(source.indexOf('<Image'));
    expect(storeCard).toContain('src={previewImage.image}');
    expect(storeCard).toContain('data-store-preview-image');
    expect(storeCard).toContain('aria-hidden="true"');
    expect(storeCard).toContain('data-store-grid-sizes={sizes}');
    expect(storeCard).not.toContain('bg-gradient');
  });

  it('loads Distro detail media from sourceId and fails when the source is missing', () => {
    expect(source).toContain("storeItem.sourceKind === 'distro' ? await getEntry('distro', storeItem.sourceId) : null");
    expect(source).toContain("storeItem.sourceKind === 'distro' && !distroSource");
    expect(source).toContain('throw new Error(`Missing Distro source entry');
    expect(source).toContain('const gallery = sourceRelease?.data.gallery ?? distroSource?.data.gallery ?? [];');
  });

  it('enhances multiple source-ordered images with shadcn controls and leaves single images static', () => {
    expect(source).toContain('gallery.length > 0');
    expect(source).toContain('...gallery');
    expect(source).toContain('galleryImages.length > 1');
    expect(source).toContain('<StoreImageGallery client:load');
    expect(gallerySource).toContain('loading="lazy"');
    expect(gallerySource).not.toContain('aspect-[4/5]');
    expect(gallerySource).toContain("from '@/components/ui/button'");
    expect(gallerySource).toContain('useReducedMotion');
    expect(gallerySource).toContain('onPanEnd');
    expect(gallerySource).toContain('ArrowLeft');
  });

  it('shows optional Release gallery images on the public detail and storefront pages', () => {
    expect(releaseDetail).toContain('const gallery = release.data.gallery ?? [];');
    expect(releaseDetail).toContain('<StoreImageGallery client:load images={galleryImages}');
    expect(source).toContain('const gallery = sourceRelease?.data.gallery ?? distroSource?.data.gallery ?? [];');
  });
});

describe('Store Item listening context contract', () => {
  it('resolves release identity through the content reader and fails on a missing source', () => {
    expect(source).toContain(
      "storeItem.sourceKind === 'release' ? await getEntry('releases', storeItem.sourceId) : null",
    );
    expect(source).toContain("storeItem.sourceKind === 'release' && !sourceRelease");
    expect(source).toContain('throw new Error(`Missing Release source entry');
    expect(source).toContain('resolveArtistProfileForRelease(sourceRelease)');
    expect(source).toContain('resolveReleaseArtistDisplayName(sourceRelease, sourceReleaseArtist)');
    expect(source).toContain('const embeddedPlayerData = storeItem.embeddedPlayerData;');
    expect(source).not.toContain('buildEmbeddedPlayerData(');
    expect(source).not.toContain("getEntry('releases', storeItem.title)");
  });

  it('keeps provider and editorial actions independently conditional', () => {
    const purchaseActions = /<StoreItemPurchaseActions\b[\s\S]*?\/>/.exec(source)?.[0];
    expect(source).toContain('(embeddedPlayerData || sourceReleaseUrl || sourceReleaseArtistUrl)');
    expect(source).toContain('embeddedPlayerData && (');
    expect(source).toContain('sourceReleaseUrl && (');
    expect(source).toContain('sourceReleaseArtistUrl && (');
    expect(source).toContain("storeItem.sourceKind === 'distro' ? await getEntry('distro', storeItem.sourceId) : null");
    expect(purchaseActions).toBeDefined();
    expect(purchaseActions).toContain('client:load');
    expect(purchaseActions).toContain('cartItem={cartItem}');
    expect(purchaseActions).toContain('cartSeed={cartSeed}');
    expect(purchaseActions).toContain('purchaseHint=');
    expect(source).toContain('embeddedPlayerData={embeddedPlayerData}');
    expect(storeCard).toContain('storeItem.embeddedPlayerData && (');
    expect(storeCard).toContain(
      '<MusicStreamingServiceListenTrigger embeddedPlayerData={storeItem.embeddedPlayerData} />',
    );
    expect(source).not.toContain('embeddedPlayerData={cartItem}');
    expect(source).not.toContain("getEntry('artists', storeItem.sourceId)");
  });
});
