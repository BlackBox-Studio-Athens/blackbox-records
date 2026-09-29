import { afterEach, describe, expect, it, vi } from 'vitest';

import { SHELL_FIRST_SCREEN_IMAGE_WAIT_MS, waitForEagerImages } from './shell-first-screen-images';

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
});
