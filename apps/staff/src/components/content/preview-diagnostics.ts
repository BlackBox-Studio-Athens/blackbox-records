export type PreviewDiagnostic = {
  requestId?: string | undefined;
  release: string;
  stage: 'request' | 'timeout' | 'style' | 'image' | 'font' | 'freshness';
  requestedGeneration?: number;
  displayedGeneration?: number;
  readiness?: 'failed';
  asset?: string | undefined;
  directive?: string | undefined;
};

export class PreviewAssetError extends Error {
  constructor(
    message: string,
    readonly stage: 'style' | 'image' | 'font',
    readonly asset?: string,
  ) {
    super(message);
  }
}

export function safePreviewAsset(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin)
      return /^\/_astro\/[a-zA-Z0-9_.-]+\.css$/.test(url.pathname) ? url.pathname : '/cms-asset';
    return ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(url.origin)
      ? url.origin
      : '/external-asset';
  } catch {
    return undefined;
  }
}

export async function checkPreviewAssets(document: Document) {
  const failedStyle = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).find((link) => {
    if (!link.sheet) return true;
    // Chromium can attach an empty sheet after failed CSS. Our preview stylesheet is never empty.
    try {
      return link.sheet.cssRules.length === 0;
    } catch {
      return false;
    }
  });
  if (failedStyle)
    throw new PreviewAssetError(
      'Preview styles could not load. Try refreshing the preview.',
      'style',
      failedStyle.href,
    );
  await Promise.all(
    Array.from(document.images).map(async (image) => {
      try {
        await image.decode();
      } catch {
        throw new PreviewAssetError(
          'Preview images could not load. Check the images or refresh the preview.',
          'image',
          image.currentSrc || image.src,
        );
      }
    }),
  );
  await document.fonts?.ready;
  // Public Google Fonts use display=optional: Firefox may reject a slow face and intentionally use the fallback.
  // That is a valid public rendering, not a failed preview. Required (e.g. Veneer/swap) fonts still gate readiness.
  if (
    document.fonts &&
    Array.from(document.fonts).some((font) => font.status === 'error' && font.display !== 'optional')
  )
    throw new PreviewAssetError('Preview fonts could not load. Try refreshing the preview.', 'font');
}
