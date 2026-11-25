import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';
import { createStaffClient, staffOrigin } from './access';
import { parseCommand, type OperatorEnvironment } from './arguments';
import { runOps } from './cli';

const uat = 'https://staff-uat.blackboxrecordsathens.com';
const prd = 'https://staff.blackboxrecordsathens.com';
const operatorEmail = 'operator@example.test';
const token = `fixture.${Buffer.from(JSON.stringify({ email: operatorEmail })).toString('base64url')}.signature`;
const variant = 'variant_resurrection_standard';
const stockArgs = ['stock', 'set', '--variant', variant, '--copies', '3'];
const setupArgs = ['distro', 'setup', '--id', 'distro_01J8', '--price', '25,50', '--copies', '4'];
const editorial = (data: object) => Response.json({ success: true, data });

function harness(fetcher: typeof fetch) {
  const output: string[] = [];
  const cloudflaredCalls: string[][] = [];
  const cloudflared = async (args: string[]) => {
    cloudflaredCalls.push(args);
    return token;
  };
  return {
    output,
    cloudflaredCalls,
    clientFor: (env: OperatorEnvironment) => createStaffClient(env, { cloudflared, fetcher, wait: async () => {} }),
    report: (line: string) => output.push(line),
    reportError: (line: string) => output.push(line),
    interactive: true,
    prompt: async () => 'UAT',
  };
}

void test('validates the environment, command flags, prices, copies and IDs', () => {
  assert.deepEqual(parseCommand(['login', 'uat']), { action: 'login', env: 'uat' });
  assert.deepEqual(parseCommand(['whoami', '--env=prd']), { action: 'whoami', env: 'prd' });
  assert.throws(() => parseCommand(['login', 'local']), /Allowed choices are uat, prd/);
  assert.throws(() => parseCommand(['whoami', '--env', 'http://staff.example']), /Allowed choices are uat, prd/);
  assert.throws(() => parseCommand(stockArgs), /required option '--env/);
  assert.throws(() => parseCommand([...stockArgs, '--env', 'uat', '--env', 'prd']), /repeated option/);
  assert.throws(() => parseCommand([...stockArgs, '--env', 'uat', '--yes', '--yes']), /repeated option --yes/);
  assert.throws(() => parseCommand([...stockArgs, '--env', 'uat', '--publish']), /unknown option/);
  assert.throws(() => parseCommand(['whoami', '--env', 'uat', '--yes']), /unknown option/);
  assert.throws(() => parseCommand(['login', 'uat', 'prd']), /too many arguments/);
  assert.throws(
    () => parseCommand(['stock', 'set', '--env', 'uat', '--variant', '../variant_x', '--copies', '3']),
    /variant ID/,
  );
  for (const copies of ['-1', '1.5', '1e3', '2147483648']) {
    assert.throws(() => parseCommand([...stockArgs.slice(0, -2), `--copies=${copies}`, '--env', 'uat']), /--copies/);
  }
  for (const price of ['0', '25.001', '1e2', '1000000']) {
    assert.throws(
      () => parseCommand(['distro', 'setup', '--env', 'uat', '--id', 'distro_01J8', '--copies', '4', '--price', price]),
      /--price/,
    );
  }
  assert.throws(
    () => parseCommand(['distro', 'setup', '--env', 'uat', '--id', '../distro_01J8', '--copies', '4', '--price', '25']),
    /CMS record or media ID/,
  );
});

void test('prints generated help and usage errors without starting an operation', async () => {
  const mock = harness(() => assert.fail('No requests for help or usage errors'));
  for (const args of [[], ['--help']]) {
    assert.equal(await runOps(args, mock), 0);
    assert.match(
      mock.output.pop()!,
      /Usage: pnpm ops .*\n[\s\S]*login <uat\|prd>[\s\S]*whoami[\s\S]*distro[\s\S]*stock/,
    );
  }
  assert.equal(await runOps(['distro', '--help'], mock), 0);
  assert.match(mock.output.pop()!, /Usage: pnpm ops distro .*\n[\s\S]*create[\s\S]*setup/);
  assert.equal(await runOps(['distro', 'create', '--help'], mock), 0);
  assert.match(
    mock.output.pop()!,
    /Usage: pnpm ops distro create .*\n[\s\S]*--env <uat\|prd>[\s\S]*--yes[\s\S]*--confirm-live[\s\S]*--title/,
  );
  const errors: string[] = [];
  assert.equal(await runOps(['stock', 'set', '--bad'], { ...mock, reportError: (line) => errors.push(line) }), 1);
  assert.match(errors.join('\n'), /required option|unknown option/);
  assert.deepEqual(mock.output, []);
  assert.deepEqual(mock.cloudflaredCalls, []);
});

void test('accepts only the selected HTTPS Staff origin and protected paths', async () => {
  assert.equal(staffOrigin('uat'), uat);
  assert.equal(staffOrigin('prd'), prd);
  const mock = harness(async () => {
    throw new Error('Unexpected remote call');
  });
  const client = mock.clientFor('uat');
  for (const path of [
    '//example.com/api/internal/stock',
    `${prd}/api/internal/stock`,
    'http://staff-uat.blackboxrecordsathens.com/api/internal/stock',
    '//staff-uat.blackboxrecordsathens.com:444/api/internal/stock',
    '//user@staff-uat.blackboxrecordsathens.com/api/internal/stock',
    '/api/internal/../../admin',
    '/api/internal/stock?token=x',
  ]) {
    await assert.rejects(client.request(path), /selected HTTPS Staff API/);
  }
  assert.deepEqual(mock.cloudflaredCalls, []);
});

void test('login captures cloudflared output and whoami proves identity with a protected commerce read', async () => {
  const mock = harness(async (input, init) => {
    assert.equal(String(input), `${prd}/api/internal/variants?limit=1`);
    assert.equal(init?.method, 'GET');
    assert.equal(new Headers(init?.headers).get('cf-access-token'), token);
    return Response.json([]);
  });
  assert.equal(await runOps(['login', 'prd'], mock), 0);
  assert.equal(await runOps(['whoami', '--env', 'prd'], mock), 0);
  assert.deepEqual(mock.cloudflaredCalls, [
    ['access', 'login', prd],
    ['access', 'token', `-app=${prd}`],
  ]);
  assert.match(mock.output.join('\n'), /PRD operator operator@example\.test/);
  assert.doesNotMatch(mock.output.join('\n'), /fixture/);
});

void test('stops at redirects and hides tokens in response and subprocess errors', async () => {
  let requests = 0;
  const redirect = harness(async (_input, init) => {
    requests++;
    assert.equal(init?.redirect, 'manual');
    assert.ok(init?.signal instanceof AbortSignal);
    return new Response(token, { status: 302, headers: { Location: `https://example.com/?token=${token}` } });
  });
  const args = ['whoami', '--env', 'uat'];
  assert.equal(await runOps(args, redirect), 1);
  assert.equal(requests, 1);
  assert.match(redirect.output.join('\n'), /pnpm ops login uat/);
  assert.doesNotMatch(redirect.output.join('\n'), /fixture|example\.com/);

  const error = harness(async () => new Response(token, { status: 403 }));
  assert.equal(await runOps(args, error), 1);
  assert.match(error.output.join('\n'), /HTTP 403/);
  assert.doesNotMatch(error.output.join('\n'), /fixture/);

  assert.equal(
    await runOps(args, {
      ...error,
      clientFor: (env) =>
        createStaffClient(env, {
          cloudflared: async () => {
            throw new Error(token);
          },
          fetcher: () => assert.fail('No request without a token'),
        }),
    }),
    1,
  );
  assert.match(error.output.join('\n'), /Access token unavailable/);
  assert.doesNotMatch(error.output.join('\n'), /fixture/);
});

void test('PRD writes need apply, live confirmation and an exact interactive answer after the plan', async () => {
  const mock = harness(async (input) => {
    assert.equal(new URL(String(input)).origin, prd);
    if (String(input).endsWith('/counts')) {
      return Response.json({ variantId: variant, entry: { type: 'count', id: 'count_prd' }, shortfall: null });
    }
    return Response.json({ variantId: variant, stock: { revision: null }, owedQuantity: 0 });
  });
  const args = [...stockArgs, '--env', 'prd'];
  assert.equal(await runOps(args, { ...mock, prompt: () => assert.fail('No prompt during dry run') }), 0);
  assert.equal(await runOps([...args, '--apply'], mock), 1);
  const apply = [...args, '--apply', '--confirm-live'];
  assert.equal(await runOps(apply, { ...mock, interactive: false }), 1);
  assert.equal(await runOps(apply, { ...mock, prompt: async () => 'prd' }), 1);
  assert.deepEqual(mock.cloudflaredCalls, []);
  assert.equal(
    await runOps(apply, {
      ...mock,
      prompt: async (question) => {
        const plan = JSON.parse(mock.output.at(-1)!);
        assert.equal(plan.mode, 'apply');
        assert.equal(plan.confirmation, 'typed');
        assert.match(question, /Type PRD/);
        return 'PRD';
      },
    }),
    0,
  );
  assert.equal(mock.cloudflaredCalls.length, 2);
});

void test('applies with --yes without a terminal or prompt and still requires explicit PRD confirmation', async () => {
  for (const env of ['uat', 'prd'] as const) {
    const mock = harness(async (input, init) => {
      assert.equal(new URL(String(input)).origin, env === 'uat' ? uat : prd);
      const plan = JSON.parse(mock.output.at(-1)!);
      assert.equal(plan.mode, 'apply');
      assert.equal(plan.confirmation, '--yes');
      assert.equal(plan.confirmLive, env === 'prd');
      return init?.method === 'POST'
        ? Response.json({ variantId: variant, entry: { type: 'count', id: 'count_yes' }, shortfall: null })
        : Response.json({ variantId: variant, stock: { revision: null }, owedQuantity: 0 });
    });
    const deps = { ...mock, interactive: false, prompt: () => assert.fail('--yes must never prompt') };
    const args = [...stockArgs, '--env', env, '--yes'];
    assert.equal(await runOps(args, deps), 0);
    const dryRun = JSON.parse(mock.output.at(-1)!);
    assert.equal(dryRun.mode, 'dry run');
    assert.equal(dryRun.confirmation, 'typed');
    assert.deepEqual(mock.cloudflaredCalls, []);
    if (env === 'prd') {
      assert.equal(await runOps([...args, '--apply'], deps), 1);
      assert.match(mock.output.at(-1)!, /requires --confirm-live/);
      assert.deepEqual(mock.cloudflaredCalls, []);
    }
    const apply = env === 'prd' ? [...args, '--apply', '--confirm-live'] : [...args, '--apply'];
    assert.equal(await runOps(apply, deps), 0, mock.output.join('\n'));
    assert.equal(mock.cloudflaredCalls.length, 2);
  }
});

void test('creates Distro with Staff fields, artwork and revision-checked publication', async (context) => {
  const dir = await mkdtemp(join(tmpdir(), 'blackbox-ops-'));
  context.after(() => rm(dir, { recursive: true, force: true }));
  const image = join(dir, 'cover.webp');
  const original = await sharp({
    create: { width: 160, height: 120, channels: 3, background: '#741343' },
  })
    .webp()
    .toBuffer();
  await writeFile(image, original);
  let setupId: string | undefined;
  const publications: unknown[] = [];
  const requests: string[] = [];
  const mock = harness(async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    requests.push(url.pathname);
    assert.equal(url.origin, uat);
    assert.equal(headers.get('cf-access-token'), token);
    if (init?.method === 'POST') assert.equal(headers.get('origin'), uat);
    if (url.pathname === '/_emdash/api/media') {
      assert.equal(headers.get('X-EmDash-Request'), '1');
      assert.equal(headers.has('Content-Type'), false);
      assert.ok(init?.body instanceof FormData);
      const file = init.body.get('file');
      const preview = init.body.get('thumbnail');
      assert.ok(file instanceof File && preview instanceof File);
      assert.equal(file.name, 'cover.webp');
      assert.equal(file.type, 'image/webp');
      assert.deepEqual(Buffer.from(await file.arrayBuffer()), original);
      assert.equal(init.body.get('deduplicate'), 'true');
      const thumbnail = await sharp(await preview.arrayBuffer()).metadata();
      assert.equal(thumbnail.format, 'png');
      assert.equal(thumbnail.width, 96);
      assert.equal(thumbnail.height, 72);
      return editorial({ item: { id: 'media_01J8' } });
    }
    if (url.pathname === '/api/internal/items/setup') {
      assert.equal(headers.get('X-Blackbox-Request'), '1');
      const body = JSON.parse(String(init?.body));
      setupId = body.operationId;
      assert.deepEqual(body, {
        operationId: setupId,
        storeItemSlug: `resurrection-vinyl-12-inch-${setupId}`,
        source: {
          mode: 'create',
          sourceKind: 'distro',
          slug: `resurrection-${setupId}`,
          data: {
            title: 'Résurrection',
            artist_or_label: 'Bruce.',
            summary: 'A physical edition.',
            image: { id: 'media_01J8' },
            image_alt: 'A cover against a dark background',
            format: 'Vinyl 12-inch',
            order: 0,
            product_condition: 'new',
          },
        },
        itemType: 'Vinyl 12-inch',
        price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2520 },
        openingQuantity: 4,
        zeroStockState: 'sold_out',
        expectedMonth: null,
        confirmLiveSetup: true,
      });
      return Response.json({ operationId: setupId, variantId: variant, status: 'completed' });
    }
    assert.equal(url.pathname, `/api/internal/variants/${variant}/publication`);
    if (init?.method === 'GET') {
      return Response.json({ expectedRevision: 2, cmsRevision: 'draft_rev', pending: null });
    }
    assert.equal(headers.get('X-Blackbox-Request'), '1');
    const body = JSON.parse(String(init?.body));
    assert.notEqual(body.operationId, setupId);
    assert.deepEqual(body, {
      operationId: body.operationId,
      expectedRevision: 2,
      cmsRevision: 'draft_rev',
      confirmLivePublication: true,
      retryPublication: false,
    });
    publications.push(body);
    if (publications.length === 1) return new Response(null, { status: 503 });
    return Response.json({
      operationId: body.operationId,
      variantId: variant,
      status: 'completed',
      publicationStatus: 'live',
    });
  });
  const args = [
    'distro',
    'create',
    '--env',
    'uat',
    '--title',
    ' Résurrection ',
    '--artist',
    'Bruce.',
    '--format',
    'Vinyl 12-inch',
    '--price',
    '25.20',
    '--copies',
    '4',
    '--image',
    image,
    '--alt',
    'A cover against a dark background',
    '--summary',
    'A physical edition.',
    '--condition',
    'new',
    '--publish',
    '--apply',
  ];
  assert.throws(
    () => parseCommand(args.map((value) => (value === 'Vinyl 12-inch' ? 'Vinyl' : value))),
    /supported Distro format/,
  );
  assert.throws(() => parseCommand(args.map((value) => (value === 'new' ? 'mint' : value))), /--condition/);
  const altIndex = args.indexOf('--alt');
  assert.throws(() => parseCommand(args.toSpliced(altIndex + 1, 1, '--yes')), /Supply --alt/);
  assert.deepEqual(parseCommand(args.toSpliced(altIndex, 2, '--alt=--yes')), { ...parseCommand(args), alt: '--yes' });
  assert.equal(await runOps(args, mock), 0, mock.output.join('\n'));
  assert.deepEqual(requests, [
    '/_emdash/api/media',
    '/api/internal/items/setup',
    `/api/internal/variants/${variant}/publication`,
    `/api/internal/variants/${variant}/publication`,
    `/api/internal/variants/${variant}/publication`,
  ]);
  assert.equal(mock.cloudflaredCalls.length, requests.length);
  assert.equal(publications.length, 2);
  assert.deepEqual(publications[0], publications[1]);
  assert.match(mock.output.join('\n'), /status completed \(website live\)/);
});

void test('replays the existing-source setup body and stops if setup needs review', async () => {
  const setupBodies: string[] = [];
  const mock = harness(async (input, init) => {
    if (String(input).endsWith('/content/distro/distro_01J8')) {
      assert.equal(init?.method, 'GET');
      return editorial({ item: { id: 'distro_01J8', data: { title: 'Saved item', group: '', format: 'CDs' } } });
    }
    assert.equal(String(input), `${uat}/api/internal/items/setup`);
    setupBodies.push(String(init?.body));
    if (setupBodies.length === 1) return new Response(null, { status: 503 });
    const body = JSON.parse(setupBodies[1]!);
    assert.deepEqual(body.source, { mode: 'existing', sourceKind: 'distro', id: 'distro_01J8' });
    assert.equal(body.storeItemSlug, `saved-item-cds-${body.operationId}`);
    assert.equal(body.price.amountMinor, 2550);
    assert.equal(body.openingQuantity, 4);
    return Response.json({ operationId: body.operationId, variantId: variant, status: 'needs_review' });
  });
  assert.equal(await runOps([...setupArgs, '--env', 'uat', '--apply', '--publish'], mock), 1);
  assert.equal(setupBodies.length, 2);
  assert.equal(setupBodies[0], setupBodies[1]);
  assert.match(mock.output.join('\n'), /Distro setup operationId .* status needs_review/);
});

void test('records physical stock with the current revision and keeps retry keys private', async () => {
  const requests: { body: unknown; key: string | null }[] = [];
  const mock = harness(async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path === `/api/internal/variants/${variant}/stock` && init?.method === 'GET') {
      return Response.json({ variantId: variant, stock: { revision: 7 }, owedQuantity: 2 });
    }
    assert.equal(path, `/api/internal/variants/${variant}/stock/counts`);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('X-Blackbox-Request'), '1');
    assert.equal(headers.get('Origin'), uat);
    requests.push({ body: JSON.parse(String(init?.body)), key: headers.get('Idempotency-Key') });
    if (requests.length === 1) throw new Error(token);
    return Response.json({ variantId: variant, entry: { type: 'count', id: 'count_01J8' }, shortfall: 0 });
  });
  assert.equal(await runOps([...stockArgs, '--env', 'uat', '--apply'], mock), 0, mock.output.join('\n'));
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
  assert.deepEqual(requests[0].body, { expectedRevision: 7, countedQuantity: 3, onlineQuantity: 1, notes: null });
  const key = requests[0].key;
  assert.match(key ?? '', /^[0-9a-f-]{36}$/);
  assert.ok(key && !mock.output.join('\n').includes(key));
  assert.match(mock.output.join('\n'), /Stock operationId .* status completed \(count count_01J8\)/);
});
