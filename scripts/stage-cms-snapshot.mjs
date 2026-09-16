import { createHash } from 'node:crypto';
import { z } from 'zod';
import { cmsSnapshotTarget } from './cms-snapshot-readers.mjs';

// CI owns the capture. No retry: a rejected or uncertain handoff needs journal reconciliation.
export async function stageCmsSnapshot({
  environment,
  target,
  publicationId,
  ciRunId,
  token,
  capture,
  headers = {},
  fetchImpl = fetch,
}) {
  const origin = cmsSnapshotTarget(environment, target);
  z.uuid().parse(publicationId);
  z.string()
    .regex(/^[1-9][0-9]{0,19}$/)
    .parse(ciRunId);
  z.string()
    .regex(/^[a-f0-9]{64}$/)
    .parse(token);
  const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
  const json = capture?.json;
  if (typeof json !== 'string' || Buffer.byteLength(json) > 4 * 1024 * 1024 || digest(json) !== capture.sha256)
    throw new Error('Invalid captured snapshot.');
  const manifest = JSON.parse(json);
  if (
    manifest.environment !== environment ||
    !Array.isArray(manifest.media) ||
    !(capture.files instanceof Map) ||
    capture.files.size > 1000
  )
    throw new Error('Invalid captured snapshot.');
  const expected = new Set(manifest.media.map((item) => item.sha256));
  if (expected.size !== capture.files.size) throw new Error('Snapshot files do not match manifest.');
  let total = 0;
  // Check the whole handoff before the first remote write.
  for (const [sha256, bytes] of capture.files) {
    if (
      !expected.has(sha256) ||
      !(bytes instanceof Uint8Array) ||
      !bytes.byteLength ||
      bytes.byteLength > 20 * 1024 * 1024 ||
      digest(bytes) !== sha256
    )
      throw new Error('Invalid captured media.');
    total += bytes.byteLength;
  }
  if (total > 256 * 1024 * 1024) throw new Error('Snapshot media byte budget exceeded.');
  const requestHeaders = new Headers({
    Authorization: `Bearer ${token}`,
    'X-Publication-ID': publicationId,
    'X-CI-Run-ID': ciRunId,
  });
  const supplied = new Headers(headers);
  for (const key of ['cf-access-client-id', 'cf-access-client-secret']) {
    const value = supplied.get(key);
    if (value) requestHeaders.set(key, value);
  }
  async function put(kind, body, expectedResult) {
    const outgoing = new Headers(requestHeaders);
    outgoing.set('Content-Type', kind === 'media' ? 'application/octet-stream' : 'application/json');
    const response = await fetchImpl(new URL('/_emdash/api/blackbox/publications/' + kind, origin), {
      method: 'PUT',
      body,
      headers: outgoing,
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
    try {
      if (response.status !== 200) throw new Error(`Snapshot handoff failed (${response.status}).`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Empty snapshot acknowledgement.');
      let text = '';
      let size = 0;
      const decoder = new TextDecoder('utf-8', { fatal: true });
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 4096) throw new Error('Snapshot acknowledgement exceeds byte limit.');
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
      } finally {
        await reader.cancel();
        reader.releaseLock();
      }
      const result = JSON.parse(text);
      if (
        !result ||
        Object.keys(result).length !== Object.keys(expectedResult).length ||
        Object.entries(expectedResult).some(([key, value]) => result[key] !== value)
      )
        throw new Error('Snapshot acknowledgement mismatch.');
    } finally {
      await response.body?.cancel();
    }
  }
  for (const [sha256, bytes] of capture.files) await put('media', bytes, { sha256 });
  const result = { id: publicationId, snapshotSha256: capture.sha256 };
  await put('snapshot', json, result);
  return result;
}
