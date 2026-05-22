import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

import {
  evaluateImageMetadata,
  formatDiagnostic,
  inspectImageAsset,
  type AssetDiagnostic,
} from '../../scripts/check-assets';

const temporaryDirectories: string[] = [];

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'blackbox-assets-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('asset QA rule engine', () => {
  it('accepts the expected transparent 96px PNG favicon metadata', () => {
    expect(
      evaluateImageMetadata(
        { path: 'public/favicon-96x96.png' },
        {
          channels: 4,
          format: 'png',
          hasAlpha: true,
          height: 96,
          width: 96,
        },
      ),
    ).toEqual([]);
  });

  it('fails favicon dimensions with an actionable stable diagnostic', () => {
    expect(
      evaluateImageMetadata(
        { path: 'public/favicon-96x96.png' },
        {
          channels: 4,
          format: 'png',
          hasAlpha: true,
          height: 128,
          width: 128,
        },
      ),
    ).toEqual([
      {
        actual: 'png 128x128',
        assetPath: 'public/favicon-96x96.png',
        expected: 'png 96x96',
        message: 'PNG favicon must remain the browser-declared 96px square asset.',
        ruleId: 'favicon-size',
        severity: 'error',
      },
    ]);
  });

  it('warns on artist images that miss the documented 3:4 portrait source standard', () => {
    expect(
      evaluateImageMetadata(
        {
          collection: 'artists',
          fieldPath: 'image',
          path: 'src/content/artists/afterwise.jpg',
          sourcePath: 'src/content/artists/afterwise.md',
        },
        {
          channels: 3,
          format: 'jpeg',
          hasAlpha: false,
          height: 1365,
          width: 2048,
        },
      ),
    ).toEqual([
      {
        actual: '2048x1365 (1.500)',
        assetPath: 'src/content/artists/afterwise.jpg',
        expected: 'at least 1200x1600 and 3:4 ratio',
        message: 'Artist roster images should be portrait-oriented sources for the documented 3:4 crop.',
        ruleId: 'artist-portrait-ratio',
        severity: 'warning',
        sourcePath: 'src/content/artists/afterwise.md',
      },
    ]);
  });

  it('reports missing dimensions as an unreadable image error', () => {
    expect(evaluateImageMetadata({ path: 'src/content/releases/broken.jpg' }, { format: 'jpeg' })).toEqual([
      {
        assetPath: 'src/content/releases/broken.jpg',
        message: 'Sharp could not read stable image dimensions.',
        ruleId: 'unreadable-image',
        severity: 'error',
      },
    ]);
  });

  it('formats diagnostics deterministically for command output', () => {
    const diagnostic: AssetDiagnostic = {
      actual: 'jpeg 128x128',
      assetPath: 'src/content/releases/broken.jpg',
      expected: 'png 96x96',
      message: 'PNG favicon must remain the browser-declared 96px square asset.',
      ruleId: 'favicon-size',
      severity: 'error',
      sourcePath: 'src/content/releases/broken.md',
    };

    expect(formatDiagnostic(diagnostic)).toBe(
      '[error] favicon-size src/content/releases/broken.jpg source=src/content/releases/broken.md - PNG favicon must remain the browser-declared 96px square asset. expected=png 96x96 actual=jpeg 128x128',
    );
  });

  it('returns an unreadable-image diagnostic for files Sharp cannot inspect', async () => {
    const directory = createTemporaryDirectory();
    const assetPath = join(directory, 'not-an-image.jpg');
    writeFileSync(assetPath, 'not an image');

    const diagnostics = await inspectImageAsset({ path: assetPath });

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.ruleId).toBe('unreadable-image');
    expect(diagnostics[0]?.severity).toBe('error');
  });

  it('can inspect a valid generated image without mutating it', async () => {
    const directory = createTemporaryDirectory();
    const assetPath = join(directory, 'valid.png');
    await sharp({
      create: {
        background: { alpha: 1, b: 0, g: 0, r: 0 },
        channels: 4,
        height: 96,
        width: 96,
      },
    })
      .png()
      .toFile(assetPath);

    await expect(inspectImageAsset({ path: assetPath })).resolves.toEqual([]);
  });
});
