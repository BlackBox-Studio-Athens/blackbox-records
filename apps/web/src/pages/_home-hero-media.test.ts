import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Home hero media', () => {
  it('bounds the landscape film to 4 MiB', () => {
    expect(statSync(new URL('./_assets/home-hero/home-hero-intro-landscape.mp4', import.meta.url)).size).toBeLessThan(
      4 * 1024 * 1024,
    );
  });

  it('bounds the portrait film to 2 MiB', () => {
    expect(statSync(new URL('./_assets/home-hero/home-hero-intro-portrait.mp4', import.meta.url)).size).toBeLessThan(
      2 * 1024 * 1024,
    );
  });
});
