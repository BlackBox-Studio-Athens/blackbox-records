import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { largestImageWidth } from '@/platform/lib/editorial-image';
import { storeGalleryThumbnailSource } from '@/components/store/StoreImageGallery';

const source = readFileSync(fileURLToPath(new URL('./store/[slug]/index.astro', import.meta.url)), 'utf8');
const releaseDetail = readFileSync(
  fileURLToPath(new URL('../components/editorial/ReleaseDetailContent.astro', import.meta.url)),
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

  it.each([
    ['Store', source, 'storeItem.title'],
    ['Release', releaseDetail, 'releaseTitle'],
  ])('leaves single %s images static and supplies a server placeholder for shell enhancement', (_name, page, title) => {
    expect(page).toMatch(/galleryImages\.length\s*>\s*1\s*\?\s*\(\s*<StoreImageGalleryPlaceholder\b/);
    const placeholder = /<StoreImageGalleryPlaceholder\b([^>]*?)\/>/s.exec(page)?.[1];
    expect(placeholder).toBeDefined();
    expect(placeholder).toMatch(/\bimages=\{galleryImages\}/);
    expect(placeholder).toContain(`title={${title}}`);
    expect(placeholder).not.toMatch(/\bclient:/);
    expect(page).not.toMatch(/<StoreImageGallery\b/);
    expect(page).toMatch(/\)\s*:\s*\(\s*(?:<>\s*)?<Image\b/);
    if (_name === 'Release') expect(placeholder).toMatch(/\bpriority=\{showRouteNavigation\}/);
  });

  it.each([
    ['Store', source],
    ['Release', releaseDetail],
  ])('prepares %s gallery images in cover-first order with actual thumbnail derivatives', async (_name, page) => {
    // Execute only the real media projection, with a local image-service fixture.
    const expression = /const galleryImages\s*=\s*([\s\S]*?);\s*(?:const trackGroups|---)/.exec(page)?.[1];
    expect(expression).toBeDefined();
    const widthsMatch = /(?:const widths|const galleryImageWidths)\s*=\s*\[([^\]]+)\]/.exec(page);
    const widths = widthsMatch?.[1]!.split(',').map(Number) ?? [];
    expect(widths).toEqual([144, 216, 480, 720, 960, 1200]);
    const cover = { src: '/cover.jpg', width: 1600, height: 1600, format: 'jpg' };
    const alternate = { src: '/back.jpg', width: 1600, height: 2400, format: 'jpg' };
    const getImage = vi.fn(async ({ src, widths: candidates }: { src: typeof cover; widths: number[] }) => ({
      src: `${src.src}-1200.webp`,
      srcSet: { attribute: candidates.map((width) => `${src.src}-${width}.webp ${width}w`).join(', ') },
    }));
    const context = {
      storeItem: { image: cover, imageAlt: 'Cover' },
      release: { data: { cover_image: cover, cover_image_alt: 'Cover', title: 'Album' } },
      gallery: [{ image: alternate, image_alt: 'Back' }],
      galleryImageWidths: widths,
      editorialImageQuality: 68,
      largestImageWidth,
      getImage,
    };
    const projection = `(async () => (${expression}))()`;
    const images = await runInNewContext(projection, context);
    expect(images.map((image: { alt: string }) => image.alt)).toEqual(['Cover', 'Back']);
    expect(images[1]).toMatchObject({ width: 1600, height: 2400 });
    expect(getImage.mock.calls.map(([options]) => options.src)).toEqual([cover, alternate]);
    expect(getImage).toHaveBeenCalledWith(expect.objectContaining({ width: 1200, format: 'webp' }));
    for (const image of images) {
      const thumbnail = storeGalleryThumbnailSource(image);
      expect(thumbnail.src).toBe(`${image === images[0] ? cover.src : alternate.src}-216.webp`);
      expect(thumbnail.srcSet.split(', ').map((candidate) => candidate.split(' ').at(-1))).toEqual(['144w', '216w']);
    }
    getImage.mockClear();
    expect(await runInNewContext(projection, { ...context, gallery: [] })).toEqual([]);
    expect(getImage).not.toHaveBeenCalled();
  });
});

describe('Store Item listening context contract', () => {
  it('shows source-release partners below purchase information with safe ordered links', () => {
    expect(source).toContain('const partnerLinks = sourceRelease?.data.partner_links ?? [];');
    const partners = /\{partnerLinks.length > 0 && \([\s\S]*?\n {8}\)\}/.exec(source)?.[0];
    expect(partners).toBeDefined();
    expect(source.indexOf('data-store-item-partner-links')).toBeGreaterThan(source.indexOf('<PurchaseInformation />'));
    expect(partners).toContain('Outside Greece? Order {sourceRelease?.data.title} from');
    expect(partners).toContain('partnerLinks.map((partner, index)');
    expect(partners).toContain("index > 0 && ' or '");
    expect(partners).toContain('href={partner.url}');
    expect(partners).toContain('{partner.label}');
    expect(partners).toContain('target="_blank"');
    expect(partners).toContain('rel="noopener noreferrer"');
    expect(partners).not.toContain('client:');
  });

  it('conditionally reuses the release Singles list without clips or a new island', () => {
    expect(source).toContain('const singles = sourceRelease?.data.singles ?? [];');
    const singles = /\{singles.length > 0 && \([\s\S]*?\n {6}\)\}/.exec(source)?.[0];
    expect(singles).toBeDefined();
    expect(singles).toContain('aria-labelledby="store-item-singles"');
    expect(singles).toContain('<h2 id="store-item-singles">Singles</h2>');
    const list = /<ul>\s*\{singles.map\([\s\S]*?<\/ul>/.exec(singles ?? '')?.[0];
    const releaseList = /<ul>\s*\{singles.map\([\s\S]*?<\/ul>/.exec(releaseDetail)?.[0];
    expect(list).toBeDefined();
    expect(list?.replace(/\s+/g, ' ')).toBe(releaseList?.replace(/\s+/g, ' '));
    expect(singles).not.toContain('client:');
    expect(singles).not.toContain('<iframe');
  });

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
