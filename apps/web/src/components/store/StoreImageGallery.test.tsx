import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StoreImageGallery, {
  getStoreGallerySwipeDelta,
  StoreImageGalleryPlaceholder,
  storeGalleryThumbnailSource,
} from './StoreImageGallery';

describe('Store image gallery', () => {
  it('keeps comma-containing hosted transform URLs intact in thumbnail candidates', () => {
    const source = (width: number) =>
      `https://images.blackboxrecordsathens.com/cdn-cgi/image/width=${width},format=webp,quality=68/https://blackbox-records-web-uat.pages.dev/media/content/${'a'.repeat(64)}`;
    expect(
      storeGalleryThumbnailSource({
        src: source(1200),
        srcSet: `${source(160)} 144w, ${source(240)} 216w, ${source(480)} 480w`,
        alt: 'Cover',
        width: 1200,
        height: 1200,
      }),
    ).toEqual({ src: source(240), srcSet: `${source(160)} 144w, ${source(240)} 216w` });
  });
  it('renders complete artwork, every image choice, and bounded accessible controls before hydration', () => {
    const html = renderToStaticMarkup(
      <StoreImageGallery
        title="2016"
        images={[
          { src: '/front.webp', srcSet: '/front.webp 720w', alt: 'Front', width: 720, height: 720 },
          { src: '/back.webp', srcSet: '/back.webp 720w', alt: 'Back', width: 720, height: 1080 },
        ]}
      />,
    );
    expect(html).toContain('aria-label="2016 images"');
    expect(html).toMatch(/aria-label="Previous image"[^>]*disabled/);
    expect(html).toContain('aria-label="Next image"');
    expect(html).toContain('Show image 2: Back');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('srcSet="/front.webp 720w"');
  });

  const images = [
    { src: '/front.webp', srcSet: '/front.webp 720w', alt: 'Front', width: 720, height: 720 },
    { src: '/back.webp', srcSet: '/back.webp 720w', alt: 'Back', width: 720, height: 1080 },
  ];
  const imageTags = (html: string) => [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);

  it('server-renders the first image with the single cover loading priority and keeps thumbnails lazy', () => {
    const [main, ...thumbnails] = imageTags(renderToStaticMarkup(<StoreImageGallery title="2016" images={images} />));

    expect(main).toContain('class="store-image-gallery__image"');
    expect(main).toContain('loading="eager"');
    expect(main).toContain('fetchPriority="high"');
    expect(main).toContain('decoding="async"');
    expect(main).toContain('sizes="(min-width: 768px) 26rem, calc(100vw - 32px)"');
    expect(thumbnails).toHaveLength(2);
    for (const thumbnail of thumbnails) {
      expect(thumbnail).toContain('loading="lazy"');
      expect(thumbnail.toLowerCase()).not.toContain('fetchpriority="high"');
    }
  });

  it('keeps the first image eager without high priority inside an overlay fragment', () => {
    const html = renderToStaticMarkup(<StoreImageGallery title="2016" images={images} priority={false} />);

    expect(imageTags(html)[0]).toContain('loading="eager"');
    expect(html.toLowerCase()).not.toContain('fetchpriority="high"');
  });

  it('sizes a portrait cover by its painted width inside the square gallery', () => {
    const portrait = { ...images[0]!, width: 800, height: 1000 };
    const [main] = imageTags(renderToStaticMarkup(<StoreImageGallery title="Portrait" images={[portrait]} />));
    expect(main).toContain('sizes="(min-width: 768px) calc(26rem * 0.8), calc((100vw - 32px) * 0.8)"');
  });

  it('keeps the 72px thumbnail ladder bounded to 144 and 216 pixels', () => {
    const image = { ...images[0]!, srcSet: '/front-144.webp 144w, /front-216.webp 216w, /front.webp 720w' };
    expect(storeGalleryThumbnailSource(image)).toEqual({
      src: '/front-216.webp',
      srcSet: '/front-144.webp 144w, /front-216.webp 216w',
    });
    const tags = imageTags(renderToStaticMarkup(<StoreImageGallery title="2016" images={[image]} />));
    expect(tags[1]).toContain('srcSet="/front-144.webp 144w, /front-216.webp 216w"');
    expect(tags[1]).not.toContain('720w');
    expect(tags[1]).toContain('decoding="async"');
  });

  it('exports disabled server artwork and serialized props for shell enhancement', () => {
    const html = renderToStaticMarkup(<StoreImageGalleryPlaceholder title="2016" images={images} />);
    expect(html).toContain('data-store-image-gallery=');
    expect(html).toContain('data-store-gallery-fallback');
    expect(html).toMatch(/aria-label="Next image"[^>]*disabled/);
    expect(html).not.toContain('data-store-gallery-live');
  });

  it('accepts only a deliberate horizontal swipe, keeping vertical scrolling and taps native', () => {
    expect(getStoreGallerySwipeDelta(-41, 10)).toBe(1);
    expect(getStoreGallerySwipeDelta(50, -20)).toBe(-1);
    expect(getStoreGallerySwipeDelta(-40, 0)).toBe(0);
    expect(getStoreGallerySwipeDelta(-50, 50)).toBe(0);
    expect(getStoreGallerySwipeDelta(5, 100)).toBe(0);
  });
});
