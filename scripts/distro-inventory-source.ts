import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type DistroInventoryItemType = 'CD' | 'Tape' | 'Vinyl 10-inch' | 'Vinyl 12-inch' | 'Vinyl 7-inch';

export type DistroInventoryPricePolicy =
  | {
      amountMinor: number;
      currencyCode: string;
      kind: 'fixed';
    }
  | {
      currencyCode: string;
      kind: 'pay_what_you_want';
      maximumAmountMinor: number;
      minimumAmountMinor: number;
      presetAmountMinor: number;
    };

export type DistroInventoryIdentity = {
  artist: string;
  itemType: DistroInventoryItemType;
  title: string;
};

export type DistroInventorySourceRow = {
  currentSiteExtra: boolean;
  id: string;
  itemType: DistroInventoryItemType;
  pricePolicy: DistroInventoryPricePolicy;
  releaseDate: string | null;
  resolvedPricePolicy: string;
  sourceAliases: DistroInventoryIdentity[];
  sourceArtist: string;
  sourcePrice: string | null;
  sourceTitle: string;
};

export type RejectedDistroInventorySourceRow = {
  duplicateOf: string;
  id: string;
  itemType: DistroInventoryItemType;
  releaseDate: string;
  resolution: string;
  sourceArtist: string;
  sourcePrice: string | null;
  sourceTitle: string;
};

export type DistroInventorySource = {
  rejectedDuplicateRows: RejectedDistroInventorySourceRow[];
  rows: DistroInventorySourceRow[];
};

type RawDistroInventorySource = {
  blankPriceDefaults: Record<DistroInventoryItemType, number>;
  currencyCode: string;
  payWhatYouWantPrice: {
    maximumAmountMinor: number;
    minimumAmountMinor: number;
    presetAmountMinor: number;
  };
  rejectedDuplicateRows: RejectedDistroInventorySourceRow[];
  rows: Array<Omit<DistroInventorySourceRow, 'pricePolicy'>>;
};

type DistroContentIdentity = {
  artist_or_label: string;
  group: string;
  title: string;
};

let cachedDistroInventorySource: Promise<DistroInventorySource> | null = null;

export async function loadDistroInventorySource(projectRoot = resolveProjectRoot()): Promise<DistroInventorySource> {
  cachedDistroInventorySource ??= readDistroInventorySource(projectRoot);
  return cachedDistroInventorySource;
}

async function readDistroInventorySource(projectRoot: string): Promise<DistroInventorySource> {
  const manifestRoot = existsSync(path.join(projectRoot, 'scripts', 'data', 'distro-inventory-source.json'))
    ? projectRoot
    : resolveProjectRoot();
  const raw = JSON.parse(
    await readFile(path.join(manifestRoot, 'scripts', 'data', 'distro-inventory-source.json'), 'utf8'),
  ) as RawDistroInventorySource;
  const rows = raw.rows.map((row) => {
    const pricePolicy = createPricePolicy(row, raw);
    assertResolvedPricePolicy(row, pricePolicy);
    return { ...row, pricePolicy };
  });

  return {
    rejectedDuplicateRows: raw.rejectedDuplicateRows,
    rows,
  };
}

export function findDistroInventoryRowForContent(
  source: DistroInventorySource,
  content: DistroContentIdentity,
): DistroInventorySourceRow | null {
  const contentType = normalizeDistroContentItemType(content.group);
  const contentKey = createIdentityKey({
    artist: content.artist_or_label,
    itemType: contentType,
    title: content.title,
  });
  const typedMatch = source.rows.find((row) => getRowIdentityKeys(row).includes(contentKey));

  if (typedMatch) return typedMatch;

  const looseKey = createLooseIdentityKey(content.artist_or_label, content.title);
  const looseMatches = source.rows.filter((row) =>
    getRowLooseIdentityKeys(row).some((candidateKey) => candidateKey === looseKey),
  );

  return looseMatches.length === 1 ? looseMatches[0]! : null;
}

export function assertDistroContentCoveredByInventorySource(
  source: DistroInventorySource,
  content: DistroContentIdentity & { sourceId: string },
): DistroInventorySourceRow {
  const row = findDistroInventoryRowForContent(source, content);

  if (!row) {
    throw new Error(
      `Distro Store Item ${content.sourceId} is absent from the Distro Inventory Source and approved Current-Site Extras.`,
    );
  }

  return row;
}

export function normalizeDistroInventoryIdentity(identity: DistroInventoryIdentity): DistroInventoryIdentity {
  return {
    artist: normalizeIdentityText(identity.artist),
    itemType: identity.itemType,
    title: normalizeIdentityText(identity.title),
  };
}

export function normalizeDistroContentItemType(group: string): DistroInventoryItemType {
  if (group === 'CDs') return 'CD';
  if (group === 'Tapes') return 'Tape';
  return group as DistroInventoryItemType;
}

function createPricePolicy(
  row: Omit<DistroInventorySourceRow, 'pricePolicy'>,
  source: RawDistroInventorySource,
): DistroInventoryPricePolicy {
  if (row.sourcePrice === 'ΕΣ') {
    return {
      currencyCode: source.currencyCode,
      kind: 'pay_what_you_want',
      ...source.payWhatYouWantPrice,
    };
  }

  const amountMajor = row.sourcePrice && /^\d+$/.test(row.sourcePrice) ? Number(row.sourcePrice) : null;
  const amountMinor = amountMajor === null ? source.blankPriceDefaults[row.itemType] : amountMajor * 100;

  return {
    amountMinor,
    currencyCode: source.currencyCode,
    kind: 'fixed',
  };
}

function assertResolvedPricePolicy(
  row: Omit<DistroInventorySourceRow, 'pricePolicy'>,
  pricePolicy: DistroInventoryPricePolicy,
): void {
  const expected = pricePolicy.kind === 'fixed' ? `fixed ${pricePolicy.amountMinor} EUR` : 'pay-what-you-want';

  if (row.resolvedPricePolicy !== expected) {
    throw new Error(`Distro Inventory Source price policy mismatch for ${row.id}: expected ${expected}.`);
  }
}

function getRowIdentityKeys(row: DistroInventorySourceRow): string[] {
  return [
    createIdentityKey({
      artist: row.sourceArtist,
      itemType: row.itemType,
      title: row.sourceTitle,
    }),
    ...row.sourceAliases.map(createIdentityKey),
  ];
}

function getRowLooseIdentityKeys(row: DistroInventorySourceRow): string[] {
  return [
    createLooseIdentityKey(row.sourceArtist, row.sourceTitle),
    ...row.sourceAliases.map((alias) => createLooseIdentityKey(alias.artist, alias.title)),
  ];
}

function createIdentityKey(identity: DistroInventoryIdentity): string {
  const normalized = normalizeDistroInventoryIdentity(identity);
  return `${normalized.artist}|${normalized.title}|${normalized.itemType}`;
}

function createLooseIdentityKey(artist: string, title: string): string {
  return `${normalizeIdentityText(artist)}|${normalizeIdentityText(title)}`;
}

function normalizeIdentityText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\bthe smoking community\b/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function resolveProjectRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..', '..')];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'scripts', 'data', 'distro-inventory-source.json'))) {
      return candidate;
    }
  }

  throw new Error('Unable to resolve project root for Distro Inventory Source.');
}
