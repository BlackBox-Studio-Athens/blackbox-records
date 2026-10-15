import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const size = (file: string) => statSync(new URL(`./_assets/home-hero/${file}`, import.meta.url)).size;
const MiB = 1024 * 1024;

// AV1 carries the 2560 × 1440 and 1080 × 1920 films; H.264 is the lighter-resolution fallback.
describe('Home hero media', () => {
  it('bounds the landscape films', () => {
    expect(size('home-hero-intro-landscape-av1.mp4')).toBeLessThan(5 * MiB);
    expect(size('home-hero-intro-landscape.mp4')).toBeLessThan(5.5 * MiB);
  });

  it('bounds the portrait films that phones download', () => {
    expect(size('home-hero-intro-portrait-av1.mp4')).toBeLessThan(2.75 * MiB);
    expect(size('home-hero-intro-portrait.mp4')).toBeLessThan(3 * MiB);
  });
});
