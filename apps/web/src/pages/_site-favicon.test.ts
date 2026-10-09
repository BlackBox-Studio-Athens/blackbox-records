import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { siteBrandAssets, siteThemeColor } from '../platform/config/site';

const publicDirectory = fileURLToPath(new URL('../../public/', import.meta.url));
const sourceDirectory = fileURLToPath(new URL('../', import.meta.url));

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = `${directory}/${entry}`;
    const stats = statSync(path);

    if (stats.isDirectory()) return listSourceFiles(path);
    return stats.isFile() ? [path] : [];
  });
}

describe('site favicon assets', () => {
  it('uses stable favicon asset URLs', () => {
    expect(siteBrandAssets).toMatchObject({
      faviconSvg: '/favicon.svg',
      faviconPng96: '/favicon-96x96.png',
      faviconIco: '/favicon.ico',
    });
  });

  it('does not reference stale cube favicon files in source', () => {
    const staleFaviconIco = ['favicon', 'cube.ico'].join('-');
    const staleFaviconPng = ['favicon', 'cube', '96x96.png'].join('-');
    const staleReferences = listSourceFiles(sourceDirectory)
      .filter((path) => /\.(astro|css|js|jsx|ts|tsx)$/.test(path))
      .flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        return source.includes(staleFaviconIco) || source.includes(staleFaviconPng) ? [path] : [];
      });

    expect(staleReferences).toEqual([]);
  });

  it('renders the 96px PNG as a transparent cube-only mark', async () => {
    const image = sharp(`${publicDirectory}/favicon-96x96.png`).ensureAlpha();
    const metadata = await image.metadata();
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    expect(metadata.width).toBe(96);
    expect(metadata.height).toBe(96);
    expect(info.channels).toBe(4);

    const cornerAlphaValues = [data[3], data[95 * 4 + 3], data[(95 * 96 + 0) * 4 + 3], data[(95 * 96 + 95) * 4 + 3]];
    expect(cornerAlphaValues).toEqual([0, 0, 0, 0]);

    let opaquePixels = 0;
    let darkPixels = 0;
    let lightPixels = 0;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      const alpha = data[index + 3] ?? 0;

      if (alpha <= 128) continue;

      opaquePixels += 1;

      if (red < 32 && green < 32 && blue < 32) darkPixels += 1;
      if (red > 200 && green > 200 && blue > 200) lightPixels += 1;
    }

    const coverage = opaquePixels / (96 * 96);

    expect(coverage).toBeGreaterThan(0.08);
    expect(coverage).toBeLessThan(0.14);
    expect(darkPixels).toBe(0);
    expect(lightPixels).toBeGreaterThan(800);
  });
});

describe('home-screen icons and web app manifest', () => {
  it('renders opaque square brand icons on the site background', async () => {
    for (const [path, size] of [
      [siteBrandAssets.appleTouchIcon, 180],
      [siteBrandAssets.appIcon192, 192],
      [siteBrandAssets.appIcon512, 512],
      [siteBrandAssets.appIconMaskable512, 512],
    ] as const) {
      const { data, info } = await sharp(`${publicDirectory}${path}`)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect([info.width, info.height]).toEqual([size, size]);
      // Opaque corners in #0d0d0d, so iOS and Android masks never show a light or transparent edge.
      for (const pixel of [0, size - 1, (size - 1) * size, size * size - 1])
        expect([...data.subarray(pixel * 4, pixel * 4 + 4)]).toEqual([13, 13, 13, 255]);
      // The centre crosses the light cube outline drawn from favicon.svg; the icon stays monochrome.
      let light = 0;
      let chroma = 0;
      for (let index = 0; index < data.length; index += 4) {
        const red = data[index]!;
        const green = data[index + 1]!;
        const blue = data[index + 2]!;
        chroma = Math.max(chroma, Math.max(red, green, blue) - Math.min(red, green, blue));
        if (red > 160) light += 1;
      }
      expect(chroma).toBeLessThan(12);
      expect(light / (size * size)).toBeGreaterThan(0.03);
    }
  });

  it('lists the icons with base-relative start_url and scope', () => {
    const manifest = JSON.parse(readFileSync(`${publicDirectory}${siteBrandAssets.webManifest}`, 'utf8'));
    expect(manifest).toMatchObject({
      start_url: './',
      scope: './',
      display: 'minimal-ui',
      background_color: siteThemeColor,
      theme_color: siteThemeColor,
    });
    expect(manifest.icons.map((icon: { src: string }) => `/${icon.src}`)).toEqual([
      siteBrandAssets.appIcon192,
      siteBrandAssets.appIcon512,
      siteBrandAssets.appIconMaskable512,
    ]);
    expect(manifest.icons.at(-1).purpose).toBe('maskable');
  });
});
