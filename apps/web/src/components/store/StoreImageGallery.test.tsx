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
});
