import { describe, expect, it } from 'vitest';
import { connectStorePreviewImages } from './store-preview-images';

class PreviewImage extends EventTarget {
  complete = false;
  naturalWidth = 0;
  ready = false;

  toggleAttribute(_name: string, ready: boolean) {
    this.ready = ready;
  }

  removeAttribute() {
    this.ready = false;
  }
}

describe('Store preview image lifecycle', () => {
  it('keeps pending/failed images hidden, checks cached restoration, and detaches old listeners', () => {
    const pending = new PreviewImage();
    const cached = new PreviewImage();
    cached.complete = true;
    cached.naturalWidth = 640;
    const broken = new PreviewImage();
    broken.complete = true;
    broken.ready = true;
    const root = { querySelectorAll: () => [pending, cached, broken] } as unknown as ParentNode;
    const disconnect = connectStorePreviewImages(root);
    expect([pending.ready, cached.ready, broken.ready]).toEqual([false, true, false]);

    pending.complete = true;
    pending.naturalWidth = 320;
    pending.dispatchEvent(new Event('load'));
    expect(pending.ready).toBe(true);
    pending.dispatchEvent(new Event('error'));
    expect(pending.ready).toBe(false);

    disconnect();
    cached.dispatchEvent(new Event('load'));
    expect(cached.ready).toBe(false);
    const disconnectRestored = connectStorePreviewImages(root);
    expect(cached.ready).toBe(true);
    expect(broken.ready).toBe(false);
    disconnectRestored();
  });
});
