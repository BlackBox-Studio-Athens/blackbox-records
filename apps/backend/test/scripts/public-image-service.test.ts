import { expect, it } from 'vitest';
import type { ImageMetadata } from 'astro';
import service from '../../src/cms/public-image-service';
import { publicImageWidths } from '../../src/cms/public-image-transform';

const config: Parameters<typeof service.getURL>[1] = {
  domains: [],
  endpoint: { route: '/_image' },
  dangerouslyProcessSVG: false,
  remotePatterns: [],
  responsiveStyles: false,
  service: {
    entrypoint: '',
    config: {
      sourceOrigin: 'https://blackbox-records-web-uat.pages.dev',
      transformationOrigin: 'https://images.blackboxrecordsathens.com',
    },
  },
};
const logger = {} as Parameters<typeof service.getURL>[2];
const sha = 'a'.repeat(64);
const source: ImageMetadata = { src: `/media/content/${sha}`, width: 1333, height: 1600, format: 'png' };

it('direct URLs preserve editorial WebP68 and canonicalize legacy sources', async () => {
  const options = await service.validateOptions!(
    { src: source, width: 540, format: 'webp', quality: 68 },
    config,
    logger,
  );
  expect(options.format).toBe('webp');
  expect(options.quality).toBe(68);
  expect(await service.getURL(options, config, logger)).toBe(
    `https://images.blackboxrecordsathens.com/cdn-cgi/image/width=640,format=webp,quality=68/https://blackbox-records-web-uat.pages.dev/media/content/${sha}`,
  );
  const legacy = { ...source, src: `/media/content/${'b'.repeat(64)}/${sha}` };
  expect(await service.getURL({ src: legacy, width: 540, format: 'webp', quality: 68 }, config, logger)).toBe(
    await service.getURL(options, config, logger),
  );
});

it('every CMS srcset candidate uses direct Images delivery; ESM assets stay plain fingerprinted URLs', async () => {
  const options = await service.validateOptions!(
    { src: source, widths: [...publicImageWidths], sizes: '100vw', quality: 68 },
    config,
    logger,
  );
  const candidates = await service.getSrcSet!(options, config, logger);
  expect(candidates.length).toBeGreaterThan(5);
  for (const candidate of candidates)
    expect(await service.getURL(candidate.transform, config, logger)).toMatch(
      /^https:\/\/images\.blackboxrecordsathens\.com\/cdn-cgi\/image\/width=\d+,format=webp,quality=68\//,
    );
  const logo = { ...source, src: '/_astro/logo.fingerprint.png' };
  expect(await service.getURL({ src: logo, width: 96 }, config, logger)).toBe(logo.src);
  expect(await service.getURL({ src: '/_preview/media/private', width: 96, height: 96 }, config, logger)).toBe(
    '/_preview/media/private',
  );
});

it('keeps metadata JPEG at one 1200px ceiling even for smaller originals', async () => {
  const options = await service.validateOptions!({ src: source, width: 1200, format: 'jpg' }, config, logger);
  const url = await service.getURL(options, config, logger);
  expect(url).toContain('/width=1200,format=jpeg/');
  expect(await service.getURL({ src: { ...source, width: 1000 }, width: 1000, format: 'jpg' }, config, logger)).toBe(
    url,
  );
  expect(() => service.getURL({ src: source, width: 480, format: 'jpg' }, config, logger)).toThrow('profile');
});

it('preserves blurred fills and small cart/gallery derivatives', async () => {
  const blur = await service.validateOptions!({ src: source, width: 160, quality: 40 }, config, logger);
  expect(await service.getURL(blur, config, logger)).toContain('/width=160,format=webp,quality=40/');
  for (const [width, snapped] of [
    [144, 160],
    [176, 240],
    [216, 240],
  ]) {
    expect(await service.getURL({ src: source, width, format: 'webp' }, config, logger)).toContain(
      `/width=${snapped},format=webp/`,
    );
  }
});

it('rejects unknown widths and arbitrary formats or qualities instead of discarding them', async () => {
  for (const width of [0, -1, 481, 480.5, Number.NaN, 2400])
    expect(() => service.getURL({ src: source, width }, config, logger)).toThrow();
  expect(await service.getURL({ src: source, width: source.width }, config, logger)).toContain(
    '/width=1400,format=auto/',
  );
  for (const options of [
    { format: 'avif' as const },
    { format: 'png' as const },
    { quality: 70 },
    { quality: 'low' },
    { quality: 40 },
  ])
    expect(() => service.getURL({ src: source, width: 480, ...options }, config, logger)).toThrow('profile');
});

it('bounds all emitted options plus legacy auto to 53 transforms per source', async () => {
  const media = { ...source, width: 2400 };
  const urls = new Set<string>();
  for (const width of [...publicImageWidths, 144, 176, 216, 540, media.width]) {
    for (const options of [{}, { format: 'webp' as const }, { format: 'webp' as const, quality: 68 }])
      urls.add(await service.getURL({ src: media, width, ...options }, config, logger));
  }
  urls.add(await service.getURL({ src: media, width: 160, quality: 40 }, config, logger));
  urls.add(await service.getURL({ src: media, width: 1200, format: 'jpg' }, config, logger));
  expect(urls.size).toBe(53); // 3 x 17 rungs, one blur and one metadata derivative; no allowance increase.
});

it('Local has no transform and invalid hosted configuration fails closed', async () => {
  const local = { ...config, service: { ...config.service, config: { sourceOrigin: '', transformationOrigin: '' } } };
  expect(await service.getURL({ src: source, width: 480 }, local, logger)).toBe(source.src);
  const invalid = {
    ...config,
    service: { ...config.service, config: { ...config.service.config, sourceOrigin: 'http://foreign.invalid' } },
  };
  expect(() => service.getURL({ src: source, width: 480 }, invalid, logger)).toThrow(
    'Invalid hosted image configuration',
  );
});
