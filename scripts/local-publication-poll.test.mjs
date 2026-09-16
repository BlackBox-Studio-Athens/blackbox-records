import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runLocalPublicationPoll, createLocalPublicationClient } from '../apps/web/scripts/local-publication-poll.mjs';

const id = 'b701dbb6-6898-4f42-9cb4-9ea08e6e139f';
const hash = 'a'.repeat(64);

function fixture(overrides = {}) {
  const controller = new AbortController();
  const events = [];
  let ticks = 0;
  const options = {
    client: {
      reconcile: async () => {},
      next: async () => ({ id, revision: 'rev1' }),
      complete: async (...args) => {
        events.push(['complete', ...args]);
      },
      fail: async (...args) => {
        events.push(['fail', ...args]);
      },
    },
    readActive: async () => ({ sha256: 'old' }),
    capture: async () => {
      events.push(['capture']);
      return { snapshot: { snapshot: { records: [{ revisionId: 'rev1' }] } }, input: { sha256: hash } };
    },
    build: async (input) => {
      events.push(['build', input]);
    },
    signal: controller.signal,
    sleep: async () => {
      if (++ticks === 2) controller.abort();
    },
    log: () => {},
    ...overrides,
  };
  return { controller, events, options };
}

test('retries a lost completion response without rebuilding or reporting failure', async () => {
  const { options, events } = fixture();
  let attempts = 0;
  options.client.complete = async (...args) => {
    events.push(['complete', ...args]);
    if (++attempts === 1) throw new Error('connection refused');
  };
  await runLocalPublicationPoll(options);
  assert.deepEqual(
    events.map(([event]) => event),
    ['capture', 'build', 'complete', 'complete'],
  );
});

test('restart acknowledges the saved receipt without capturing newer private drafts', async () => {
  const { options, events } = fixture({ readActive: async () => ({ publicationId: id, sha256: hash }) });
  await runLocalPublicationPoll(options);
  assert.deepEqual(events, [
    ['complete', id, hash],
    ['complete', id, hash],
  ]);
});

test('retries failed-build acknowledgement and does not build again', async () => {
  const { options, events } = fixture({
    build: async () => {
      throw new Error('build failed');
    },
  });
  let attempts = 0;
  options.client.fail = async () => {
    events.push(['fail']);
    if (++attempts === 1) throw new Error('database unavailable');
  };
  await runLocalPublicationPoll(options);
  assert.deepEqual(
    events.map(([event]) => event),
    ['capture', 'fail', 'fail'],
  );
});

test('missing published revision fails without building; capture outages stay pending', async () => {
  const missing = fixture({ capture: async () => ({ snapshot: { snapshot: { records: [] } }, input: {} }) });
  await runLocalPublicationPoll(missing.options);
  assert.deepEqual(
    missing.events.map(([event]) => event),
    ['fail', 'fail'],
  );
  const outage = fixture({
    capture: async () => {
      throw new Error('CMS unavailable');
    },
  });
  await runLocalPublicationPoll(outage.options);
  assert.deepEqual(outage.events, []);
});

test('reconciliation failure is recoverable and abort during build never marks failed or live', async () => {
  const { options, controller, events } = fixture();
  let calls = 0;
  options.client.reconcile = async () => {
    if (++calls === 1) throw new Error('reconcile failed');
  };
  options.build = async () => {
    controller.abort();
    throw new Error('stopped');
  };
  await runLocalPublicationPoll(options);
  assert.deepEqual(events, [['capture']]);
});

test('HTTP client rejects failures, malformed JSON, unexpected shapes and oversized responses', async () => {
  for (const response of [
    new Response('internal error', { status: 503 }),
    new Response(null, { status: 302, headers: { Location: 'https://example.com' } }),
    new Response('not JSON'),
    Response.json({ request: { id: 'bad', revision: 'rev1' } }),
    new Response('x'.repeat(5000)),
  ]) {
    const client = createLocalPublicationClient(new AbortController().signal, async (_, init) => {
      assert.equal(init.redirect, 'manual');
      assert.ok(init.signal instanceof AbortSignal);
      return response;
    });
    await assert.rejects(client.next());
  }
  for (const error of [new TypeError('fetch failed'), new DOMException('timed out', 'TimeoutError')]) {
    const client = createLocalPublicationClient(new AbortController().signal, async () => {
      throw error;
    });
    await assert.rejects(client.next(), error);
  }
});

test('shutdown aborts an in-flight HTTP request and exits the poll cleanly', async () => {
  const controller = new AbortController();
  const client = createLocalPublicationClient(
    controller.signal,
    async (_, { signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        controller.abort();
      }),
  );
  await runLocalPublicationPoll({ client, signal: controller.signal });
});

test('survives the reported D1 poll failure and resets backoff after recovery', async () => {
  const controller = new AbortController();
  const delays = [];
  const logs = [];
  let calls = 0;
  await runLocalPublicationPoll({
    client: {
      reconcile: async () => {},
      next: async () => {
        if (++calls <= 5) throw new Error('D1_ERROR: Failed to parse body as JSON, got: Error: internal error');
        return null;
      },
    },
    signal: controller.signal,
    sleep: async (delay) => {
      delays.push(delay);
      if (calls === 6) controller.abort();
    },
    log: (message) => logs.push(message),
  });
  assert.deepEqual(delays, [2000, 4000, 8000, 10000, 10000, 2000]);
  assert.equal(logs.length, 2);
  assert.match(logs[1], /recovered/i);
});
