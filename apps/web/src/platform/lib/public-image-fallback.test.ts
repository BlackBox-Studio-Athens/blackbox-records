import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { connectPublicImageFallback, restorePublicImageOriginal } from './public-image-fallback';

const original = `https://blackbox-records-web-uat.pages.dev/media/content/${'a'.repeat(64)}`;
const transformed = `https://images.blackboxrecordsathens.com/cdn-cgi/image/width=640,format=webp,quality=68/${original}`;
// Match the repository's node-based DOM tests without adding a DOM runtime dependency.
class ImageElement {
  src = transformed;
  currentSrc = '';
  complete = false;
  naturalWidth = 0;
  removeAttribute = vi.fn();
  closest = vi.fn().mockReturnValue(null);
}
const image = () => new ImageElement() as unknown as HTMLImageElement;
beforeEach(() => vi.stubGlobal('HTMLImageElement', ImageElement));
afterEach(() => vi.unstubAllGlobals());

it('restores the failed current candidate and clears img/picture srcsets without retrying Images', () => {
  const element = image();
  element.src = transformed.replace('width=640', 'width=1200');
  Object.defineProperty(element, 'currentSrc', { configurable: true, value: transformed });
  const candidate = { removeAttribute: vi.fn() };
  vi.mocked(element.closest).mockReturnValue({ querySelectorAll: () => [candidate] } as unknown as Element);
  restorePublicImageOriginal(element);
  expect(element.src).toBe(original);
  expect(element.removeAttribute).toHaveBeenCalledExactlyOnceWith('srcset');
  expect(candidate.removeAttribute).toHaveBeenCalledExactlyOnceWith('srcset');
  Object.defineProperty(element, 'currentSrc', { value: original });
  restorePublicImageOriginal(element);
  expect(element.removeAttribute).toHaveBeenCalledTimes(1);
});

it('ignores static, private, unrelated and unapproved source URLs', () => {
  for (const url of [
    original,
    'https://example.com/logo.png',
    transformed.replace('images.blackboxrecordsathens.com', 'example.com'),
    transformed.replace('blackbox-records-web-uat.pages.dev', 'foreign.pages.dev'),
    transformed.replace('/media/content/', '/_preview/media/'),
    `${transformed}?x=1`,
  ]) {
    const element = image();
    element.src = url;
    restorePublicImageOriginal(element);
    expect(element.src).toBe(url);
    expect(element.removeAttribute).not.toHaveBeenCalled();
  }
});

it('recovers failed eager images and registers capture handling for later shell/cart errors', () => {
  const eager = image();
  Object.defineProperty(eager, 'complete', { value: true });
  const healthy = image();
  Object.defineProperties(healthy, { complete: { value: true }, naturalWidth: { value: 640 } });
  const pending = image();
  const addEventListener = vi.fn();
  vi.stubGlobal('document', { addEventListener, querySelectorAll: () => [eager, healthy, pending] });
  connectPublicImageFallback();
  expect(eager.src).toBe(original);
  expect(healthy.src).toBe(transformed);
  expect(pending.src).toBe(transformed);
  expect(addEventListener).toHaveBeenCalledWith('error', expect.any(Function), true);
  const onError = addEventListener.mock.calls[0]![1] as (event: Pick<Event, 'target'>) => void;
  const later = image();
  const prdOriginal = original.replace('-uat.pages.dev', '.pages.dev');
  later.src = transformed.replace(original, prdOriginal);
  onError({ target: later });
  expect(later.src).toBe(prdOriginal);
  onError({ target: later });
  expect(later.removeAttribute).toHaveBeenCalledTimes(1);
  expect(() => onError({ target: null })).not.toThrow();
});
