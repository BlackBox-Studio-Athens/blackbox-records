import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

import {
  evaluateImageMetadata,
  evaluateProviderProductImageUrls,
  formatDiagnostic,
  inspectImageAsset,
  runAssetCheck,
  type AssetDiagnostic,
} from '../../scripts/check-assets';
import type { StripeCatalogStoreItemContract } from '../../../../scripts/stripe-catalog-contract';

const temporaryDirectories: string[] = [];

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'blackbox-assets-'));
  temporaryDirectories.push(directory);
  return directory;
}

function createAssetCheckWorkspace() {
  const root = createTemporaryDirectory();
  const webRoot = join(root, 'apps', 'web');

  mkdirSync(join(webRoot, 'public'), { recursive: true });
  mkdirSync(join(webRoot, 'src', 'content', 'artists'), { recursive: true });
  mkdirSync(join(webRoot, 'src', 'content', 'distro'), { recursive: true });
  mkdirSync(join(webRoot, 'src', 'content', 'news'), { recursive: true });
  mkdirSync(join(webRoot, 'src', 'content', 'releases'), { recursive: true });

  return { root, webRoot };
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

  it('warns when a content image is missing alt coverage', async () => {
    const { webRoot } = createAssetCheckWorkspace();
    const imagePath = join(webRoot, 'src', 'content', 'news', 'example.jpg');

    await sharp({
      create: {
        background: { alpha: 1, b: 0, g: 0, r: 0 },
        channels: 4,
        height: 64,
        width: 64,
      },
    })
      .jpeg()
      .toFile(imagePath);

    writeFileSync(
      join(webRoot, 'src', 'content', 'news', 'example.md'),
      ['---', 'title: Example', 'date: 2026-06-01', 'summary: Example', 'image: example.jpg', '---', ''].join('\n'),
    );

    const result = await runAssetCheck(webRoot);

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetPath: 'src/content/news/example.md',
          ruleId: 'missing-alt',
          severity: 'warning',
        }),
      ]),
    );
    expect(result.diagnostics.some((diagnostic) => diagnostic.ruleId === 'missing-image')).toBe(false);
  });

  it('warns when a content image uses an unsupported extension', async () => {
    const { webRoot } = createAssetCheckWorkspace();

    writeFileSync(
      join(webRoot, 'src', 'content', 'news', 'example.md'),
      [
        '---',
        'title: Example',
        'date: 2026-06-01',
        'summary: Example',
        'image: example.psd',
        'image_alt: Example',
        '---',
        '',
      ].join('\n'),
    );

    const result = await runAssetCheck(webRoot);

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetPath: 'src/content/news/example.psd',
          ruleId: 'unsupported-image',
          severity: 'warning',
        }),
      ]),
    );
  });

  it('flags provider product image urls that are not absolute and environment scoped', () => {
    const diagnostics = evaluateProviderProductImageUrls('uat', [
      {
        productProjection: {
          description: 'Example',
          imageUrls: ['/admin/media/distro/example.jpg'],
          metadata: {},
          name: 'Example Product',
          taxCode: null,
        },
        storeItemSlug: 'example-product',
      } as StripeCatalogStoreItemContract,
      {
        productProjection: {
          description: 'Example',
          imageUrls: ['https://example.com/admin/media/distro/example.jpg'],
          metadata: {},
          name: 'Example Product',
          taxCode: null,
        },
        storeItemSlug: 'example-product-wrong-base',
      } as StripeCatalogStoreItemContract,
    ]);

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetPath: 'catalog:uat:example-product',
          message: 'Provider product image URL must be absolute.',
          ruleId: 'provider-url-readiness',
          severity: 'error',
        }),
        expect.objectContaining({
          assetPath: 'catalog:uat:example-product-wrong-base',
          message: 'Provider product image URL must use the UAT asset base.',
          ruleId: 'provider-url-readiness',
          severity: 'error',
        }),
      ]),
    );
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
