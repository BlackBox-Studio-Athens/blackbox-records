import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { getPlatformProxy } from 'wrangler';
import {
  createStaffThumbnailCandidate,
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
      'source-key': { type: 'string' },
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
  const maxBytes = parseBoundedInteger(values['max-bytes'], 'max-bytes', 1, maxInvocationBytes);
  const sourceKey = values['source-key'];
  if (sourceKey !== undefined)
    assert.match(
      sourceKey,
      /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}\.(?:png|jpe?g|webp)$/i,
      '--source-key must be one native image object key.',
    );
  assert.ok(sourceKey === undefined || !values.cursor, '--source-key cannot be combined with --cursor.');
  assert.ok(
    environment === 'local' || values['hosted-budget-reviewed'],
    'Review account-wide Free-tier budget before hosted preparation.',
  );
  return {
    environment,
    limit,
    cursor: values.cursor,
    sourceKey,
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

function isValidExistingDerivative(object) {
  return Boolean(
    object &&
    object.size <= 40 * 1024 &&
    object.httpMetadata?.contentType === 'image/png' &&
    readStaffThumbnailMetadata(object.customMetadata),
  );
}

function skipReason(key) {
  if (key.startsWith(staffThumbnailStoragePrefix)) return 'thumbnail';
  if (/^(?:snapshots|published|media\/published)(?:\/|$)/.test(key)) return 'published';
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,159}\.(?:png|jpe?g|webp)$/i.test(key)) return 'unsupported';
  return null;
}

export async function prepareStaffThumbnailPage({
  bucket,
  environment,
  limit = defaultLimit,
  cursor,
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
    stopped: null,
    counts: { listed: 0, skipped: 0, validExisting: 0, prepared: 0, written: 0, errors: 0 },
    bytes: { original: 0, output: 0 },
    r2: { list: 0, head: 0, get: 0, put: 0 },
  };
  const exactSource = sourceKey !== undefined;
  const page = await bucket.list({
    cursor,
    limit: exactSource ? 1 : limit,
    ...(exactSource ? { prefix: sourceKey } : {}),
    include: ['httpMetadata', 'customMetadata'],
  });
  report.r2.list = 1;
  let interrupted = false;
  const objects = exactSource ? page.objects.filter((object) => object.key === sourceKey) : page.objects;
  if (exactSource && !objects.length) {
    report.counts.errors++;
    report.stopped = 'source-not-found';
    return report;
  }
  for (const listed of objects) {
    report.counts.listed++;
    const reason = skipReason(listed.key);
    const derivativeKey = staffThumbnailStorageKey(listed.key);
    if (reason || !derivativeKey) {
      report.counts.skipped++;
      continue;
    }
    report.r2.head++;
    const existing = await bucket.head(derivativeKey);
    if (isValidExistingDerivative(existing)) {
      report.counts.validExisting++;
      continue;
    }
    if (!Number.isSafeInteger(listed.size) || listed.size < 1 || listed.size > maxOriginalBytes) {
      report.counts.errors++;
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
    : exactSource
      ? null
      : page.truncated
        ? (page.cursor ?? null)
        : null;
  return report;
}

function usage() {
  return [
    'Usage: prepare-staff-thumbnails.mjs --env local|uat|prd [--limit 1..25] [--cursor value | --source-key key] [--max-bytes bytes] [--apply]',
    'Hosted UAT/PRD runs also require --hosted-budget-reviewed.',
  ].join('\n');
}

export function createMediaOnlyConfig({ environment, bucketName, remote }) {
  return {
    name: `blackbox-staff-thumbnails-${environment}`,
    compatibility_date: '2026-08-31',
    r2_buckets: [{ binding: 'MEDIA', bucket_name: bucketName, remote }],
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
    JSON.stringify(createMediaOnlyConfig({ environment: args.environment, bucketName: source.bucket_name, remote })),
  );
  let proxy;
  try {
    proxy = await getPlatformProxy({
      configPath,
      remoteBindings: remote,
      persist: { path: join(backend, '.wrangler/state/v3') },
      envFiles: [],
    });
    const report = await prepareStaffThumbnailPage({
      bucket: proxy.env.MEDIA,
      environment: args.environment,
      limit: args.limit,
      cursor: args.cursor,
      sourceKey: args.sourceKey,
      maxBytes: args.maxBytes,
      apply: args.apply,
    });
    const reportDirectory = join(repoRoot, '.codex-artifacts/reduce-staff-request-latency/staff-thumbnails');
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
