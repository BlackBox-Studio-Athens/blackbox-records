const imagesOrigin = 'https://images.blackboxrecordsathens.com';
const sourceOrigins = new Set(['https://blackbox-records-web-uat.pages.dev', 'https://blackbox-records-web.pages.dev']);

/** Direct Images errors cannot redirect across zones to our Pages originals. */
export function restorePublicImageOriginal(image: HTMLImageElement) {
  try {
    const transformed = new URL(image.currentSrc || image.src);
    if (transformed.origin !== imagesOrigin || transformed.search || transformed.hash) return;
    const match = /^\/cdn-cgi\/image\/[^/]+\/(https:\/\/.*)$/.exec(transformed.pathname);
    if (!match) return;
    const source = new URL(match[1]!);
    if (
      !sourceOrigins.has(source.origin) ||
      source.username ||
      source.password ||
      !/^\/media\/content\/[a-f0-9]{64}$/.test(source.pathname)
    )
      return;
    // Clear every responsive candidate before restoring the original, so a resize cannot retry the failed transform.
    image
      .closest('picture')
      ?.querySelectorAll('source')
      .forEach((candidate) => candidate.removeAttribute('srcset'));
    image.removeAttribute('srcset');
    image.src = source.href;
  } catch {
    // Unrelated image URLs have no public original to restore.
  }
}

export function connectPublicImageFallback() {
  document.addEventListener(
    'error',
    (event) => {
      if (event.target instanceof HTMLImageElement) restorePublicImageOriginal(event.target);
    },
    true,
  );
  // A module may execute after an eager image already failed. Future shell/React images use the capture listener.
  document.querySelectorAll('img').forEach((image) => {
    if (image.complete && image.naturalWidth === 0) restorePublicImageOriginal(image);
  });
}
