import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  apex,
  pages,
  finalizeReady,
  loadLaunchEnvironment,
  parseLaunchArgs,
  runLaunch,
} from './launch-switch/index.mjs';

const now = Date.parse('2026-10-12T12:00:00Z');
const release = {
  sha: 'c'.repeat(40),
  runId: '123',
  runNumber: 10,
  publicationMode: 'runtime',
  content: { snapshotSha256: 'd'.repeat(64) },
};
const account = 'a'.repeat(32);
const zone = 'b'.repeat(32);
const env = {
  CLOUDFLARE_ACCOUNT_ID: account,
  CLOUDFLARE_ZONE_ID: zone,
  CLOUDFLARE_API_TOKEN: 'private-cloudflare-token',
  STRIPE_LAUNCH_KEY: 'rk_live_private_fixture',
};
const html = `<html><link rel="canonical" href="${apex}/"><meta property="og:url" content="${apex}/"><img src="https://images.blackboxrecordsathens.com/cdn-cgi/image/width=480/${pages}/media/content/${'e'.repeat(64)}"></html>`;
const jobs = [
  'e2e (1)',
  'e2e (2)',
  'e2e (3)',
  'e2e (4)',
  'staff-previews (chromium)',
  'staff-previews (firefox)',
  'deploy-uat',
].map((name) => ({ name, conclusion: 'success' }));

function fixture(t, options = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'blackbox-launch-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, '.codex-artifacts/launch');
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, 'stripe-dashboard-review.json'),
    JSON.stringify({
      accountId: 'acct_fixture',
      reviewedAt: new Date(now).toISOString(),
      website: `${apex}/`,
      terms: `${apex}/terms/`,
      privacy: `${apex}/privacy/`,
      displayLegalPolicies: true,
    }),
  );
  const apexRecord = {
    id: 'apex-dns',
    type: 'CNAME',
    name: new URL(apex).hostname,
    content: 'holding.blackbox-records-web.pages.dev',
    ttl: 1,
    proxied: true,
  };
  const state = {
    dns: { ...apexRecord },
    lists: [],
    rules: null,
    items: [],
    hsts: false,
    writes: [],
    calls: [],
    imageChecks: 0,
  };
  const envelope = (result) => Response.json({ success: true, result });
  const fetch = async (input, init = {}) => {
    const url = new URL(input);
    const method = init.method ?? 'GET';
    state.calls.push({ url: url.href, method });
    if (method !== 'GET' && method !== 'HEAD') state.writes.push({ url: url.href, method, body: init.body });
    const pathname = url.pathname;
    if (url.hostname === 'api.cloudflare.com') {
      const base = `/client/v4/accounts/${account}`;
      const zonePath = `/client/v4/zones/${zone}`;
      if (pathname === '/client/v4/user/tokens/verify') return envelope({ status: 'active' });
      if (pathname === zonePath) return envelope({ name: new URL(apex).hostname, account: { id: account } });
      if (pathname === `${zonePath}/dns_records`) {
        const records =
          url.searchParams.get('name') === state.dns.name
            ? [{ ...state.dns }, { id: 'apex-txt', name: state.dns.name, type: 'TXT', content: 'verification' }]
            : [{ id: 'www-dns', name: `www.${state.dns.name}`, type: 'CNAME', content: state.dns.name }];
        return envelope(
          records.filter((record) => !url.searchParams.has('type') || record.type === url.searchParams.get('type')),
        );
      }
      if (pathname === `${zonePath}/dns_records/apex-dns` && method === 'PATCH') {
        state.dns = { ...state.dns, ...JSON.parse(init.body) };
        if (options.lostPatch && state.dns.content === 'blackbox-records-web.pages.dev')
          throw new Error(env.CLOUDFLARE_API_TOKEN);
        return envelope(state.dns);
      }
      if (pathname === `${base}/pages/projects/blackbox-records-web/domains`)
        return envelope([{ name: state.dns.name, status: 'active' }]);
      if (pathname === `${base}/pages/projects/blackbox-records-web/domains/${state.dns.name}`)
        return envelope({ status: options.failTls ? 'pending' : 'active' });
      if (pathname.endsWith('/phases/http_request_dynamic_redirect/entrypoint'))
        return envelope({ id: 'zone-redirects', rules: [{ ref: 'existing-www' }] });
      if (pathname.endsWith('/phases/http_request_redirect/entrypoint'))
        return state.rules ? envelope(state.rules) : new Response(null, { status: 404 });
      if (pathname === `${base}/rules/lists`) {
        if (method === 'POST') state.lists.push({ id: 'launch-list', ...JSON.parse(init.body) });
        return envelope(method === 'POST' ? state.lists.at(-1) : state.lists);
      }
      if (pathname === `${base}/rules/lists/launch-list/items`) {
        if (method === 'POST') {
          state.items = JSON.parse(init.body);
          return envelope({ operation_id: 'operation' });
        }
        return envelope(state.items);
      }
      if (pathname === `${base}/rules/lists/bulk_operations/operation`) return envelope({ status: 'completed' });
      if (pathname === `${base}/rulesets` && method === 'POST') {
        state.rules = { id: 'account-rules', ...JSON.parse(init.body) };
        state.rules.rules = state.rules.rules.map((rule) => ({ ...rule, id: 'launch-rule' }));
        return envelope(state.rules);
      }
      if (pathname.endsWith('/rules/launch-rule') && method === 'DELETE') {
        state.rules.rules = [];
        return envelope({});
      }
      if (pathname.endsWith('/rules/lists/launch-list') && method === 'DELETE') {
        state.lists = [];
        return envelope({});
      }
      if (pathname.endsWith('/subdomain'))
        return envelope({
          enabled: method !== 'POST' && !state.writes.some((call) => call.url === url.href),
          previews_enabled: false,
        });
      if (pathname.endsWith('/settings/security_header')) {
        if (method === 'PATCH') state.hsts = true;
        return envelope({ value: { strict_transport_security: { enabled: state.hsts } } });
      }
    }
    if (url.hostname === 'api.stripe.com') {
      if (pathname === '/v1/account') return Response.json({ id: 'acct_fixture' });
      if (pathname === '/v1/webhook_endpoints')
        return Response.json({
          has_more: false,
          data: [{ url: `${apex}/api/stripe/webhooks`, status: 'enabled', livemode: true }],
        });
      if (pathname === '/v1/products')
        return Response.json({
          has_more: false,
          data: Array.from({ length: options.artworkCount ?? 1 }, (_, index) => ({
            images: [
              options.oldArtwork
                ? `https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev/media/published/${'e'.repeat(64)}`
                : `${apex}/media/published/${index.toString(16).padStart(64, '0')}`,
            ],
          })),
        });
    }
    if (url.origin === pages && state.rules?.rules?.length)
      return new Response(null, { status: 301, headers: { Location: `${apex}${pathname}${url.search}` } });
    if (url.origin === pages && pathname === '/release.json') return Response.json(release);
    if (url.origin === pages && pathname === '/')
      return new Response(html, { headers: { 'X-Release-SHA': release.sha } });
    if (url.origin === apex && pathname === '/') {
      if (state.dns.content.startsWith('holding.'))
        return new Response('<meta name="robots" content="noindex">Holding Page');
      return new Response(html, {
        status: options.failHome ? 503 : 200,
        headers: {
          'X-Release-SHA': release.sha,
          ...(state.hsts ? { 'Strict-Transport-Security': 'max-age=15768000; includeSubDomains' } : {}),
        },
      });
    }
    if (url.origin === apex && pathname === '/api/store/capabilities')
      return Response.json({}, { headers: { 'X-Release-SHA': release.sha } });
    if (url.origin === apex && ['/terms/', '/privacy/'].includes(pathname))
      return new Response('<html>Policy</html>', {
        status: options.failPolicy ? 503 : 200,
        headers: { 'Content-Type': 'text/html' },
      });
    if (url.origin === apex && pathname.startsWith('/assets/'))
      return new Response('image', { headers: { 'Content-Type': 'image/jpeg' } });
    if (url.origin === apex && pathname.startsWith('/media/'))
      return new Response(null, { headers: { 'Content-Type': 'image/webp' } });
    if (url.origin === apex && pathname === '/sitemap.xml')
      return new Response(`<urlset><url><loc>${apex}/</loc></url></urlset>`);
    if (url.origin === apex && pathname === '/robots.txt')
      return new Response(`User-agent: *\nSitemap: ${apex}/sitemap.xml`);
    if (url.origin.startsWith('http://') || url.hostname === `www.${new URL(apex).hostname}`)
      return new Response(null, { status: 308, headers: { Location: `${apex}${pathname}${url.search}` } });
    if (url.hostname === 'holding.blackbox-records-web.pages.dev')
      return new Response(null, { status: 301, headers: { Location: `${apex}${pathname}${url.search}` } });
    if (url.hostname.endsWith('.workers.dev')) return new Response(null, { status: 404 });
    if (url.hostname === 'staff.blackboxrecordsathens.com')
      return new Response(null, {
        status: 302,
        headers: { 'Strict-Transport-Security': 'max-age=15768000; includeSubDomains' },
      });
    throw new Error(`Unexpected fixture request: ${method} ${url.href}`);
  };
  const output = [];
  const dependencies = {
    root,
    env,
    fetch,
    now: () => now,
    sleep: async () => {},
    log: (message) => output.push(message),
    imageFallback: async ({ countRequest }) => {
      state.imageChecks += 1;
      for (let index = 0; index < (options.browserRequests ?? 0); index += 1) countRequest();
      return { loaded: true };
    },
    github: (endpoint) =>
      endpoint.endsWith('/jobs?per_page=100')
        ? { jobs: options.failedSuites ? jobs.map((job) => ({ ...job, conclusion: 'failure' })) : jobs }
        : {
            head_sha: release.sha,
            status: 'completed',
            conclusion: options.failedRun ? 'failure' : 'success',
            path: '.github/workflows/pages.yml',
            head_branch: 'main',
            event: 'push',
            run_number: release.runNumber,
            repository: { full_name: 'BlackBox-Studio-Athens/blackbox-records' },
            head_repository: { full_name: 'BlackBox-Studio-Athens/blackbox-records' },
          },
  };
  const saved = () => JSON.parse(readFileSync(path.join(directory, 'snapshot.json'), 'utf8'));
  const prepareFinalize = () => {
    state.dns.content = 'blackbox-records-web.pages.dev';
    writeFileSync(
      path.join(directory, 'snapshot.json'),
      JSON.stringify({
        version: 1,
        account,
        zone,
        apex: apexRecord,
        release,
        lists: [],
        cutoverAt: new Date(now - 86_400_000).toISOString(),
      }),
    );
  };
  return { root, directory, state, dependencies, output, saved, prepareFinalize };
}

test('shell credentials take precedence over the ignored launch file', (t) => {
  const { root } = fixture(t);
  writeFileSync(path.join(root, '.env.launch'), 'STRIPE_LAUNCH_KEY=rk_live_file\nCLOUDFLARE_API_TOKEN=file-token\n');
  assert.deepEqual(loadLaunchEnvironment(root, { STRIPE_LAUNCH_KEY: 'rk_live_shell' }), {
    STRIPE_LAUNCH_KEY: 'rk_live_shell',
    CLOUDFLARE_API_TOKEN: 'file-token',
  });
});

test('cutover dry-run performs only reads, prints planned writes and retains no rollback snapshot', async (t) => {
  const f = fixture(t);
  const result = await runLaunch('cutover', { ...f.dependencies, dryRun: true });
  assert.equal(result.status, 'planned');
  assert.equal(f.state.writes.length, 0);
  assert.equal(f.state.imageChecks, 0);
  assert.equal(existsSync(path.join(f.directory, 'snapshot.json')), false);
  assert.ok(result.steps.some((step) => step.status === 'planned'));
  for (const secret of [env.CLOUDFLARE_API_TOKEN, env.STRIPE_LAUNCH_KEY])
    assert.ok(!f.output.join('\n').includes(secret));
});

test('a successful cutover snapshots the holding target, verifies image fallback and records the cutover time', async (t) => {
  const f = fixture(t);
  const result = await runLaunch('cutover', f.dependencies);
  assert.equal(result.status, 'passed');
  assert.equal(f.state.dns.content, 'blackbox-records-web.pages.dev');
  assert.equal(f.saved().apex.content, 'holding.blackbox-records-web.pages.dev');
  assert.equal(f.saved().cutoverAt, new Date(now).toISOString());
  assert.equal(f.state.imageChecks, 1);
  assert.equal(f.state.writes.length, 1);
});

for (const failure of ['failHome', 'failTls', 'lostPatch'])
  test(`${failure} restores Holding Page DNS and exits failed`, async (t) => {
    const f = fixture(t, { [failure]: true });
    const result = await runLaunch('cutover', f.dependencies);
    assert.equal(result.status, 'failed');
    assert.equal(f.state.dns.content, 'holding.blackbox-records-web.pages.dev');
    assert.ok(f.saved().rolledBackAt);
    assert.ok(
      result.steps.some(
        (step) => step.name === 'Automatic rollback after critical failure' && step.status === 'passed',
      ),
    );
    assert.ok(!JSON.stringify(result).includes(env.CLOUDFLARE_API_TOKEN));
  });

test('a noncritical policy failure is reported without silently reverting the launch', async (t) => {
  const f = fixture(t, { failPolicy: true });
  const result = await runLaunch('cutover', f.dependencies);
  assert.equal(result.status, 'failed');
  assert.equal(f.state.dns.content, 'blackbox-records-web.pages.dev');
  assert.equal(f.state.writes.length, 1);
  assert.ok(result.steps.some((step) => step.name === '/terms/' && step.status === 'failed'));
});

test('finalize refuses inside 24 hours, including dry-run, before making a request', async (t) => {
  const f = fixture(t);
  f.prepareFinalize();
  const snapshot = f.saved();
  snapshot.cutoverAt = new Date(now - 1000).toISOString();
  writeFileSync(path.join(f.directory, 'snapshot.json'), JSON.stringify(snapshot));
  for (const dryRun of [true, false]) {
    const result = await runLaunch('finalize', { ...f.dependencies, dryRun });
    assert.equal(result.status, 'failed');
    assert.match(result.error, /Finalize is available after/);
  }
  assert.equal(f.state.calls.length, 0);
  assert.throws(() => finalizeReady({ cutoverAt: 'bad' }, now), /Invalid/);
});

test('finalize dry-run rechecks stability but performs no external writes', async (t) => {
  const f = fixture(t);
  f.prepareFinalize();
  const result = await runLaunch('finalize', { ...f.dependencies, dryRun: true });
  assert.equal(result.status, 'planned');
  assert.equal(f.state.writes.length, 0);
});

test('finalize accepts only the explicitly reviewed current release and preserves the rollback snapshot', async (t) => {
  for (const dryRun of [true, false]) {
    const f = fixture(t);
    f.prepareFinalize();
    const snapshot = f.saved();
    snapshot.release = { ...release, sha: 'a'.repeat(40) };
    writeFileSync(path.join(f.directory, 'snapshot.json'), JSON.stringify(snapshot));
    const refused = await runLaunch('finalize', { ...f.dependencies, dryRun });
    assert.equal(refused.status, 'failed');
    assert.match(refused.error, /PRD source changed since cutover/);
    const mismatch = await runLaunch('finalize', { ...f.dependencies, dryRun, acceptRelease: 'b'.repeat(40) });
    assert.equal(mismatch.status, 'failed');
    assert.match(mismatch.error, /Accepted release differs/);
    assert.equal(f.state.writes.length, 0);
    const accepted = await runLaunch('finalize', { ...f.dependencies, dryRun, acceptRelease: release.sha });
    assert.equal(accepted.status, dryRun ? 'planned' : 'passed', accepted.error);
    assert.equal(accepted.acceptedRelease, release.sha);
    assert.equal(f.saved().release.sha, snapshot.release.sha);
  }
});

test('an accepted SHA cannot bypass run, suite or Home validation', async (t) => {
  for (const options of [{ failedRun: true }, { failedSuites: true }, { failHome: true }]) {
    const f = fixture(t, options);
    f.prepareFinalize();
    const result = await runLaunch('finalize', { ...f.dependencies, acceptRelease: release.sha });
    assert.equal(result.status, 'failed');
    assert.equal(f.state.writes.length, 0);
  }
});

test('accepted release arguments are explicit, bounded and finalize-only', async (t) => {
  assert.deepEqual(parseLaunchArgs(['finalize', '--accept-release', release.sha, '--dry-run']), {
    stage: 'finalize',
    acceptRelease: release.sha,
    dryRun: true,
    help: undefined,
  });
  assert.throws(() => parseLaunchArgs(['finalize', '--accept-release']));
  assert.throws(() => parseLaunchArgs(['finalize', 'extra']));
  assert.throws(() => parseLaunchArgs(['finalize', '--unknown']));
  for (const [stage, acceptRelease] of [
    ['cutover', release.sha],
    ['rollback', release.sha],
    ['finalize', 'bad'],
  ]) {
    const f = fixture(t);
    const result = await runLaunch(stage, { ...f.dependencies, acceptRelease });
    assert.equal(result.status, 'failed');
    assert.equal(f.state.calls.length, 0);
  }
});

test('finalize fits a full catalog and measured fallback traffic within its request budget', async (t) => {
  const f = fixture(t, { artworkCount: 100, browserRequests: 49 });
  f.prepareFinalize();
  const result = await runLaunch('finalize', f.dependencies);
  assert.equal(result.status, 'passed', result.error);
  assert.equal(f.state.calls.filter((call) => call.method === 'HEAD').length, 100);
  assert.ok(result.publicRequests > 150 && result.publicRequests <= 175);
  assert.ok(result.requests <= 200);
});

test('finalize refuses before any write while Stripe artwork depends on workers.dev', async (t) => {
  const f = fixture(t, { oldArtwork: true });
  f.prepareFinalize();
  for (const dryRun of [true, false]) {
    const result = await runLaunch('finalize', { ...f.dependencies, dryRun });
    assert.equal(result.status, 'failed');
    assert.match(result.error, /Migrate active Stripe product artwork/);
  }
  assert.equal(f.state.writes.length, 0);
});

test('invalid stages cannot choose the summary directory', async (t) => {
  const f = fixture(t);
  const result = await runLaunch('../../outside', f.dependencies);
  assert.equal(result.status, 'failed');
  assert.equal(f.state.calls.length, 0);
  assert.equal(existsSync(path.join(f.directory, 'invalid')), true);
});

test('finalize creates the exact Bulk Redirect, disables both Workers and verifies HSTS', async (t) => {
  const f = fixture(t);
  f.prepareFinalize();
  const result = await runLaunch('finalize', f.dependencies);
  assert.equal(result.status, 'passed');
  assert.deepEqual(f.state.items[0].redirect, {
    source_url: 'blackbox-records-web.pages.dev/',
    target_url: `${apex}/`,
    status_code: 301,
    include_subdomains: true,
    subpath_matching: true,
    preserve_path_suffix: true,
    preserve_query_string: true,
  });
  assert.equal(f.state.writes.filter((call) => call.url.endsWith('/subdomain')).length, 2);
  const hsts = JSON.parse(f.state.writes.find((call) => call.url.endsWith('/settings/security_header')).body);
  assert.equal(hsts.value.strict_transport_security.preload, false);
  assert.ok(f.saved().finalizedAt);
  const rolledBack = await runLaunch('rollback', f.dependencies);
  assert.equal(rolledBack.status, 'passed');
  assert.equal(f.state.lists.length, 0);
  assert.equal(f.state.rules.rules.length, 0);
  assert.equal(f.state.dns.content, 'holding.blackbox-records-web.pages.dev');
});

test('a failed run still writes a safe summary and never includes credentials', async (t) => {
  const f = fixture(t);
  const result = await runLaunch('cutover', {
    ...f.dependencies,
    github: () => {
      throw new Error(`Provider echoed ${env.STRIPE_LAUNCH_KEY} ${env.CLOUDFLARE_API_TOKEN}`);
    },
  });
  assert.equal(result.status, 'failed');
  for (const value of [JSON.stringify(result), f.output.join('\n')]) {
    assert.ok(!value.includes(env.STRIPE_LAUNCH_KEY));
    assert.ok(!value.includes(env.CLOUDFLARE_API_TOKEN));
  }
  assert.match(result.error, /REDACTED/);
});
