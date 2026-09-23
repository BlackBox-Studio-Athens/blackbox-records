import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DISTRO_GROUP_VALUES } from '../../../apps/web/src/lib/distro-data';
import {
  loadDistroInventorySource,
  reconcileDistroContentWithInventorySource,
  type DistroContentRecord,
  type DistroInventorySource,
} from '../../../scripts/distro-inventory-source';

const CHANGE_DIR = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1)),
);
const PROJECT_ROOT = path.resolve(CHANGE_DIR, '../../..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'apps/web/src/content/distro');
const LEDGER_PATH = path.join(CHANGE_DIR, 'research-ledger.tsv');
const COLUMNS = [
  'content_id',
  'group',
  'copy_source_type',
  'copy_source_url',
  'copy_status',
  'media_evidence',
  'cd_photo_status',
  'notes',
] as const;
const COPY_SOURCE_TYPES = new Set(['bandcamp', 'instagram', 'youtube', 'official_site', 'facebook', 'unresolved']);
const COPY_STATUSES = new Set(['pending', 'retained', 'rewritten', 'unresolved']);
const CD_PHOTO_STATUSES = new Set(['not_applicable', 'pending', 'verified', 'unresolved']);
const RIGHTS_STATUSES = new Set(['cc-by-nd-4.0', 'user-blanket-authorization:2026-09-06']);
const BOILERPLATE = 'Source metadata identifies';

type CopySourceType = 'bandcamp' | 'instagram' | 'youtube' | 'official_site' | 'facebook' | 'unresolved';
type CopyStatus = 'pending' | 'retained' | 'rewritten' | 'unresolved';
type CdPhotoStatus = 'not_applicable' | 'pending' | 'verified' | 'unresolved';
type MediaEvidence = { filename: string; source_url: string; rights_status: string };
type MediaHash = { filename: string; hash: string };
type LedgerRow = {
  content_id: string;
  group: string;
  copy_source_type: CopySourceType;
  copy_source_url: string;
  copy_status: CopyStatus;
  media_evidence: string;
  cd_photo_status: CdPhotoStatus;
  notes: string;
};
type DistroContent = DistroContentRecord & {
  image: string;
  image_alt: string;
  gallery?: Array<{ image: string; image_alt: string }>;
  summary: string;
};

async function main() {
  const mode = process.argv[2];

  if (mode === '--self-test') {
    runSelfTest();
    console.log('research-ledger self-test passed');
    return;
  }

  const contents = await loadDistroContent();
  const inventory = await loadDistroInventorySource(PROJECT_ROOT);

  if (mode === '--write') {
    const existingRows = await readLedger(false);
    const rows = mergeLedger(contents, inventory, existingRows);
    await writeFile(LEDGER_PATH, serializeLedger(rows), 'utf8');
    printSnapshot(contents, rows);
    return;
  }

  if (mode) throw new Error(`Unknown argument: ${mode}`);

  const rows = await readLedger(true);
  const errors = [...validateLedger(contents, inventory, rows), ...(await validateMediaFiles(contents))];
  if (errors.length > 0) throw new Error(`Research ledger validation failed:\n- ${errors.join('\n- ')}`);
  printSnapshot(contents, rows);
}

async function loadDistroContent(): Promise<DistroContent[]> {
  const filenames = (await readdir(CONTENT_DIR)).filter((filename) => filename.endsWith('.json')).sort();

  return Promise.all(
    filenames.map(async (filename) => {
      const data = JSON.parse(await readFile(path.join(CONTENT_DIR, filename), 'utf8')) as Omit<
        DistroContent,
        'sourceId'
      >;
      return { ...data, sourceId: filename.slice(0, -'.json'.length) };
    }),
  );
}

async function readLedger(required: boolean): Promise<LedgerRow[]> {
  try {
    return parseLedger(await readFile(LEDGER_PATH, 'utf8'));
  } catch (error) {
    if (!required && isMissingFileError(error)) return [];
    throw error;
  }
}

function mergeLedger(
  contents: DistroContent[],
  inventory: DistroInventorySource,
  existingRows: LedgerRow[],
): LedgerRow[] {
  reconcileDistroContentWithInventorySource(inventory, contents);
  const duplicateIds = findDuplicates(existingRows.map((row) => row.content_id));
  if (duplicateIds.length > 0) throw new Error(`Duplicate ledger content IDs: ${duplicateIds.join(', ')}.`);

  const contentIds = new Set(contents.map(({ sourceId }) => sourceId));
  const staleIds = existingRows.map(({ content_id }) => content_id).filter((id) => !contentIds.has(id));
  if (staleIds.length > 0) throw new Error(`Refusing to discard stale ledger rows: ${staleIds.join(', ')}.`);

  const existingById = new Map(existingRows.map((row) => [row.content_id, row]));
  return sortContents(contents).map((content) => {
    const existing = existingById.get(content.sourceId);
    const mediaEvidence = mergeMediaEvidence(content, existing?.media_evidence);
    return {
      content_id: content.sourceId,
      group: content.group,
      copy_source_type: existing?.copy_source_type ?? 'unresolved',
      copy_source_url: existing?.copy_source_url ?? '',
      copy_status: existing?.copy_status ?? 'pending',
      media_evidence: JSON.stringify(mediaEvidence),
      cd_photo_status: existing?.cd_photo_status ?? (content.group === 'CDs' ? 'pending' : 'not_applicable'),
      notes: existing?.notes ?? '',
    };
  });
}

function validateLedger(contents: DistroContent[], inventory: DistroInventorySource, rows: LedgerRow[]): string[] {
  const errors: string[] = [];
  try {
    reconcileDistroContentWithInventorySource(inventory, contents);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  const duplicateIds = findDuplicates(rows.map((row) => row.content_id));
  if (duplicateIds.length > 0) errors.push(`Duplicate ledger content IDs: ${duplicateIds.join(', ')}.`);

  const contentById = new Map(contents.map((content) => [content.sourceId, content]));
  const rowIds = new Set(rows.map((row) => row.content_id));
  const missingIds = contents.map(({ sourceId }) => sourceId).filter((id) => !rowIds.has(id));
  const staleIds = rows.map(({ content_id }) => content_id).filter((id) => !contentById.has(id));
  if (missingIds.length > 0) errors.push(`Missing ledger rows: ${missingIds.join(', ')}.`);
  if (staleIds.length > 0) errors.push(`Stale ledger rows: ${staleIds.join(', ')}.`);

  for (const row of rows) {
    const content = contentById.get(row.content_id);
    if (!content) continue;
    validateRow(content, row, errors);
  }

  return errors;
}

function validateRow(content: DistroContent, row: LedgerRow, errors: string[]): void {
  const prefix = row.content_id;
  if (row.group !== content.group) errors.push(`${prefix}: ledger group must match content group ${content.group}.`);
  if (!COPY_SOURCE_TYPES.has(row.copy_source_type)) errors.push(`${prefix}: invalid copy_source_type.`);
  if (!COPY_STATUSES.has(row.copy_status)) errors.push(`${prefix}: invalid copy_status.`);
  if (!CD_PHOTO_STATUSES.has(row.cd_photo_status)) errors.push(`${prefix}: invalid cd_photo_status.`);

  if (!['retained', 'rewritten'].includes(row.copy_status)) {
    errors.push(`${prefix}: copy review is unresolved.`);
  }
  if (!['bandcamp', 'instagram', 'youtube', 'official_site', 'facebook'].includes(row.copy_source_type)) {
    errors.push(`${prefix}: completed copy requires an official artist or label source.`);
  }
  if (!isHttpsUrl(row.copy_source_url)) errors.push(`${prefix}: copy_source_url must be HTTPS.`);
  if (content.summary.includes(BOILERPLATE)) errors.push(`${prefix}: summary retains generic boilerplate.`);

  let evidence: MediaEvidence[] = [];
  try {
    evidence = parseMediaEvidence(row.media_evidence);
  } catch (error) {
    errors.push(`${prefix}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const filenames = getMediaFilenames(content);
  const evidenceFilenames = evidence.map(({ filename }) => filename);
  const duplicateEvidence = findDuplicates(evidenceFilenames);
  if (duplicateEvidence.length > 0)
    errors.push(`${prefix}: duplicate media evidence: ${duplicateEvidence.join(', ')}.`);
  const missingEvidence = filenames.filter((filename) => !evidenceFilenames.includes(filename));
  const staleEvidence = evidenceFilenames.filter((filename) => !filenames.includes(filename));
  if (missingEvidence.length > 0) errors.push(`${prefix}: missing media evidence: ${missingEvidence.join(', ')}.`);
  if (staleEvidence.length > 0) errors.push(`${prefix}: stale media evidence: ${staleEvidence.join(', ')}.`);

  for (const item of evidence) {
    if (!isHttpsUrl(item.source_url)) errors.push(`${prefix}: ${item.filename} source_url must be HTTPS.`);
    if (!RIGHTS_STATUSES.has(item.rights_status))
      errors.push(`${prefix}: ${item.filename} has incompatible rights status.`);
  }

  if (content.group === 'CDs') {
    if (row.cd_photo_status !== 'verified') errors.push(`${prefix}: CD physical-product photo is unresolved.`);
    if (/mockup/i.test(`${content.image} ${content.image_alt}`))
      errors.push(`${prefix}: CD primary image remains a mockup.`);
    if (row.cd_photo_status === 'verified') {
      for (const word of ['artist', 'title', 'format', 'edition', 'packaging']) {
        if (!new RegExp(`\\b${word}\\b`, 'i').test(row.notes))
          errors.push(`${prefix}: CD note must confirm ${word} match.`);
      }
    }
  } else if (row.cd_photo_status !== 'not_applicable') {
    errors.push(`${prefix}: non-CD cd_photo_status must be not_applicable.`);
  }
}

function mergeMediaEvidence(content: DistroContent, rawEvidence: string | undefined): MediaEvidence[] {
  let existing: MediaEvidence[] = [];
  if (rawEvidence) {
    try {
      existing = parseMediaEvidence(rawEvidence);
    } catch {
      existing = [];
    }
  }
  const existingByFilename = new Map(existing.map((item) => [item.filename, item]));
  return getMediaFilenames(content).map(
    (filename) => existingByFilename.get(filename) ?? { filename, source_url: '', rights_status: '' },
  );
}

function parseMediaEvidence(value: string): MediaEvidence[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error('media_evidence must be a JSON array.');
  for (const item of parsed) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.filename !== 'string' ||
      typeof item.source_url !== 'string' ||
      typeof item.rights_status !== 'string'
    ) {
      throw new Error('media_evidence entries require filename, source_url, and rights_status strings.');
    }
  }
  return parsed as MediaEvidence[];
}

function getMediaFilenames(content: DistroContent): string[] {
  return [content.image, ...(content.gallery ?? []).map(({ image }) => image)];
}

function parseLedger(input: string): LedgerRow[] {
  const lines = input.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  assert.deepEqual(lines[0]?.split('\t'), COLUMNS, 'Research ledger columns changed.');
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line, index) => {
      const values = line.split('\t');
      if (values.length !== COLUMNS.length)
        throw new Error(`Ledger row ${index + 2} must contain ${COLUMNS.length} columns.`);
      return Object.fromEntries(COLUMNS.map((column, valueIndex) => [column, values[valueIndex] ?? ''])) as LedgerRow;
    });
}

function serializeLedger(rows: LedgerRow[]): string {
  const body = rows.map((row) => COLUMNS.map((column) => cleanTsvCell(row[column])).join('\t'));
  return `${COLUMNS.join('\t')}\n${body.join('\n')}\n`;
}

function cleanTsvCell(value: string): string {
  if (/[\t\r\n]/.test(value)) throw new Error('Ledger cells cannot contain tabs or newlines.');
  return value;
}

function sortContents(contents: DistroContent[]): DistroContent[] {
  const groupOrder = new Map(DISTRO_GROUP_VALUES.map((group, index) => [group, index]));
  return [...contents].sort(
    (left, right) =>
      Number(right.group === 'CDs') - Number(left.group === 'CDs') ||
      (groupOrder.get(left.group as (typeof DISTRO_GROUP_VALUES)[number]) ?? Number.MAX_SAFE_INTEGER) -
        (groupOrder.get(right.group as (typeof DISTRO_GROUP_VALUES)[number]) ?? Number.MAX_SAFE_INTEGER) ||
      left.sourceId.localeCompare(right.sourceId, 'en'),
  );
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

async function validateMediaFiles(contents: DistroContent[]): Promise<string[]> {
  const filenames = [...new Set(contents.flatMap(getMediaFilenames))].sort();
  const hashes: MediaHash[] = [];
  const errors: string[] = [];

  for (const filename of filenames) {
    try {
      hashes.push({
        filename,
        hash: createHash('sha256')
          .update(await readFile(path.join(CONTENT_DIR, filename)))
          .digest('hex'),
      });
    } catch (error) {
      errors.push(
        `${filename}: cannot read referenced media file (${error instanceof Error ? error.message : String(error)}).`,
      );
    }
  }

  return [...errors, ...findDuplicateMediaHashes(hashes)];
}

function findDuplicateMediaHashes(records: MediaHash[]): string[] {
  const filenamesByHash = new Map<string, string[]>();
  for (const { filename, hash } of records) filenamesByHash.set(hash, [...(filenamesByHash.get(hash) ?? []), filename]);
  return [...filenamesByHash.values()]
    .filter((filenames) => filenames.length > 1)
    .map((filenames) => `Duplicate image bytes: ${filenames.sort().join(', ')}.`)
    .sort();
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function printSnapshot(contents: DistroContent[], rows: LedgerRow[]): void {
  const counts = Object.fromEntries(
    DISTRO_GROUP_VALUES.map((group) => [group, contents.filter((item) => item.group === group).length]),
  );
  console.log(JSON.stringify({ contentEntries: contents.length, ledgerRows: rows.length, groups: counts }, null, 2));
}

function runSelfTest(): void {
  const content = createSelfTestContent();
  const row = createSelfTestRow();
  const inventory = createSelfTestInventory();
  assert.deepEqual(validateLedger([content], inventory, [row]), []);
  assert.deepEqual(parseLedger(serializeLedger([{ ...row, notes: '' }])), [{ ...row, notes: '' }]);

  assert.match(validateLedger([content], inventory, [])[0] ?? '', /Missing ledger rows/);
  assert.ok(validateLedger([content], inventory, [row, row]).some((error) => error.includes('Duplicate ledger')));
  assert.ok(
    validateLedger(
      [content],
      {
        ...inventory,
        rows: [
          ...inventory.rows,
          { ...inventory.rows[0]!, id: 'stale-row', sourceArtist: 'Stale Artist', sourceTitle: 'Stale Album' },
        ],
      },
      [row],
    ).some((error) => error.includes('unmatched rows')),
  );
  assert.ok(
    validateLedger([content], inventory, [{ ...row, copy_status: 'unresolved' }]).some((error) =>
      error.includes('copy review'),
    ),
  );
  assert.ok(
    validateLedger([content], inventory, [{ ...row, cd_photo_status: 'unresolved' }]).some((error) =>
      error.includes('CD physical'),
    ),
  );
  assert.ok(
    validateLedger([content], inventory, [{ ...row, media_evidence: '[]' }]).some((error) =>
      error.includes('missing media evidence'),
    ),
  );
  assert.ok(
    validateLedger([content], inventory, [
      {
        ...row,
        media_evidence: JSON.stringify([{ ...parseMediaEvidence(row.media_evidence)[0]!, rights_status: 'unknown' }]),
      },
    ]).some((error) => error.includes('incompatible rights')),
  );
  assert.ok(
    validateLedger([{ ...content, summary: `${BOILERPLATE} a release.` }], inventory, [row]).some((error) =>
      error.includes('boilerplate'),
    ),
  );
  assert.deepEqual(
    findDuplicateMediaHashes([
      { filename: 'fixture-a.jpg', hash: 'same' },
      { filename: 'fixture-b.jpg', hash: 'same' },
      { filename: 'fixture-c.jpg', hash: 'different' },
    ]),
    ['Duplicate image bytes: fixture-a.jpg, fixture-b.jpg.'],
  );
}

function createSelfTestContent(): DistroContent {
  return {
    artist_or_label: 'Fixture Artist',
    gallery: [{ image: 'fixture-cd-back.jpg', image_alt: 'Fixture CD back' }],
    group: 'CDs',
    image: 'fixture-cd-front.jpg',
    image_alt: 'Fixture CD in a jewel case',
    sourceId: 'fixture-cd',
    summary: 'A concise supported summary.',
    title: 'Fixture Album',
  };
}

function createSelfTestRow(): LedgerRow {
  return {
    cd_photo_status: 'verified',
    content_id: 'fixture-cd',
    copy_source_type: 'bandcamp',
    copy_source_url: 'https://fixture-artist.bandcamp.com/album/fixture-album',
    copy_status: 'rewritten',
    group: 'CDs',
    media_evidence: JSON.stringify(
      ['fixture-cd-front.jpg', 'fixture-cd-back.jpg'].map((filename) => ({
        filename,
        rights_status: 'user-blanket-authorization:2026-09-06',
        source_url: 'https://fixture-artist.bandcamp.com/album/fixture-album',
      })),
    ),
    notes: 'Artist match; title match; format match; edition match; packaging match.',
  };
}

function createSelfTestInventory(): DistroInventorySource {
  return {
    rejectedDuplicateRows: [],
    rows: [
      {
        currentSiteExtra: false,
        id: 'fixture-cd',
        itemType: 'CD',
        pricePolicy: { amountMinor: 1000, currencyCode: 'EUR', kind: 'fixed' },
        releaseDate: null,
        resolvedPricePolicy: 'fixed 1000 EUR',
        sourceAliases: [],
        sourceArtist: 'Fixture Artist',
        sourcePrice: '10',
        sourceTitle: 'Fixture Album',
      },
    ],
  };
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
