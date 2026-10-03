import { describe, expect, it } from 'vitest';

import { createImageSizes, editorialImageQuality, largestImageWidth } from './editorial-image';

describe('editorial image settings', () => {
  it('shares one WebP quality below sharp’s default of 80', () => {
    expect(editorialImageQuality).toBe(68);
  });

  it('reuses the largest srcset width as the src fallback, capped at the source width', () => {
    expect(largestImageWidth({ width: 3000, height: 3000 }, [720, 1080, 1800])).toBe(1800);
    expect(largestImageWidth({ width: 1200, height: 800 }, [720, 1080, 1800])).toBe(1200);
    expect(largestImageWidth('/media/content/a.jpg', [360, 720])).toBe(720);
  });

  describe('createImageSizes', () => {
    const slots = [
      { media: '(min-width: 72rem)', width: '34.75rem', frameAspectRatio: 1.18 },
      { media: '(min-width: 40rem)', width: '100vw - 3.125rem', frameAspectRatio: 16 / 13 },
      { width: '100vw - 2.125rem', frameAspectRatio: 16 / 13 },
    ];

    it('keeps the frame width for photos at least as wide as the frame', () => {
      expect(createImageSizes({ width: 2400, height: 1600 }, slots)).toBe(
        '(min-width: 72rem) 34.75rem, (min-width: 40rem) calc(100vw - 3.125rem), calc(100vw - 2.125rem)',
      );
    });

    it('scales contained portrait photos by image aspect over frame aspect, rounding up', () => {
      // 3:4 portrait: 0.75 / 1.18 = 0.6356 -> 0.64; 0.75 / 1.2308 = 0.6094 -> 0.61.
      expect(createImageSizes({ width: 1800, height: 2400 }, slots)).toBe(
        '(min-width: 72rem) calc(34.75rem * 0.64), (min-width: 40rem) calc((100vw - 3.125rem) * 0.61), calc((100vw - 2.125rem) * 0.61)',
      );
    });

    it('leaves slots without a contain frame and images without dimensions unscaled', () => {
      expect(createImageSizes({ width: 1000, height: 2000 }, [{ width: '50vw' }])).toBe('50vw');
      expect(createImageSizes('/media/content/a.jpg', slots)).toBe(
        '(min-width: 72rem) 34.75rem, (min-width: 40rem) calc(100vw - 3.125rem), calc(100vw - 2.125rem)',
      );
    });
  });
});
