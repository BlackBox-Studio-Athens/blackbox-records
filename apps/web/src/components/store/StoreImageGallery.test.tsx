import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StoreImageGallery from './StoreImageGallery';

describe('Store image gallery', () => {
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
});
