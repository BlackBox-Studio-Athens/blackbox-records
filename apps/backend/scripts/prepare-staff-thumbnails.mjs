import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { getPlatformProxy } from 'wrangler';
import {
  createStaffThumbnailCandidate,
  isStaffThumbnailOriginalKey,
  staffThumbnailMaxBytes,
  readStaffThumbnailMetadata,
  readStaffThumbnailPng,
  staffThumbnailPutOptions,
  staffThumbnailStorageKey,
  staffThumbnailStoragePrefix,
} from '../src/cms/staff-thumbnails.ts';

export const maxOriginalBytes = 20 * 1024 * 1024;
export const maxInvocationBytes = 64 * 1024 * 1024;
const defaultLimit = 25;
const backend = fileURLToPath(new URL('../', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const resources = JSON.parse(await readFile(new URL('../cms-resources.json', import.meta.url), 'utf8'));

export function parsePreparationArgs(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      env: { type: 'string' },
      limit: { type: 'string', default: String(defaultLimit) },
      cursor: { type: 'string' },
      'start-after': { type: 'string' },
      'source-key': { type: 'string' },
      'audit-media': { type: 'boolean', default: false },
      'hash-originals': { type: 'boolean', default: false },
      'media-limit': { type: 'string', default: String(defaultLimit) },
      'media-after': { type: 'string' },
      'max-bytes': { type: 'string', default: String(maxInvocationBytes) },
      apply: { type: 'boolean', default: false },
      'hosted-budget-reviewed': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.help) return { help: true };
  const environment = values.env;
  assert.ok(['local', 'uat', 'prd'].includes(environment ?? ''), 'Select --env local, --env uat, or --env prd.');
  const limit = parseBoundedInteger(values.limit, 'limit', 1, defaultLimit);
  const mediaLimit = parseBoundedInteger(values['media-limit'], 'media-limit', 1, defaultLimit);
  const maxBytes = parseBoundedInteger(values['max-bytes'], 'max-bytes', 1, maxInvocationBytes);
  const sourceKey = values['source-key'];
  const startAfter = values['start-after'];
  const mediaAfter = values['media-after'];
  const auditMedia = values['audit-media'];
  const hashOriginals = values['hash-originals'];
  assert.ok(
    sourceKey === undefined || isStaffThumbnailOriginalKey(sourceKey),
    '--source-key must be one native image object key.',
  );
  assert.ok(startAfter === undefined || startAfter.length > 0, '--start-after must be a non-empty R2 object key.');
  assert.ok(!(values.cursor && startAfter), '--cursor and --start-after cannot be combined.');
  assert.ok(
    sourceKey === undefined || (!values.cursor && !startAfter),
    '--source-key cannot be combined with a page position.',
  );
  assert.ok(
    !auditMedia || (!sourceKey && !values.cursor && !startAfter && !values.apply),
    '--audit-media is read-only and cannot be combined with backfill options.',
  );
  assert.ok(!hashOriginals || auditMedia, '--hash-originals requires --audit-media.');
  assert.ok(!mediaAfter || auditMedia, '--media-after requires --audit-media.');
  assert.ok(
    environment === 'local' || values['hosted-budget-reviewed'],
    'Review account-wide Free-tier budget before hosted preparation.',
  );
  return {
    environment,
    limit,
    cursor: values.cursor,
    startAfter,
    sourceKey,
    auditMedia,
    hashOriginals,
    mediaLimit,
    mediaAfter,
    maxBytes,
    apply: values.apply,
    hostedBudgetReviewed: values['hosted-budget-reviewed'],
  };
}

function parseBoundedInteger(value, name, min, max) {
  assert.match(value ?? '', /^\d+$/, `--${name} must be an integer.`);
  const parsed = Number(value);
  assert.ok(
    Number.isSafeInteger(parsed) && parsed >= min && parsed <= max,
    `--${name} must be between ${min} and ${max}.`,
  );
  return parsed;
}

async function createThumbnail(bytes) {
  const result = await sharp(bytes, { limitInputPixels: 100_000_000 })
    .rotate()
    .resize({ width: 96, height: 96, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer({ resolveWithObject: true });
  const output = new Uint8Array(result.data);
  const dimensions = readStaffThumbnailPng(output);
  if (!dimensions || output.byteLength > 40 * 1024) throw new Error('INVALID_DERIVATIVE');
  return { bytes: output, ...dimensions };
}

function isValidExistingDerivative(object, bytes) {
  const metadata = readStaffThumbnailMetadata(object?.customMetadata);
  const dimensions = bytes && readStaffThumbnailPng(bytes);
  return Boolean(
    object &&
    bytes &&
    bytes.byteLength === object.size &&
    object.size <= 40 * 1024 &&
    object.httpMetadata?.contentType === 'image/png' &&
    metadata &&
    dimensions &&
    dimensions.width === metadata.width &&
    dimensions.height === metadata.height,
  );
}

function skipReason(key) {
  if (key.startsWith(staffThumbnailStoragePrefix)) return 'thumbnail';
  if (/^(?:snapshots|published|media\/published)(?:\/|$)/.test(key)) return 'published';
  if (!/\.(?:png|jpe?g|webp|avif|gif|bmp|tiff?)$/i.test(key)) return 'non-image';
  if (!isStaffThumbnailOriginalKey(key)) return 'unsupported-key';
  return null;
}

export async function prepareStaffThumbnailPage({
  bucket,
  environment,
  limit = defaultLimit,
  cursor,
  startAfter,
  sourceKey,
  maxBytes = maxInvocationBytes,
  apply = false,
}) {
  const report = {
    environment,
    apply,
    dryRun: !apply,
    cursor: cursor ?? null,
    nextCursor: null,
    startAfter: startAfter ?? null,
    nextStartAfter: startAfter ?? null,
    stopped: null,
    counts: {
      listed: 0,
      skipped: 0,
      thumbnailObjects: 0,
      publishedObjects: 0,
      nonImages: 0,
      unsupportedKeys: 0,
      missingOriginals: 0,
      missingThumbnails: 0,
      invalidThumbnails: 0,
      invalidOriginals: 0,
      validExisting: 0,
      prepared: 0,
      written: 0,
      errors: 0,
    },
    keys: { page: [], missingOriginals: [], unsupported: [], missingThumbnails: [], invalidThumbnails: [] },
    bytes: { original: 0, output: 0 },
    r2: { list: 0, head: 0, get: 0, put: 0 },
  };
  const exactSource = sourceKey !== undefined;
  const page = await bucket.list({
    ...(cursor ? { cursor } : {}),
    ...(startAfter ? { startAfter } : {}),
    limit: exactSource ? 1 : limit,
    ...(exactSource ? { prefix: sourceKey } : {}),
    include: ['httpMetadata', 'customMetadata'],
  });
  report.r2.list = 1;
  let interrupted = false;
  const objects = exactSource ? page.objects.filter((object) => object.key === sourceKey) : page.objects;
  report.keys.page = objects.map((object) => object.key);
  if (page.truncated && !objects.length) {
    report.counts.errors++;
    report.stopped = 'pagination-stalled';
    return report;
  }
  if (startAfter && objects.some((object) => object.key <= startAfter)) {
    report.counts.errors++;
    report.stopped = 'pagination-stalled';
    return report;
  }
  if (exactSource && !objects.length) {
    report.counts.errors++;
    report.counts.missingOriginals++;
    report.keys.missingOriginals.push(sourceKey);
    report.stopped = 'source-not-found';
    return report;
  }
  for (const listed of objects) {
    report.counts.listed++;
    const reason = skipReason(listed.key);
    const derivativeKey = staffThumbnailStorageKey(listed.key);
    if (reason || !derivativeKey) {
      report.counts.skipped++;
      if (reason === 'thumbnail') report.counts.thumbnailObjects++;
      else if (reason === 'published') report.counts.publishedObjects++;
      else if (reason === 'non-image') report.counts.nonImages++;
      else {
        report.counts.unsupportedKeys++;
        report.keys.unsupported.push(listed.key);
      }
      continue;
    }
    report.r2.head++;
    const existing = await bucket.head(derivativeKey);
    if (existing) {
      if (
        existing.size <= 40 * 1024 &&
        existing.httpMetadata?.contentType === 'image/png' &&
        readStaffThumbnailMetadata(existing.customMetadata)
      ) {
        report.r2.get++;
        const derivative = await bucket.get(derivativeKey);
        const derivativeBytes = derivative ? new Uint8Array(await derivative.arrayBuffer()) : null;
        if (isValidExistingDerivative(existing, derivativeBytes)) {
          report.counts.validExisting++;
          continue;
        }
      }
      report.counts.invalidThumbnails++;
      report.keys.invalidThumbnails.push(listed.key);
    } else {
      report.counts.missingThumbnails++;
      report.keys.missingThumbnails.push(listed.key);
    }
    if (!Number.isSafeInteger(listed.size) || listed.size < 1 || listed.size > maxOriginalBytes) {
      report.counts.errors++;
      report.counts.invalidOriginals++;
      report.stopped = 'original-too-large';
      interrupted = true;
      break;
    }
    if (report.bytes.original + listed.size > maxBytes) {
      report.stopped = 'byte-budget';
      interrupted = true;
      break;
    }
    report.r2.get++;
    const original = await bucket.get(listed.key);
    if (!original || original.etag !== listed.etag) {
      report.counts.errors++;
      report.stopped = 'etag-mismatch';
      interrupted = true;
      break;
    }
    const originalBytes = new Uint8Array(await original.arrayBuffer());
    if (originalBytes.byteLength !== listed.size || originalBytes.byteLength > maxOriginalBytes) {
      report.counts.errors++;
      report.stopped = 'original-size-mismatch';
      interrupted = true;
      break;
    }
    let derivative;
    try {
      derivative = await createThumbnail(originalBytes);
      if (!createStaffThumbnailCandidate(listed.key, derivative.bytes)) throw new Error('INVALID_DERIVATIVE');
    } catch {
      report.counts.errors++;
      report.stopped = 'derivative-failed';
      interrupted = true;
      break;
    }
    report.bytes.original += originalBytes.byteLength;
    report.bytes.output += derivative.bytes.byteLength;
    report.counts.prepared++;
    if (apply) {
      report.r2.put++;
      try {
        await bucket.put(derivativeKey, derivative.bytes, staffThumbnailPutOptions(derivative));
        report.counts.written++;
      } catch {
        report.counts.errors++;
        report.stopped = 'derivative-write-failed';
        interrupted = true;
        break;
      }
    }
  }
  report.nextCursor = interrupted
    ? (cursor ?? null)
    : exactSource || startAfter
      ? null
      : page.truncated
        ? (page.cursor ?? null)
        : null;
  report.nextStartAfter = interrupted
    ? (startAfter ?? null)
    : !exactSource && page.truncated
      ? (objects.at(-1)?.key ?? startAfter ?? null)
      : null;
  return report;
}

export async function auditStaffMediaReferences({
  database,
  bucket,
  environment,
  limit = defaultLimit,
  after,
  hashOriginals = false,
  maxBytes = maxInvocationBytes,
}) {
  const report = {
    environment,
    after: after ?? null,
    nextAfter: null,
    truncated: false,
    stopped: null,
    counts: {
      listed: 0,
      unsupportedKeys: 0,
      missingOriginals: 0,
      missingThumbnails: 0,
      invalidThumbnails: 0,
      validExisting: 0,
      errors: 0,
    },
    media: [],
    keys: { missingOriginals: [], unsupported: [], missingThumbnails: [], invalidThumbnails: [] },
    bytes: { original: 0 },
    r2: { head: 0, get: 0 },
    d1: { read: 0 },
  };
  const result = await database
    .prepare(
      "SELECT id, filename, mime_type AS mimeType, storage_key AS storageKey FROM media WHERE mime_type LIKE 'image/%' AND id > ? ORDER BY id LIMIT ?",
    )
    .bind(after ?? '', limit + 1)
    .all();
  report.d1.read = 1;
  const rows = result.results ?? [];
  const page = rows.slice(0, limit);
  report.truncated = rows.length > limit;
  report.media = page.map((item) => ({
    id: item.id,
    filename: item.filename,
    storageKey: item.storageKey,
    status: null,
  }));
  for (const [index, item] of page.entries()) {
    const record = report.media[index];
    report.counts.listed++;
    const key = item.storageKey;
    const derivativeKey = typeof key === 'string' ? staffThumbnailStorageKey(key) : null;
    if (!derivativeKey) {
      report.counts.unsupportedKeys++;
      record.status = 'unsupported-key';
      report.keys.unsupported.push(key);
      continue;
    }
    try {
      report.r2.head++;
      const original = await bucket.head(key);
      if (!original) {
        report.counts.missingOriginals++;
        record.status = 'missing-original';
        report.keys.missingOriginals.push(key);
        continue;
      }
      const checksum = original.checksums?.toJSON?.();
      record.original = {
        size: original.size,
        etag: original.etag ?? null,
        sha256: checksum?.sha256 ?? null,
      };
      if (hashOriginals && (!Number.isSafeInteger(original.size) || original.size < 1)) {
        report.counts.errors++;
        record.hashStatus = 'invalid-size';
        report.stopped = 'original-size-mismatch';
        break;
      }
      if (hashOriginals && original.size > maxBytes) {
        record.hashStatus = 'larger-than-byte-budget';
      } else if (hashOriginals) {
        if (report.bytes.original + original.size > maxBytes) {
          report.stopped = 'hash-byte-budget';
          break;
        }
        report.r2.get++;
        const originalBody = await bucket.get(key);
        if (!originalBody || originalBody.etag !== original.etag) {
          report.counts.errors++;
          record.hashStatus = 'etag-mismatch';
          report.stopped = 'etag-mismatch';
          break;
        }
        const originalBytes = new Uint8Array(await originalBody.arrayBuffer());
        if (originalBytes.byteLength !== original.size) {
          report.counts.errors++;
          record.hashStatus = 'size-mismatch';
          report.stopped = 'original-size-mismatch';
          break;
        }
        record.original.sha256 = createHash('sha256').update(originalBytes).digest('hex');
        report.bytes.original += originalBytes.byteLength;
      }
      report.r2.head++;
      const existing = await bucket.head(derivativeKey);
      if (!existing) {
        report.counts.missingThumbnails++;
        record.status = 'missing-thumbnail';
        report.keys.missingThumbnails.push(key);
        continue;
      }
      const metadata = readStaffThumbnailMetadata(existing.customMetadata);
      if (existing.size > staffThumbnailMaxBytes || existing.httpMetadata?.contentType !== 'image/png' || !metadata) {
        report.counts.invalidThumbnails++;
        record.status = 'invalid-thumbnail';
        report.keys.invalidThumbnails.push(key);
        continue;
      }
      report.r2.get++;
      const derivative = await bucket.get(derivativeKey);
      const bytes = derivative ? new Uint8Array(await derivative.arrayBuffer()) : null;
      if (isValidExistingDerivative(existing, bytes)) {
        report.counts.validExisting++;
        record.status = 'valid-thumbnail';
      } else {
        report.counts.invalidThumbnails++;
        record.status = 'invalid-thumbnail';
        report.keys.invalidThumbnails.push(key);
      }
    } catch {
      report.counts.errors++;
      record.status = 'read-error';
      report.stopped = 'media-reference-read-failed';
      break;
    }
  }
  report.nextAfter = report.stopped ? (after ?? null) : report.truncated ? (page.at(-1)?.id ?? after ?? null) : null;
  return report;
}

function usage() {
  return [
    'Usage: prepare-staff-thumbnails.mjs --env local|uat|prd [--limit 1..25] [--start-after key | --cursor value | --source-key key] [--max-bytes bytes] [--apply]',
    '       prepare-staff-thumbnails.mjs --env local|uat|prd --audit-media [--media-limit 1..25] [--media-after id] [--hash-originals]',
    'Hosted UAT/PRD runs also require --hosted-budget-reviewed.',
  ].join('\n');
}

export function createPreparationConfig({ environment, bucketName, remote, database }) {
  return {
    name: `blackbox-staff-thumbnails-${environment}`,
    compatibility_date: '2026-08-31',
    r2_buckets: [{ binding: 'MEDIA', bucket_name: bucketName, remote }],
    ...(database
      ? {
          d1_databases: [
            {
              binding: 'CMS_DB',
              database_name: database.name,
              database_id: database.id,
              remote,
            },
          ],
        }
      : {}),
  };
}

async function main() {
  const args = parsePreparationArgs();
  if (args.help) {
    console.log(usage());
    return;
  }
  const source = resources[args.environment];
  assert.ok(source?.bucket_name, `CMS resources are missing for ${args.environment}.`);
  const configPath = join(backend, `.staff-thumbnails-${randomUUID()}.json`);
  const remote = args.environment !== 'local';
  await writeFile(
    configPath,
    JSON.stringify(
      createPreparationConfig({
        environment: args.environment,
        bucketName: source.bucket_name,
        remote,
        ...(args.auditMedia ? { database: { name: source.database_name, id: source.database_id } } : {}),
      }),
    ),
  );
  let proxy;
  try {
    proxy = await getPlatformProxy({
      configPath,
      remoteBindings: remote,
      persist: { path: join(backend, '.wrangler/state/v3') },
      envFiles: [],
    });
    const report = args.auditMedia
      ? await auditStaffMediaReferences({
          database: proxy.env.CMS_DB,
          bucket: proxy.env.MEDIA,
          environment: args.environment,
          limit: args.mediaLimit,
          after: args.mediaAfter,
          hashOriginals: args.hashOriginals,
          maxBytes: args.maxBytes,
        })
      : await prepareStaffThumbnailPage({
          bucket: proxy.env.MEDIA,
          environment: args.environment,
          limit: args.limit,
          cursor: args.cursor,
          startAfter: args.startAfter,
          sourceKey: args.sourceKey,
          maxBytes: args.maxBytes,
          apply: args.apply,
        });
    const reportDirectory = join(repoRoot, '.codex-artifacts/complete-image-delivery/staff-thumbnails');
    await mkdir(reportDirectory, { recursive: true });
    const reportPath = join(reportDirectory, `prepare-${args.environment}-${Date.now()}.json`);
    await writeFile(reportPath, JSON.stringify({ ...report, reportPath }, null, 2));
    console.log(JSON.stringify({ ...report, reportPath }));
  } finally {
    await proxy?.dispose();
    await rm(configPath, { force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
