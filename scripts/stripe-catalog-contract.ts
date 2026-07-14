import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  DesiredCatalogEntry,
  StripeCatalogExpectedPrice,
  StripeCatalogProductProjection,
} from '../apps/backend/src/application/commerce/catalog-sync';
import { parseProductEnvironmentCliTarget, type ProductEnvironment } from '../apps/backend/src/env';
import { createSlugSuggestion } from '../apps/web/src/lib/slugs';
import {
  createPhysicalEditionKey,
  createValidatedStoreItemProjection,
  type CanonicalStoreItemProjection,
} from '../apps/web/src/lib/store-item-ownership';
import {
  loadDistroInventorySource,
  reconcileDistroContentWithInventorySource,
  type DistroInventorySourceRow,
} from './distro-inventory-source';

type StoreItemSourceKind = 'distro' | 'release';
export type CatalogProductEnvironment = Extract<ProductEnvironment, 'UAT' | 'PRD'>;

export type StripeCatalogAlignmentStatus = 'checkout_eligible' | 'future_buyable' | 'unavailable';

export type StripeCatalogStoreItemContract = {
  alignmentStatus: StripeCatalogAlignmentStatus;
  desiredCatalogEntry: DesiredCatalogEntry;
  expectedSandboxPrice: StripeCatalogExpectedPrice | null;
  productProjection: StripeCatalogProductProjection;
  sourceId: string;
  sourceKind: StoreItemSourceKind;
  storeItemSlug: string;
  variantId: string;
};

export type LoadStripeCatalogContractsOptions = {
  basePath?: string;
  productEnvironment?: CatalogProductEnvironment;
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
  format?: string;
  group: string;
  image: string;
  order: number;
  summary?: string;
  title: string;
};

type StripeCatalogContractCandidate = {
  contract: StripeCatalogStoreItemContract;
  physicalEditionKeys: string[];
};

type ReleaseCatalogContractCandidate = {
  artistId: string;
  contract: StripeCatalogStoreItemContract;
  itemType: string;
  title: string;
};

const defaultSiteUrl = 'https://blackbox-studio-athens.github.io';
const defaultBasePath = '/blackbox-records/';
const prdSiteUrl = 'https://blackbox-records-web.pages.dev';
const prdBasePath = '/';
const CATALOG_RELEASE_IMAGE_OVERRIDES: Record<string, string> = {
  anarchotribal: 'ouranopithecus-album-cover-distro-mockup.webp',
  disintegration: 'afterwise-album-cover-distro-mockup.webp',
};
export const STRIPE_PHYSICAL_GOODS_TAX_CODE = 'txcd_99999999';

const nonPhysicalReleaseFormats = new Set(['digital']);

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

  const candidates = [...releases.map((release) => applyArtistName(release, artistNames)), ...distroEntries];
  const contractsBySource = new Map(
    candidates.map((candidate) => [
      `${candidate.contract.sourceKind}:${candidate.contract.sourceId}`,
      candidate.contract,
    ]),
  );
  const projection = createValidatedStoreItemProjection(
    candidates.map((candidate) => ({
      physicalEditionKeys: candidate.physicalEditionKeys,
      sourceId: candidate.contract.sourceId,
      sourceKind: candidate.contract.sourceKind,
      storeItemSlug: candidate.contract.storeItemSlug,
    })),
  );

  return projection
    .map((entry) => {
      const contract = contractsBySource.get(`${entry.sourceKind}:${entry.sourceId}`)!;
      return applyCanonicalCatalogIdentity(contract, entry);
    })
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
): Promise<ReleaseCatalogContractCandidate[]> {
  const entries = await readdir(releasesDir, { withFileTypes: true });
  const releases = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map(async (entry) => {
        const sourceId = path.basename(entry.name, '.md');
        const content = parseFrontmatter(await readFile(path.join(releasesDir, entry.name), 'utf8')) as ReleaseContent;
        const optionLabel = getPrimaryReleaseStoreFormat(content.formats);
        const storeItemSlug = createReleaseStoreItemSlug(content);
        const coverImage = resolveCatalogCoverImagePathForRelease(sourceId, content.cover_image);
        const titleParts = ['BlackBox Records', content.title, optionLabel].filter(Boolean);
        const expectedPrice = createExpectedSandboxPrice(optionLabel);

        return {
          artistId: content.artist,
          contract: createContract({
            alignmentStatus: 'checkout_eligible',
            description: normalizeDescription(content.summary, content.title),
            expectedSandboxPrice: expectedPrice,
            imageUrl: createContentAssetUrl('releases', coverImage, options),
            metadata: {
              sourceId,
              sourceKind: 'release',
              storeItemSlug,
            },
            name: titleParts.join(' - '),
            sourceId,
            sourceKind: 'release',
            storeItemSlug,
            taxCode: STRIPE_PHYSICAL_GOODS_TAX_CODE,
            desiredPrice: expectedPrice,
            variantId: createDefaultVariantId(storeItemSlug),
          }),
          itemType: optionLabel ?? '',
          title: content.title,
        };
      }),
  );

  return releases.sort((left, right) => left.contract.storeItemSlug.localeCompare(right.contract.storeItemSlug));
}

async function readDistroContracts(
  distroDir: string,
  options: LoadStripeCatalogContractsOptions,
): Promise<StripeCatalogContractCandidate[]> {
  const inventorySource = await loadDistroInventorySource(options.projectRoot);
  const entries = await readdir(distroDir, { withFileTypes: true });
  const contents = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => {
        const sourceId = path.basename(entry.name, '.json');
        const content = JSON.parse(await readFile(path.join(distroDir, entry.name), 'utf8')) as DistroContent;
        return { content, sourceId };
      }),
  );
  const inventoryRowsBySourceId =
    contents.length === 0
      ? new Map<string, DistroInventorySourceRow>()
      : reconcileDistroContentWithInventorySource(
          inventorySource,
          contents.map(({ content, sourceId }) => ({ ...content, sourceId })),
        );
  const distro = contents.map(({ content, sourceId }) => {
    const inventoryRow = inventoryRowsBySourceId.get(sourceId)!;
    const optionLabel = content.format ?? null;
    const titleParts = ['BlackBox Records', content.title, optionLabel].filter(Boolean);
    const expectedPrice = createExpectedSandboxPriceForDistroInventoryRow(inventoryRow);

    return {
      contract: createContract({
        alignmentStatus: 'checkout_eligible',
        description: normalizeDescription(content.summary, `${content.title} by ${content.artist_or_label}`),
        expectedSandboxPrice: expectedPrice,
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
        taxCode: STRIPE_PHYSICAL_GOODS_TAX_CODE,
        desiredPrice: expectedPrice,
        variantId: createDefaultVariantId(sourceId),
      }),
      physicalEditionKeys: [
        createPhysicalEditionKey({
          artist: inventoryRow.sourceArtist,
          itemType: inventoryRow.itemType,
          title: inventoryRow.sourceTitle,
        }),
        ...inventoryRow.sourceAliases.map((alias) => createPhysicalEditionKey(alias)),
      ],
    };
  });

  return distro.sort((left, right) => left.contract.storeItemSlug.localeCompare(right.contract.storeItemSlug));
}

function applyArtistName(
  candidate: ReleaseCatalogContractCandidate,
  artistNames: Map<string, string>,
): StripeCatalogContractCandidate {
  const artistName = artistNames.get(candidate.artistId) ?? candidate.artistId.replace(/-/g, ' ');
  const contract = candidate.contract;

  return {
    contract: {
      ...contract,
      productProjection: {
        ...contract.productProjection,
        description: normalizeDescription(
          contract.productProjection.description,
          `${contract.productProjection.name} by ${artistName}`,
        ),
      },
    },
    physicalEditionKeys: [
      createPhysicalEditionKey({ artist: artistName, itemType: candidate.itemType, title: candidate.title }),
    ],
  };
}

function applyCanonicalCatalogIdentity(
  contract: StripeCatalogStoreItemContract,
  projection: CanonicalStoreItemProjection,
): StripeCatalogStoreItemContract {
  const productProjection = {
    ...contract.productProjection,
    metadata: {
      ...contract.productProjection.metadata,
      sourceId: projection.sourceId,
      sourceKind: projection.sourceKind,
      storeItemSlug: projection.storeItemSlug,
      variantId: projection.variantId,
    },
  };

  return {
    ...contract,
    desiredCatalogEntry: {
      ...contract.desiredCatalogEntry,
      desiredPrice: contract.expectedSandboxPrice
        ? createDesiredPrice(contract.expectedSandboxPrice, projection.storeItemSlug)
        : null,
      productProjection,
      sourceId: projection.sourceId,
      sourceKind: projection.sourceKind,
      storeItemSlug: projection.storeItemSlug,
      variantId: projection.variantId,
    },
    productProjection,
    sourceId: projection.sourceId,
    sourceKind: projection.sourceKind,
    storeItemSlug: projection.storeItemSlug,
    variantId: projection.variantId,
  };
}

function createContract(input: {
  alignmentStatus: StripeCatalogAlignmentStatus;
  description: string;
  desiredPrice: StripeCatalogExpectedPrice | null;
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
  const productProjection = {
    description: input.description,
    imageUrls: [input.imageUrl],
    metadata: {
      ...input.metadata,
      variantId: input.variantId,
    },
    name: input.name,
    taxCode: input.taxCode,
  };

  return {
    alignmentStatus: input.alignmentStatus,
    desiredCatalogEntry: {
      availability: 'published',
      desiredPrice: input.desiredPrice ? createDesiredPrice(input.desiredPrice, input.storeItemSlug) : null,
      productProjection,
      sourceId: input.sourceId,
      sourceKind: input.sourceKind,
      stockInitialization: {
        initialOnlineQuantity: null,
      },
      storeItemSlug: input.storeItemSlug,
      targetEnvironments: ['uat'],
      variantId: input.variantId,
    },
    expectedSandboxPrice: input.expectedSandboxPrice,
    productProjection,
    sourceId: input.sourceId,
    sourceKind: input.sourceKind,
    storeItemSlug: input.storeItemSlug,
    variantId: input.variantId,
  };
}

function createDesiredPrice(
  price: StripeCatalogExpectedPrice,
  storeItemSlug: string,
): DesiredCatalogEntry['desiredPrice'] {
  return {
    ...price,
    currencyCode: price.currencyCode,
    revision: createPriceRevision(storeItemSlug, price),
  };
}

function parseFrontmatter(markdown: string): Record<string, unknown> {
  const match = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---/.exec(markdown);
  if (!match?.groups?.frontmatter) {
    throw new Error('Markdown frontmatter is missing.');
  }

  const lines = match.groups.frontmatter.split(/\r?\n/);
  return parseYamlObject(lines, 0, 0).value;
}

function parseYamlObject(
  lines: string[],
  startIndex: number,
  expectedIndent: number,
): { nextIndex: number; value: Record<string, unknown> } {
  const result: Record<string, unknown> = {};

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    const indent = getIndent(line);
    if (indent < expectedIndent) {
      return { nextIndex: index, value: result };
    }

    if (indent > expectedIndent) {
      continue;
    }

    const fieldMatch = /^\s*(?<key>[A-Za-z0-9_]+):(?:\s*(?<value>.*))?$/.exec(line);
    if (!fieldMatch?.groups) {
      continue;
    }

    const key = fieldMatch.groups.key;
    const value = fieldMatch.groups.value ?? '';

    if (value === '') {
      const childIndex = findNextMeaningfulLineIndex(lines, index + 1);
      if (childIndex === -1 || getIndent(lines[childIndex]) <= indent) {
        result[key] = [];
        continue;
      }

      if (/^\s*-\s+/.test(lines[childIndex])) {
        const parsed = parseYamlArray(lines, childIndex, getIndent(lines[childIndex]));
        result[key] = parsed.value;
        index = parsed.nextIndex - 1;
        continue;
      }

      const parsed = parseYamlObject(lines, childIndex, getIndent(lines[childIndex]));
      result[key] = parsed.value;
      index = parsed.nextIndex - 1;
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

    result[key] = parseYamlScalar(value);
  }

  return { nextIndex: lines.length, value: result };
}

function parseYamlArray(
  lines: string[],
  startIndex: number,
  expectedIndent: number,
): { nextIndex: number; value: string[] } {
  const values: string[] = [];
  let cursor = startIndex;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!line.trim()) {
      cursor += 1;
      continue;
    }

    if (getIndent(line) !== expectedIndent) {
      break;
    }

    const arrayMatch = /^\s*-\s+(?<value>.+)$/.exec(line);
    if (!arrayMatch?.groups) {
      break;
    }

    values.push(cleanScalar(arrayMatch.groups.value));
    cursor += 1;
  }

  return { nextIndex: cursor, value: values };
}

function findNextMeaningfulLineIndex(lines: string[], startIndex: number): number {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index].trim()) {
      return index;
    }
  }

  return -1;
}

function getIndent(value: string): number {
  return /^\s*/.exec(value)?.[0].length ?? 0;
}

function parseYamlScalar(value: string): boolean | number | string {
  const scalar = cleanScalar(value);
  if (scalar === 'true') return true;
  if (scalar === 'false') return false;
  if (/^-?\d+$/.test(scalar)) return Number(scalar);
  return scalar;
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

export function getPrimaryReleaseStoreFormat(formats: readonly string[] | undefined): string | null {
  return (
    formats?.find((format) => {
      const normalized = format.trim().toLowerCase();
      return normalized && !nonPhysicalReleaseFormats.has(normalized);
    }) ?? null
  );
}

function createReleaseStoreItemSlug(content: Pick<ReleaseContent, 'formats' | 'title'>): string {
  const optionLabel = getPrimaryReleaseStoreFormat(content.formats);
  return createSlugSuggestion([content.title, optionLabel].filter(Boolean).join(' '));
}

export function createExpectedSandboxPrice(formatOrOptionLabel: string | null | undefined): StripeCatalogExpectedPrice {
  const normalized = (formatOrOptionLabel ?? '').toLowerCase();

  if (/\bcassette\b|\btape\b/.test(normalized)) {
    return {
      amountMinor: 1200,
      currencyCode: 'EUR',
      kind: 'fixed',
    };
  }

  if (/\bt-?shirt\b|\btee\b/.test(normalized)) {
    return {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    };
  }

  return {
    amountMinor: 2800,
    currencyCode: 'EUR',
    kind: 'fixed',
  };
}

function createExpectedSandboxPriceForDistroInventoryRow(row: DistroInventorySourceRow): StripeCatalogExpectedPrice {
  return row.pricePolicy;
}

function createPriceRevision(storeItemSlug: string, price: StripeCatalogExpectedPrice): string {
  if (price.kind === 'pay_what_you_want') {
    return createSlugSuggestion(
      [
        storeItemSlug,
        'pay what you want',
        price.minimumAmountMinor,
        price.presetAmountMinor,
        price.maximumAmountMinor,
        price.currencyCode,
      ].join(' '),
    );
  }

  return createSlugSuggestion([storeItemSlug, price.amountMinor, price.currencyCode].join(' '));
}

function createContentAssetUrl(
  collection: 'distro' | 'releases',
  assetPath: string,
  options: LoadStripeCatalogContractsOptions,
): string {
  const assetName = path.basename(assetPath.replace(/^\.\//, ''));
  const target = resolveCatalogAssetTarget(options);
  const basePath = normalizeBasePath(options.basePath ?? target.basePath);
  const siteUrl = options.siteUrl ?? target.siteUrl;
  return new URL(`${basePath}/admin/media/${collection}/${encodeURIComponent(assetName)}`, siteUrl).toString();
}

function resolveCatalogImageOverrideForRelease(sourceId: string): string | undefined {
  return CATALOG_RELEASE_IMAGE_OVERRIDES[sourceId];
}

function resolveCatalogCoverImagePathForRelease(sourceId: string, coverImage: string): string {
  return resolveCatalogImageOverrideForRelease(sourceId) ?? coverImage;
}

export function resolveCatalogAssetTarget(options: LoadStripeCatalogContractsOptions): {
  basePath: string;
  siteUrl: string;
} {
  const productEnvironment =
    options.productEnvironment ?? parseCatalogProductEnvironment(process.env.CATALOG_PRODUCT_ENVIRONMENT);

  if (productEnvironment === 'PRD') {
    return {
      basePath: process.env.PRD_CATALOG_ASSET_BASE_PATH ?? process.env.ASTRO_BASE_PATH ?? prdBasePath,
      siteUrl: process.env.PRD_CATALOG_ASSET_SITE_URL ?? process.env.ASTRO_SITE_URL ?? prdSiteUrl,
    };
  }

  return {
    basePath: process.env.UAT_CATALOG_ASSET_BASE_PATH ?? process.env.ASTRO_BASE_PATH ?? defaultBasePath,
    siteUrl: process.env.UAT_CATALOG_ASSET_SITE_URL ?? process.env.ASTRO_SITE_URL ?? defaultSiteUrl,
  };
}

function parseCatalogProductEnvironment(value: string | undefined): CatalogProductEnvironment {
  if (!value?.trim()) {
    return 'UAT';
  }

  const productEnvironment = parseProductEnvironmentCliTarget(value);

  return productEnvironment === 'PRD' ? 'PRD' : 'UAT';
}

function normalizeBasePath(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized === '/') return '';
  return `/${normalized.replace(/^\/+|\/+$/g, '')}`;
}
