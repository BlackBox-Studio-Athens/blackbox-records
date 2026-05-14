import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import { siteBrandAssets } from './site';

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
