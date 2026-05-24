import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  StripeCatalogExpectedPrice,
  StripeCatalogProductProjection,
} from '../apps/backend/src/application/commerce/catalog-sync';

type StoreItemSourceKind = 'distro' | 'release';

export type StripeCatalogAlignmentStatus = 'checkout_eligible' | 'future_buyable' | 'unavailable';

export type StripeCatalogStoreItemContract = {
  alignmentStatus: StripeCatalogAlignmentStatus;
  expectedSandboxPrice: StripeCatalogExpectedPrice | null;
  productProjection: StripeCatalogProductProjection;
  sourceId: string;
  sourceKind: StoreItemSourceKind;
  storeItemSlug: string;
  variantId: string;
};

type StripeCatalogProjectionOverride = {
  alignmentStatus?: StripeCatalogAlignmentStatus;
  expectedSandboxPrice?: StripeCatalogExpectedPrice;
  optionLabel?: string;
  productDescription?: string;
  taxCode?: string;
  variantId?: string;
};

type LoadStripeCatalogContractsOptions = {
  basePath?: string;
  projectRoot?: string;
  siteUrl?: string;
};

type ReleaseContent = {
  artist: string;
  cover_image: string;
  formats: string[];
  summary?: string;
  title: string;
};

type DistroContent = {
  artist_or_label: string;
  format: string;
  image: string;
  order: number;
  summary?: string;
  title: string;
};

const defaultSiteUrl = 'https://blackbox-studio-athens.github.io';
const defaultBasePath = '/blackbox-records/';
export const STRIPE_PHYSICAL_GOODS_TAX_CODE = 'txcd_99999999';

const releaseStoreItemSlugByReleaseId: Record<string, string> = {
  'barren-point': 'disintegration-black-vinyl-lp',
  caregivers: 'caregivers-vinyl',
};

const stripeCatalogProjectionOverrides: Record<string, StripeCatalogProjectionOverride> = {
  'disintegration-black-vinyl-lp': {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
    },
    optionLabel: 'Black Vinyl LP',
    variantId: 'variant_barren-point_standard',
  },
};

export async function loadStripeCatalogStoreItemContracts(
  options: LoadStripeCatalogContractsOptions = {},
): Promise<StripeCatalogStoreItemContract[]> {
  const projectRoot = options.projectRoot ?? resolveProjectRoot();
  const webContentRoot = path.join(projectRoot, 'apps', 'web', 'src', 'content');
  const [artistNames, releases, distroEntries] = await Promise.all([
    readArtistDisplayNames(path.join(webContentRoot, 'artists')),
    readReleaseContracts(path.join(webContentRoot, 'releases'), options),
    readDistroContracts(path.join(webContentRoot, 'distro'), options),
  ]);

  return [...releases.map((release) => applyArtistName(release, artistNames)), ...distroEntries]
    .map(assertValidStripeCatalogStoreItemContract)
    .sort((left, right) => left.storeItemSlug.localeCompare(right.storeItemSlug));
}

export function isStableAbsoluteStripeImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && Boolean(url.pathname);
  } catch {
    return false;
  }
}

export function assertValidStripeCatalogStoreItemContract(
  contract: StripeCatalogStoreItemContract,
): StripeCatalogStoreItemContract {
  if (!contract.productProjection.name.trim()) {
    throw new Error(`Product Projection name is missing for ${contract.storeItemSlug}.`);
  }

  if (!contract.productProjection.description.trim()) {
    throw new Error(`Product Projection description is missing for ${contract.storeItemSlug}.`);
  }

  const invalidImage = contract.productProjection.imageUrls.find(
    (imageUrl) => !isStableAbsoluteStripeImageUrl(imageUrl),
  );
  if (invalidImage) {
    throw new Error(
      `Product Projection image URL is not stable and absolute for ${contract.storeItemSlug}: ${invalidImage}`,
    );
  }

  return contract;
}

function resolveProjectRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..', '..')];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'apps', 'web', 'src', 'content'))) {
      return candidate;
    }
  }

  throw new Error('Unable to resolve project root for Stripe catalog contract projection.');
}

async function readArtistDisplayNames(artistsDir: string): Promise<Map<string, string>> {
  const entries = await readdir(artistsDir, { withFileTypes: true });
  const artists = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map(async (entry) => {
        const id = path.basename(entry.name, '.md');
        const frontmatter = parseFrontmatter(await readFile(path.join(artistsDir, entry.name), 'utf8'));
        return [id, String(frontmatter.title ?? id)] as const;
      }),
  );

  return new Map(artists);
}

async function readReleaseContracts(
  releasesDir: string,
  options: LoadStripeCatalogContractsOptions,
): Promise<Array<StripeCatalogStoreItemContract & { artistId: string }>> {
  const entries = await readdir(releasesDir, { withFileTypes: true });
  const releases = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map(async (entry) => {
        const sourceId = path.basename(entry.name, '.md');
        const content = parseFrontmatter(await readFile(path.join(releasesDir, entry.name), 'utf8')) as ReleaseContent;
        const storeItemSlug = releaseStoreItemSlugByReleaseId[sourceId] ?? sourceId;
        const override = stripeCatalogProjectionOverrides[storeItemSlug] ?? {};
        const optionLabel = override.optionLabel ?? content.formats[0] ?? null;
        const titleParts = ['BlackBox Records', content.title, optionLabel].filter(Boolean);

        return {
          ...createContract({
            alignmentStatus: override.alignmentStatus ?? 'checkout_eligible',
            description: override.productDescription ?? normalizeDescription(content.summary, content.title),
            expectedSandboxPrice: override.expectedSandboxPrice ?? createExpectedSandboxPrice(optionLabel),
            imageUrl: createContentAssetUrl('releases', content.cover_image, options),
            metadata: {
              sourceId,
              sourceKind: 'release',
              storeItemSlug,
            },
            name: titleParts.join(' - '),
            sourceId,
            sourceKind: 'release',
            storeItemSlug,
            taxCode: override.taxCode ?? STRIPE_PHYSICAL_GOODS_TAX_CODE,
            variantId: override.variantId ?? createDefaultVariantId(storeItemSlug),
          }),
          artistId: content.artist,
        };
      }),
  );

  return releases.sort((left, right) => left.storeItemSlug.localeCompare(right.storeItemSlug));
}

async function readDistroContracts(
  distroDir: string,
  options: LoadStripeCatalogContractsOptions,
): Promise<StripeCatalogStoreItemContract[]> {
  const entries = await readdir(distroDir, { withFileTypes: true });
  const distro = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== '___.json')
      .map(async (entry) => {
        const sourceId = path.basename(entry.name, '.json');
        const content = JSON.parse(await readFile(path.join(distroDir, entry.name), 'utf8')) as DistroContent;
        const override = stripeCatalogProjectionOverrides[sourceId] ?? {};
        const optionLabel = override.optionLabel ?? content.format;
        const titleParts = ['BlackBox Records', content.title, optionLabel].filter(Boolean);

        return createContract({
          alignmentStatus: override.alignmentStatus ?? 'checkout_eligible',
          description:
            override.productDescription ??
            normalizeDescription(content.summary, `${content.title} by ${content.artist_or_label}`),
          expectedSandboxPrice: override.expectedSandboxPrice ?? createExpectedSandboxPrice(optionLabel),
          imageUrl: createContentAssetUrl('distro', content.image, options),
          metadata: {
            sourceId,
            sourceKind: 'distro',
            storeItemSlug: sourceId,
          },
          name: titleParts.join(' - '),
          sourceId,
          sourceKind: 'distro',
          storeItemSlug: sourceId,
          taxCode: override.taxCode ?? STRIPE_PHYSICAL_GOODS_TAX_CODE,
          variantId: override.variantId ?? createDefaultVariantId(sourceId),
        });
      }),
  );

  return distro.sort((left, right) => left.storeItemSlug.localeCompare(right.storeItemSlug));
}

function applyArtistName(
  contract: StripeCatalogStoreItemContract & { artistId: string },
  artistNames: Map<string, string>,
): StripeCatalogStoreItemContract {
  const { artistId, ...rest } = contract;
  const artistName = artistNames.get(artistId) ?? artistId.replace(/-/g, ' ');

  return {
    ...rest,
    productProjection: {
      ...rest.productProjection,
      description: normalizeDescription(
        rest.productProjection.description,
        `${rest.productProjection.name} by ${artistName}`,
      ),
    },
  };
}

function createContract(input: {
  alignmentStatus: StripeCatalogAlignmentStatus;
  description: string;
  expectedSandboxPrice: StripeCatalogExpectedPrice | null;
  imageUrl: string;
  metadata: Record<string, string>;
  name: string;
  sourceId: string;
  sourceKind: StoreItemSourceKind;
  storeItemSlug: string;
  taxCode: string | null;
  variantId: string;
}): StripeCatalogStoreItemContract {
  return {
    alignmentStatus: input.alignmentStatus,
    expectedSandboxPrice: input.expectedSandboxPrice,
    productProjection: {
      description: input.description,
      imageUrls: [input.imageUrl],
      metadata: {
        ...input.metadata,
        variantId: input.variantId,
      },
      name: input.name,
      taxCode: input.taxCode,
    },
    sourceId: input.sourceId,
    sourceKind: input.sourceKind,
    storeItemSlug: input.storeItemSlug,
    variantId: input.variantId,
  };
}

function parseFrontmatter(markdown: string): Record<string, unknown> {
  const match = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---/.exec(markdown);
  if (!match?.groups?.frontmatter) {
    throw new Error('Markdown frontmatter is missing.');
  }

  const lines = match.groups.frontmatter.split(/\r?\n/);
  const result: Record<string, unknown> = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fieldMatch = /^(?<key>[A-Za-z0-9_]+):(?:\s*(?<value>.*))?$/.exec(line);
    if (!fieldMatch?.groups) {
      continue;
    }

    const key = fieldMatch.groups.key;
    const value = fieldMatch.groups.value ?? '';

    if (value === '') {
      const arrayValues: string[] = [];
      let cursor = index + 1;

      while (cursor < lines.length) {
        const arrayMatch = /^\s*-\s+(?<value>.+)$/.exec(lines[cursor]);
        if (!arrayMatch?.groups) {
          break;
        }

        arrayValues.push(cleanScalar(arrayMatch.groups.value));
        cursor += 1;
      }

      result[key] = arrayValues;
      index = cursor - 1;
      continue;
    }

    if (['|', '|-', '>', '>-'].includes(value)) {
      const blockLines: string[] = [];
      let cursor = index + 1;

      while (cursor < lines.length && /^(?:\s{2,}|$)/.test(lines[cursor])) {
        blockLines.push(lines[cursor].replace(/^\s{2}/, ''));
        cursor += 1;
      }

      result[key] = normalizeDescription(blockLines.join(value.startsWith('>') ? ' ' : '\n'), '');
      index = cursor - 1;
      continue;
    }

    result[key] = cleanScalar(value);
  }

  return result;
}

function cleanScalar(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function normalizeDescription(value: string | undefined, fallback: string): string {
  const normalized = (value ?? fallback).replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function createDefaultVariantId(storeItemSlug: string): string {
  return `variant_${storeItemSlug}_standard`;
}

export function createExpectedSandboxPrice(formatOrOptionLabel: string | null | undefined): StripeCatalogExpectedPrice {
  const normalized = (formatOrOptionLabel ?? '').toLowerCase();

  if (/\bcassette\b|\btape\b/.test(normalized)) {
    return {
      amountMinor: 1200,
      currencyCode: 'EUR',
    };
  }

  if (/\bt-?shirt\b|\btee\b/.test(normalized)) {
    return {
      amountMinor: 2000,
      currencyCode: 'EUR',
    };
  }

  return {
    amountMinor: 2800,
    currencyCode: 'EUR',
  };
}

function createContentAssetUrl(
  collection: 'distro' | 'releases',
  assetPath: string,
  options: LoadStripeCatalogContractsOptions,
): string {
  const assetName = path.basename(assetPath.replace(/^\.\//, ''));
  const basePath = normalizeBasePath(options.basePath ?? process.env.ASTRO_BASE_PATH ?? defaultBasePath);
  const siteUrl = options.siteUrl ?? process.env.ASTRO_SITE_URL ?? defaultSiteUrl;
  return new URL(`${basePath}/admin/media/${collection}/${encodeURIComponent(assetName)}`, siteUrl).toString();
}

function normalizeBasePath(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized === '/') return '';
  return `/${normalized.replace(/^\/+|\/+$/g, '')}`;
}
