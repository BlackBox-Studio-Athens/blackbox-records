export function connectStorePreviewImages(root: ParentNode) {
  const disconnect = [...root.querySelectorAll<HTMLImageElement>('[data-store-preview-image]')].map((image) => {
    const syncReady = () => image.toggleAttribute('data-store-preview-ready', image.complete && image.naturalWidth > 0);
    const clearReady = () => image.removeAttribute('data-store-preview-ready');
    image.addEventListener('load', syncReady);
    image.addEventListener('error', clearReady);
    syncReady();

    return () => {
      image.removeEventListener('load', syncReady);
      image.removeEventListener('error', clearReady);
      clearReady();
    };
  });

  return () => disconnect.forEach((cleanup) => cleanup());
}
