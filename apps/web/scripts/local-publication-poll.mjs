import { setTimeout } from 'node:timers/promises';
import { z } from 'zod';

const origin = 'http://127.0.0.1:8787';
const root = '/_emdash/api/blackbox/publications/local/';
const publication = z.object({ id: z.uuid(), revision: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/) });

export function createLocalPublicationClient(signal, fetchImpl = fetch) {
  const send = (url, init = {}) =>
    fetchImpl(url, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.any([signal, AbortSignal.timeout(10_000), ...(init.signal ? [init.signal] : [])]),
    });
  async function request(path, schema, body, method = body === undefined ? 'GET' : 'POST') {
    const response = await send(origin + path, {
      method,
      headers: { Origin: origin, 'X-EmDash-Request': '1', 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw Object.assign(new Error(`Local publication request failed (${response.status}): ${path}`), {
        status: response.status,
      });
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty Local publication response');
    let size = 0;
    const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) throw new Error('Local publication response exceeds byte limit');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
    return schema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  }
  return {
    send,
    reconcile: () =>
      request(
        '/_emdash/api/blackbox/item-publications/reconcile',
        z.object({ status: z.literal('checked') }),
        undefined,
        'POST',
      ),
    next: async () => (await request(root + 'next', z.object({ request: publication.nullable() }))).request,
    complete: (id, snapshotSha256) =>
      request(root + 'complete', z.object({ id: z.literal(id), status: z.literal('live') }), { id, snapshotSha256 }),
    fail: (id) => request(root + 'fail', z.object({ id: z.literal(id), status: z.literal('failed') }), { id }),
  };
}

export async function runLocalPublicationPoll({
  client,
  readActive,
  capture,
  build,
  signal,
  sleep = (delay) => setTimeout(delay, undefined, { signal }),
  log = console.log,
}) {
  let acknowledgement;
  let failures = 0;
  let lastError;
  // ponytail: one runner is enforced by port 4321; no distributed claim is needed for Local.
  while (!signal.aborted) {
    let delay = 2000;
    try {
      await client.reconcile();
      if (!acknowledgement) {
        const request = await client.next();
        if (request) {
          const active = await readActive();
          if (active.publicationId === request.id) {
            acknowledgement = { id: request.id, hash: active.sha256 };
          } else {
            // Capture failures are infrastructure failures: keep the publication pending.
            const { snapshot, input } = await capture();
            if (!snapshot.snapshot.records.some((record) => record.revisionId === request.revision)) {
              acknowledgement = { id: request.id };
              log('[Local publication] Requested revision is no longer published.');
            } else {
              try {
                await build({ ...input, publicationId: request.id });
                acknowledgement = { id: request.id, hash: input.sha256 };
              } catch (error) {
                if (signal.aborted) break;
                acknowledgement = { id: request.id };
                log(`[Local publication] Build failed: ${error.message}`);
              }
            }
          }
        }
      }
      if (signal.aborted) break;
      if (acknowledgement) {
        const { id, hash } = acknowledgement;
        try {
          if (hash) await client.complete(id, hash);
          else await client.fail(id);
        } catch (error) {
          // A terminal conflict must not hold up newer requests.
          if (error.status === 409) acknowledgement = undefined;
          throw error;
        }
        log(hash ? '[Local publication] Live on fresh public page loads.' : '[Local publication] Publication failed.');
        acknowledgement = undefined;
      }
      if (failures) log('[Local publication] Connection recovered.');
      failures = 0;
      lastError = undefined;
    } catch (error) {
      if (signal.aborted) break;
      delay = Math.min(2000 * 2 ** Math.min(failures++, 3), 10000);
      if (lastError !== error.message) log(`[Local publication] Retrying: ${error.message}`);
      lastError = error.message;
    }
    try {
      await sleep(delay);
    } catch (error) {
      if (!signal.aborted) throw error;
    }
  }
}
