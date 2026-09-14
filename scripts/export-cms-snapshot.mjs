import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseContentSnapshot } from '@blackbox/content-model';
import { captureCmsSnapshot } from './capture-cms-snapshot.mjs';
import { createCmsSnapshotReaders } from './cms-snapshot-readers.mjs';

export async function writeCmsSnapshot(capture, directory, environment) {
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  if (hash(capture.json) !== capture.sha256) throw new Error('Snapshot checksum mismatch.');
  const snapshot = parseContentSnapshot(capture.json, environment);
  const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  const files = new Map();
  for (const media of snapshot.media) {
    const bytes = capture.files.get(media.sha256);
    if (!(bytes instanceof Uint8Array) || bytes.byteLength !== media.size || hash(bytes) !== media.sha256)
      throw new Error('Snapshot media mismatch.');
    files.set(`${media.sha256}.${extensions[media.mimeType]}`, bytes);
  }
  if (capture.files.size !== new Set(snapshot.media.map((media) => media.sha256)).size)
    throw new Error('Unexpected snapshot media.');
  // A fresh destination prevents merging different captures or overwriting an earlier publication.
  const output = resolve(directory);
  await mkdir(output);
  await mkdir(join(output, 'media'));
  for (const [name, bytes] of files) await writeFile(join(output, 'media', name), bytes, { flag: 'wx' });
  const path = join(output, 'snapshot.json');
  await writeFile(path, capture.json, { flag: 'wx' });
  return { path, sha256: capture.sha256, environment };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({
    options: {
      env: { type: 'string' },
      target: { type: 'string' },
      out: { type: 'string' },
      'max-requests': { type: 'string' },
    },
  });
  if (!values.out) throw new Error('Use --env local|uat|prd --target <CMS origin> --out <new directory>.');
  if (existsSync(values.out) || !statSync(dirname(resolve(values.out))).isDirectory())
    throw new Error('Export requires a new directory inside an existing parent; no CMS reads were made.');
  const capture = await captureCmsSnapshot({
    ...createCmsSnapshotReaders({
      environment: values.env,
      target: values.target,
      headers: {
        'cf-access-client-id': process.env.CMS_EXPORT_ACCESS_CLIENT_ID ?? '',
        'cf-access-client-secret': process.env.CMS_EXPORT_ACCESS_CLIENT_SECRET ?? '',
      },
    }),
    maxRequests: values['max-requests'] === undefined ? 200 : Number(values['max-requests']),
  });
  console.log(
    JSON.stringify({ ...(await writeCmsSnapshot(capture, values.out, values.env)), requests: capture.requests }),
  );
}
