import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('../../pages/store/[slug]/index.astro', import.meta.url)), 'utf8');
const gallerySource = source.slice(source.indexOf('gallery.length > 0'));
const distroCard = readFileSync(fileURLToPath(new URL('../cards/DistroCard.astro', import.meta.url)), 'utf8');
const storeCard = readFileSync(fileURLToPath(new URL('../cards/StoreItemCard.astro', import.meta.url)), 'utf8');

describe('Store Item detail gallery contract', () => {
  it('contains CD photography without changing non-CD framing or shared projections', () => {
    expect(source).toContain("const isDistroCd = distroSource?.data.group === 'CDs';");
    expect(source).toContain('grid items-start');
    expect(source).toContain("isDistroCd ? 'aspect-square h-auto object-contain' : 'aspect-[4/5] h-auto object-cover'");
    expect(source).not.toContain('{availabilityLabel}');
    expect(source.indexOf('data-store-purchase-group')).toBeLessThan(source.indexOf('<Image'));
    for (const card of [distroCard, storeCard]) {
      expect(card).toContain("style={isDistroCd ? 'object-fit: contain; transform: none;' : undefined}");
      expect(card).toContain("? '(min-width: 1280px) 24rem, (min-width: 768px) 50vw, 100vw'");
      expect(card).toContain(': coverflowPreview');
      expect(card).toContain('[320, 480, 640, 800, 960]');
    }
    expect(storeCard).toContain("const isDistroCd = entry.distro?.group === 'CDs';");
    expect(storeCard).toContain("style={isDistroCd ? 'aspect-ratio: 1;' : undefined}");
    expect(storeCard).toContain('!isDistroCd && <div class="absolute inset-0 bg-gradient');
  });

  it('loads Distro detail media from sourceId and fails when the source is missing', () => {
    expect(source).toContain("storeItem.sourceKind === 'distro' ? await getEntry('distro', storeItem.sourceId) : null");
    expect(source).toContain("storeItem.sourceKind === 'distro' && !distroSource");
    expect(source).toContain('throw new Error(`Missing Distro source entry');
    expect(source).toContain('const gallery = distroSource?.data.gallery ?? [];');
  });

  it('renders source-ordered lazy images only when secondary views exist', () => {
    expect(source).toContain('gallery.length > 0');
    expect(source).toContain('gallery.map(({ image, image_alt })');
    expect(source).toContain('src={image}');
    expect(source).toContain('alt={image_alt}');
    expect(source).toContain('loading="lazy"');
    expect(gallerySource).not.toContain('aspect-[4/5]');
    expect(gallerySource).toContain('h-auto w-full');
    expect(source).toContain('widths={[480, 720, 960, 1200]}');
    expect(gallerySource).not.toMatch(/client:(load|idle|visible|only)/g);
    expect(gallerySource).not.toMatch(/carousel|lightbox/i);
  });
});
