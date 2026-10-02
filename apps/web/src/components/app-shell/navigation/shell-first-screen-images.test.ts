import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  preloadEagerImages,
  preloadImageSources,
  SHELL_FIRST_SCREEN_IMAGE_WAIT_MS,
  waitForEagerImages,
} from './shell-first-screen-images';

function createRoot(...decodes: Array<() => Promise<void>>) {
  return {
    querySelectorAll: vi.fn(() => decodes.map((decode) => ({ decode }))),
  } as unknown as ParentNode;
}

async function settled(promise: Promise<void>) {
  let done = false;
  void promise.then(() => {
    done = true;
  });
  await vi.advanceTimersByTimeAsync(0);
  return done;
}

describe('shell first-screen images', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately without a root', async () => {
    await expect(waitForEagerImages(null)).resolves.toBeUndefined();
  });

  it('resolves once every eager image has decoded', async () => {
    vi.useFakeTimers();
    const decode = vi.fn(async () => undefined);

    expect(await settled(waitForEagerImages(createRoot(decode, decode)))).toBe(true);
    expect(decode).toHaveBeenCalledTimes(2);
  });

  it('resolves when a decode rejects', async () => {
    vi.useFakeTimers();

    expect(await settled(waitForEagerImages(createRoot(() => Promise.reject(new Error('broken')))))).toBe(true);
  });

  it('resolves at the wait cap when a decode never settles', async () => {
    vi.useFakeTimers();
    const wait = waitForEagerImages(createRoot(() => new Promise<void>(() => undefined)));

    expect(await settled(wait)).toBe(false);
    await vi.advanceTimersByTimeAsync(SHELL_FIRST_SCREEN_IMAGE_WAIT_MS);
    await expect(wait).resolves.toBeUndefined();
  });

  describe('eager image preloading', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function stubDocument(images: Array<Record<string, string>>) {
      const created: Array<Array<[string, string]>> = [];
      class FakeImage {
        readonly attributes: Array<[string, string]> = [];
        constructor() {
          created.push(this.attributes);
        }
        setAttribute(name: string, value: string) {
          this.attributes.push([name, value]);
        }
      }
      const template = {
        content: {
          querySelectorAll: vi.fn(() =>
            images.map((attributes) => ({ getAttribute: (name: string) => attributes[name] ?? null })),
          ),
        },
        innerHTML: '',
      };
      vi.stubGlobal('Image', FakeImage);
      vi.stubGlobal('document', { createElement: vi.fn(() => template) });
      return created;
    }

    it('requests every eager image with sizes and srcset before src', () => {
      const created = stubDocument([{ sizes: '50vw', src: '/a.jpg', srcset: '/a.jpg 1x' }, { src: '/b.jpg' }]);

      expect(preloadEagerImages('<main></main>')).toEqual([]);
      expect(created).toEqual([
        [
          ['sizes', '50vw'],
          ['srcset', '/a.jpg 1x'],
          ['src', '/a.jpg'],
        ],
        [['src', '/b.jpg']],
      ]);
    });

    it('requests only the first images up to the limit and returns the rest for later', () => {
      const created = stubDocument([{ src: '/a.jpg' }, { src: '/b.jpg' }, { src: '/c.jpg' }]);

      const remaining = preloadEagerImages('<main></main>', 1);

      expect(created).toEqual([[['src', '/a.jpg']]]);
      expect(remaining).toEqual([{ src: '/b.jpg' }, { src: '/c.jpg' }]);

      preloadImageSources(remaining);
      expect(created).toHaveLength(3);
    });
  });
});
