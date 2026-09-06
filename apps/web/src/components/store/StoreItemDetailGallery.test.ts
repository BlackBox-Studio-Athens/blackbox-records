import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('../../pages/store/[slug]/index.astro', import.meta.url)), 'utf8');
const gallerySource = source.slice(source.indexOf('gallery.length > 0'));

describe('Store Item detail gallery contract', () => {
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
    expect(source).toContain('aspect-[4/5]');
    expect(source).toContain('object-contain');
    expect(source).toContain('widths={[480, 720, 960, 1200]}');
    expect(gallerySource).not.toMatch(/client:(load|idle|visible|only)/g);
    expect(gallerySource).not.toMatch(/carousel|lightbox/i);
  });
});
