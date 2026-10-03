/**
 * Shared settings for editorial and first-viewport Content Images rendered through Astro image handling.
 *
 * Sharp's WebP default (quality 80) costs 18-27% more bytes than quality 68 on the label's photos and artwork,
 * without a visible difference at rendered sizes.
 */
export const editorialImageQuality = 68;

type ImageSource = string | { width?: number; height?: number };

/**
 * The `width` to pass alongside `widths`, so the `src` fallback reuses the largest `srcset` transform instead of
 * encoding the full-resolution original that `srcset` browsers never request. Astro caps the ladder at the source
 * width, so this does too.
 */
export function largestImageWidth(source: ImageSource, widths: readonly number[]): number {
  const largest = Math.max(...widths);
  return typeof source === 'object' && source.width ? Math.min(source.width, largest) : largest;
}

/** One `sizes` entry: an optional media condition and the slot's CSS width expression, without `calc()`. */
export type ImageSlot = {
  media?: string;
  width: string;
  /** Frame width / height when the image is drawn with `object-fit: contain` inside a fixed-aspect frame. */
  frameAspectRatio?: number;
};

function formatSlotWidth(width: string, scale: number): string {
  const isPlainLength = /^-?[\d.]+(?:px|rem|vw)$/.test(width);
  if (scale >= 1) return isPlainLength ? width : `calc(${width})`;
  return isPlainLength ? `calc(${width} * ${scale})` : `calc((${width}) * ${scale})`;
}

/**
 * Builds a `sizes` attribute from the slots the image is drawn in. When a slot is a contain frame, the painted width
 * is the frame width times min(1, image aspect / frame aspect), so portrait and square photos request only the
 * pixels they paint. The scale rounds up so the request never falls below the painted width.
 */
export function createImageSizes(source: ImageSource, slots: readonly ImageSlot[]): string {
  const imageAspectRatio =
    typeof source === 'object' && source.width && source.height ? source.width / source.height : undefined;

  return slots
    .map(({ media, width, frameAspectRatio }) => {
      const scale =
        frameAspectRatio && imageAspectRatio
          ? Math.min(1, Math.ceil((imageAspectRatio / frameAspectRatio) * 100) / 100)
          : 1;
      const length = formatSlotWidth(width, scale);
      return media ? `${media} ${length}` : length;
    })
    .join(', ');
}
