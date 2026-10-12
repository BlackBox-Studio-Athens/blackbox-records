import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { setTimeout as pause } from 'node:timers/promises';
import { validateRun, validateSuites } from '../release-candidate.mjs';
import { verifyImageFallback } from './image-fallback.mjs';

export const apex = 'https://blackboxrecordsathens.com';
export const pages = 'https://blackbox-records-web.pages.dev';
const host = new URL(apex).hostname;
const project = 'blackbox-records-web';
const listName = 'blackbox_prd_launch';
const ruleRef = 'blackbox_prd_launch';
const day = 24 * 60 * 60 * 1000;
const workers = ['blackbox-records-backend-prd', 'blackbox-records-public-prd'];
const repository = 'BlackBox-Studio-Athens/blackbox-records';
const manualLinks = [
  'https://search.google.com/search-console/sitemaps',
  `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(`${apex}/`)}`,
  `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(apex)}`,
  'https://www.linkedin.com/post-inspector/',
];

export function loadLaunchEnvironment(root, shell = process.env) {
  const file = path.join(root, '.env.launch');
  return { ...(existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {}), ...shell };
}

export function finalizeReady(snapshot, now = Date.now()) {
  assert.ok(snapshot?.cutoverAt && !snapshot.rolledBackAt, 'Finalize requires a successful, unrolled-back cutover.');
  const ready = Date.parse(snapshot.cutoverAt) + day;
  assert.ok(Number.isFinite(ready), 'Invalid cutover timestamp.');
  assert.ok(now >= ready, `Finalize is available after ${new Date(ready).toISOString()}.`);
}

function writeJson(file, value, exclusive = false) {
  mkdirSync(path.dirname(file), { recursive: true });
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (exclusive) return writeFileSync(file, text, { flag: 'wx', mode: 0o600 });
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, text, { mode: 0o600 });
  renameSync(temporary, file);
}

export async function runLaunch(
  stage,
  {
    dryRun = false,
    root = process.cwd(),
    env = loadLaunchEnvironment(root),
    fetch = globalThis.fetch,
    now = Date.now,
    sleep = pause,
    imageFallback = verifyImageFallback,
    github = (endpoint) =>
      JSON.parse(
        execFileSync('gh', ['api', endpoint], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        }),
      ),
    log = console.log,
  } = {},
) {
  const started = new Date(now()).toISOString();
  const directory = path.join(root, '.codex-artifacts/launch');
  const snapshotFile = path.join(directory, 'snapshot.json');
  const validStage = ['cutover', 'finalize', 'rollback'].includes(stage);
  const summaryFile = path.join(
    directory,
    validStage ? stage : 'invalid',
    `${started.replaceAll(':', '-')}-${randomUUID()}`,
    'summary.json',
  );
  const summary = { stage, dryRun, started, status: 'running', steps: [], requests: 0, publicRequests: 0 };
  const secrets = ['CLOUDFLARE_API_TOKEN', 'STRIPE_LAUNCH_KEY', 'BING_WEBMASTER_API_KEY']
    .map((name) => env[name])
    .filter(Boolean);
  const redact = (value) =>
    secrets
      .reduce((text, secret) => text.replaceAll(secret, '[REDACTED]'), String(value))
      .replace(/(?:[sr]k_(?:live|test)|whsec)_[A-Za-z0-9_]+/g, '[REDACTED]');
  const print = (message) => log(redact(message));
  const step = async (name, work) => {
    try {
      const result = await work();
      summary.steps.push({ name, status: 'passed' });
      print(`${name}: passed`);
      return result;
    } catch (error) {
      summary.steps.push({ name, status: 'failed', error: redact(error.message) });
      throw error;
    }
  };
  const plan = (message) => {
    summary.steps.push({ name: message, status: 'planned' });
    print(`Would ${message}`);
  };
  const countRequest = (publicRead = false) => {
    assert.ok(++summary.requests <= 200, 'Launch request ceiling reached.');
    if (publicRead) assert.ok(++summary.publicRequests <= 100, 'Public request ceiling reached.');
  };
  const request = async (url, init = {}, publicRead = false) => {
    countRequest(publicRead);
    assert.ok(!dryRun || !init.method || ['GET', 'HEAD'].includes(init.method), 'Dry-run refused an external write.');
    try {
      return await fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(20_000) });
    } catch {
      throw new Error(`Request failed for ${new URL(url).origin}; inspect TLS, connectivity and credentials.`);
    }
  };
  const account = env.CLOUDFLARE_ACCOUNT_ID;
  const zone = env.CLOUDFLARE_ZONE_ID;
  const cfAccount = `/accounts/${account}`;
  const cfZone = `/zones/${zone}`;
  const api = async (pathname, method = 'GET', body, optional = false) => {
    const response = await request(`https://api.cloudflare.com/client/v4${pathname}`, {
      method,
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (optional && response.status === 404) return null;
    assert.ok(response.ok, `Cloudflare ${method} ${pathname}: HTTP ${response.status}.`);
    const data = await response.json();
    assert.equal(data.success, true, `Cloudflare rejected ${method} ${pathname}.`);
    return data.result;
  };
  const stripe = async (pathname) => {
    const response = await request(`https://api.stripe.com/v1${pathname}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_LAUNCH_KEY}` },
    });
    assert.ok(response.ok, `Stripe readiness read: HTTP ${response.status}.`);
    return response.json();
  };
  const json = async (url) => {
    const response = await request(url, {}, true);
    assert.equal(response.status, 200, 'Release identity read failed.');
    return response.json();
  };
  const accountRedirectPath = `${cfAccount}/rulesets/phases/http_request_redirect/entrypoint`;
  const domainsPath = `${cfAccount}/pages/projects/${project}/domains`;
  const listsPath = `${cfAccount}/rules/lists`;
  let lock;
  let snapshot;
  const saveSnapshot = () => writeJson(snapshotFile, snapshot);
  const dnsBody = ({ name, type, content, ttl, proxied, comment, tags, settings }) => ({
    name,
    type,
    content,
    ttl,
    proxied,
    ...(comment === undefined ? {} : { comment }),
    ...(tags ? { tags } : {}),
    ...(settings ? { settings } : {}),
  });
  const readDns = async (name) => {
    const records = await api(`${cfZone}/dns_records?name=${encodeURIComponent(name)}&per_page=100`);
    assert.equal(records.length, 1, `Expected exactly one ${name} DNS record.`);
    return records[0];
  };
  const verifyHome = async () => {
    const domain = await api(`${domainsPath}/${host}`);
    assert.equal(domain.status, 'active', 'Pages apex TLS is not active.');
    const response = await request(`${apex}/`, {}, true);
    assert.equal(response.status, 200, 'Home did not return HTTP 200.');
    assert.equal(
      response.headers.get('X-Release-SHA'),
      snapshot.release.sha,
      'Home is not the selected full-site release.',
    );
    return response.text();
  };
  const redirectRule = {
    ref: ruleRef,
    action: 'redirect',
    enabled: true,
    description: 'BlackBox PRD launch redirect',
    expression: `http.request.full_uri in $${listName}`,
    action_parameters: { from_list: { name: listName, key: 'http.request.full_uri' } },
  };
  const redirectItem = {
    redirect: {
      source_url: `${project}.pages.dev/`,
      target_url: `${apex}/`,
      status_code: 301,
      include_subdomains: true,
      subpath_matching: true,
      preserve_path_suffix: true,
      preserve_query_string: true,
    },
  };
  const rollback = async () => {
    const current = await readDns(host);
    assert.equal(current.id, snapshot.apex.id, 'Apex DNS identity changed; reconcile it before rollback.');
    assert.ok(
      [snapshot.apex.content, `${project}.pages.dev`].includes(current.content),
      'Apex DNS drifted outside this launch.',
    );
    const currentRules = await api(accountRedirectPath, 'GET', undefined, true);
    const rule = currentRules?.rules?.find((item) => item.ref === ruleRef);
    if (rule) {
      assert.equal(rule.action_parameters?.from_list?.name, listName, 'Launch redirect drifted.');
      await api(`${cfAccount}/rulesets/${currentRules.id}/rules/${rule.id}`, 'DELETE');
    }
    const lists = await api(listsPath);
    const list = lists.find((item) => item.name === listName);
    if (list) {
      assert.ok(
        !snapshot.lists.some((item) => item.id === list.id),
        'Refusing to remove a pre-existing redirect list.',
      );
      await api(`${listsPath}/${list.id}`, 'DELETE');
    }
    await api(`${cfZone}/dns_records/${snapshot.apex.id}`, 'PATCH', dnsBody(snapshot.apex));
    const restored = await readDns(host);
    assert.equal(restored.content, snapshot.apex.content, 'Apex DNS was not restored.');
    snapshot.rolledBackAt = new Date(now()).toISOString();
    saveSnapshot();
    if (!snapshot.finalizedAt) {
      const response = await request(`${apex}/`, {}, true);
      assert.equal(response.status, 200, 'Restored Holding Page is unavailable.');
      assert.match(await response.text(), /noindex/i, 'Restored apex does not identify the Holding Page.');
    }
  };
  const verifySite = async (html) => {
    const failures = [];
    const check = async (name, work) => {
      try {
        await step(name, work);
      } catch (error) {
        failures.push(error.message);
      }
    };
    await check('Apex metadata', async () => {
      const canonical = /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i.exec(html)?.[1];
      const og = /<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)/i.exec(html)?.[1];
      assert.equal(canonical, `${apex}/`, 'Home canonical is not the apex.');
      assert.equal(og, `${apex}/`, 'Home og:url is not the apex.');
    });
    for (const pathname of [
      '/terms/',
      '/privacy/',
      '/assets/images/brand/share-card.jpg',
      '/assets/images/brand/logo-horizontal.png',
    ]) {
      await check(pathname, async () => {
        const response = await request(`${apex}${pathname}`, {}, true);
        assert.equal(response.status, 200, `Apex ${pathname} failed.`);
        const type = response.headers.get('Content-Type') ?? '';
        assert.ok(
          type.startsWith(pathname.startsWith('/assets/') ? 'image/' : 'text/html'),
          `Wrong content at ${pathname}.`,
        );
        await response.body?.cancel();
      });
    }
    await check('Sitemap and robots', async () => {
      const response = await request(`${apex}/sitemap.xml`, {}, true);
      assert.equal(response.status, 200, 'Sitemap failed.');
      const sitemap = await response.text();
      const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
      assert.ok(
        locations.length && locations.every((url) => new URL(url).origin === apex),
        'Sitemap contains another origin.',
      );
      const robots = await request(`${apex}/robots.txt`, {}, true);
      assert.equal(robots.status, 200, 'robots.txt failed.');
      const text = await robots.text();
      assert.ok(
        text.includes(`${apex}/sitemap.xml`) && !/Disallow:\s*\/\s*$/m.test(text),
        'robots.txt blocks launch or names another sitemap.',
      );
    });
    await check('HTTP and www canonical redirects', async () => {
      for (const origin of [`http://${host}`, `http://www.${host}`, `https://www.${host}`]) {
        const response = await request(`${origin}/terms/?launch=1`, {}, true);
        assert.equal(response.status, 308, 'Canonical redirect must return 308.');
        assert.equal(response.headers.get('Location'), `${apex}/terms/?launch=1`, 'Redirect lost path/query.');
        await response.body?.cancel();
      }
    });
    await check('Apex API', async () => {
      const response = await request(`${apex}/api/store/capabilities`, {}, true);
      assert.equal(response.status, 200, 'Apex API failed.');
      assert.equal(response.headers.get('X-Release-SHA'), snapshot.release.sha, 'API release differs.');
      await response.body?.cancel();
    });
    if (dryRun) plan('run controlled browser image-fallback acceptance after real cutover');
    else
      await check('Browser image fallback', async () => {
        summary.imageFallback = await imageFallback({ html, origin: apex, countRequest: () => countRequest(true) });
      });
    assert.equal(failures.length, 0, 'Launch checks failed; inspect the step results.');
  };
  try {
    assert.ok(validStage, 'Select cutover, finalize or rollback.');
    mkdirSync(directory, { recursive: true });
    lock = openSync(path.join(directory, 'launch.lock'), 'wx');
    assert.match(account ?? '', /^[a-f0-9]{32}$/, 'Set CLOUDFLARE_ACCOUNT_ID.');
    assert.match(zone ?? '', /^[a-f0-9]{32}$/, 'Set CLOUDFLARE_ZONE_ID.');
    assert.ok(env.CLOUDFLARE_API_TOKEN, 'Set CLOUDFLARE_API_TOKEN.');
    if (existsSync(snapshotFile)) {
      snapshot = JSON.parse(readFileSync(snapshotFile, 'utf8'));
      assert.equal(snapshot.account, account, 'Snapshot belongs to another account.');
      assert.equal(snapshot.zone, zone, 'Snapshot belongs to another zone.');
    }
    if (stage === 'rollback') {
      assert.ok(snapshot, 'No launch snapshot exists.');
      if (dryRun) plan('remove only the launch Bulk Redirect and restore the recorded apex DNS');
      else await step('Restore launch snapshot', rollback);
    } else {
      if (stage === 'finalize') await step('24-hour rollback window', async () => finalizeReady(snapshot, now()));
      await step('Cloudflare credential and target', async () => {
        const token = await api('/user/tokens/verify');
        assert.equal(token.status, 'active', 'Cloudflare token is not active.');
        const details = await api(cfZone);
        assert.equal(details.name, host, 'Wrong Cloudflare zone.');
        assert.equal(details.account.id, account, 'Wrong Cloudflare account.');
      });
      assert.match(env.STRIPE_LAUNCH_KEY ?? '', /^rk_live_/, 'Set a restricted live STRIPE_LAUNCH_KEY.');
      await step('Stripe webhook and browser-reviewed policies', async () => {
        const stripeAccount = await stripe('/account');
        const review = JSON.parse(readFileSync(path.join(directory, 'stripe-dashboard-review.json'), 'utf8'));
        assert.equal(review.accountId, stripeAccount.id, 'Stripe review belongs to another account.');
        const age = now() - Date.parse(review.reviewedAt);
        assert.ok(age >= 0 && age <= day, 'Refresh the Stripe Dashboard review in Chrome before launch.');
        assert.equal(review.website, `${apex}/`);
        assert.equal(review.terms, `${apex}/terms/`);
        assert.equal(review.privacy, `${apex}/privacy/`);
        assert.equal(review.displayLegalPolicies, true);
        const endpoints = await stripe('/webhook_endpoints?limit=100');
        assert.equal(endpoints.has_more, false, 'Webhook inventory exceeds the bounded launch read.');
        const matches = endpoints.data.filter(
          (endpoint) =>
            endpoint.url === `${apex}/api/stripe/webhooks` &&
            endpoint.status === 'enabled' &&
            endpoint.livemode === true,
        );
        assert.equal(matches.length, 1, 'Expected one enabled live apex webhook.');
      });
      const release = await step('Accepted PRD release', async () => {
        const release = await json(`${pages}/release.json`);
        assert.match(release.sha ?? '', /^[a-f0-9]{40}$/);
        assert.equal(release.publicationMode, 'runtime');
        assert.match(release.content?.snapshotSha256 ?? '', /^[a-f0-9]{64}$/);
        const run = github(`repos/${repository}/actions/runs/${release.runId}`);
        validateRun(run, release.sha, repository);
        assert.equal(run.run_number, Number(release.runNumber));
        validateSuites(github(`repos/${repository}/actions/runs/${release.runId}/jobs?per_page=100`).jobs);
        const response = await request(`${pages}/`, {}, true);
        assert.equal(response.status, 200, 'PRD readiness Home is unavailable.');
        assert.equal(response.headers.get('X-Release-SHA'), release.sha, 'PRD Home release differs.');
        await response.body?.cancel();
        return release;
      });
      summary.release = release;
      if (stage === 'cutover') {
        assert.ok(!snapshot, 'A launch snapshot already exists; inspect or rollback that run before a new cutover.');
        snapshot = await step('Read rollback snapshot', async () => ({
          version: 1,
          account,
          zone,
          release,
          recordedAt: started,
          apex: await readDns(host),
          www: await readDns(`www.${host}`),
          zoneRedirects: await api(
            `${cfZone}/rulesets/phases/http_request_dynamic_redirect/entrypoint`,
            'GET',
            undefined,
            true,
          ),
          accountRedirects: await api(accountRedirectPath, 'GET', undefined, true),
          lists: await api(listsPath),
          domains: await api(domainsPath),
        }));
        assert.equal(snapshot.apex.type, 'CNAME', 'Expected the approved apex CNAME.');
        assert.equal(snapshot.apex.content, `holding.${project}.pages.dev`, 'Apex is not on the Holding Page alias.');
        assert.equal(snapshot.apex.proxied, true, 'Apex must remain proxied.');
        assert.ok(!snapshot.lists.some((list) => list.name === listName), 'Launch list name is already in use.');
        assert.ok(
          !snapshot.accountRedirects?.rules?.some((rule) => rule.ref === ruleRef),
          'Launch rule reference is already in use.',
        );
        assert.ok(
          snapshot.domains.some((domain) => domain.name === host && domain.status === 'active'),
          'Apex custom domain is not active.',
        );
        if (dryRun) {
          plan(`save the rollback snapshot and point ${host} at ${project}.pages.dev`);
          plan(
            'verify TLS, Home, policy/brand assets, metadata, sitemap, redirects, image fallback and API; restore on failed TLS/Home',
          );
        } else {
          writeJson(snapshotFile, snapshot, true);
          // A lost PATCH response may still have changed DNS: include the write itself in critical recovery.
          try {
            await step('Switch apex DNS', () =>
              api(`${cfZone}/dns_records/${snapshot.apex.id}`, 'PATCH', {
                ...dnsBody(snapshot.apex),
                content: `${project}.pages.dev`,
              }),
            );
            const html = await step('TLS and Home', async () => {
              for (let attempt = 0; attempt < 12; attempt += 1) {
                try {
                  return await verifyHome();
                } catch (error) {
                  if (attempt === 11) throw error;
                  await sleep(5000);
                }
              }
            });
            snapshot.cutoverAt = new Date(now()).toISOString();
            saveSnapshot();
            await verifySite(html);
          } catch (error) {
            if (!snapshot.cutoverAt) await step('Automatic rollback after critical failure', rollback);
            throw error;
          }
        }
        if (env.BING_WEBMASTER_API_KEY) {
          if (dryRun) plan('submit the apex sitemap to Bing');
          else
            await step('Bing sitemap submission', async () => {
              const response = await request(
                `https://ssl.bing.com/webmaster/api.svc/json/SubmitSiteMap?apikey=${encodeURIComponent(env.BING_WEBMASTER_API_KEY)}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ siteUrl: `${apex}/`, feedUrl: `${apex}/sitemap.xml` }),
                },
              );
              assert.ok(response.ok, 'Bing sitemap submission failed.');
              await response.body?.cancel();
            });
        }
        for (const link of manualLinks) print(link);
      } else {
        assert.equal(release.sha, snapshot.release.sha, 'PRD source changed since cutover; review stability again.');
        await step('Stripe artwork retirement readiness', async () => {
          const products = await stripe('/products?active=true&limit=100');
          assert.equal(products.has_more, false, 'Product inventory exceeds the bounded launch read.');
          const images = new Set(products.data.flatMap((product) => product.images));
          for (const image of images) {
            const url = new URL(image);
            assert.ok(
              url.origin === apex &&
                /^\/media\/(published|content)\/[a-f0-9]{64}$/.test(url.pathname) &&
                !url.search &&
                !url.hash,
              'Migrate active Stripe product artwork to apex runtime media before finalization.',
            );
            const response = await request(image, { method: 'HEAD' }, true);
            assert.equal(response.status, 200, 'Stripe artwork is unavailable on the apex.');
            assert.ok(response.headers.get('Content-Type')?.startsWith('image/'), 'Stripe artwork is not an image.');
            await response.body?.cancel();
          }
        });
        await verifySite(await step('Stable TLS and Home', verifyHome));
        for (const worker of workers) await api(`${cfAccount}/workers/scripts/${worker}/subdomain`);
        const hsts = await api(`${cfZone}/settings/security_header`);
        if (dryRun) {
          plan('create the Pages Bulk Redirect (301, subpaths, subdomains, preserve path/query)');
          plan('disable both PRD workers.dev addresses and verify they stop answering');
          plan('enable six-month HSTS including subdomains, without preload; verify apex and staff');
        } else {
          await step('Pages Bulk Redirect', async () => {
            let list = (await api(listsPath)).find((item) => item.name === listName);
            if (!list)
              list = await api(listsPath, 'POST', {
                name: listName,
                kind: 'redirect',
                description: 'BlackBox PRD launch',
              });
            const existing = await api(`${listsPath}/${list.id}/items?per_page=100`);
            assert.ok(existing.length <= 1, 'Launch redirect list drifted.');
            if (!existing.length) {
              const operation = await api(`${listsPath}/${list.id}/items`, 'POST', [redirectItem]);
              assert.ok(operation.operation_id, 'Missing redirect operation identity.');
              for (let attempt = 0; attempt < 12; attempt += 1) {
                const status = await api(`${cfAccount}/rules/lists/bulk_operations/${operation.operation_id}`);
                if (status.status === 'completed') break;
                assert.ok(status.status !== 'failed' && attempt < 11, 'Redirect list operation failed or timed out.');
                await sleep(1000);
              }
            } else assert.deepEqual(existing[0].redirect, redirectItem.redirect, 'Launch redirect item drifted.');
            const ruleset = await api(accountRedirectPath, 'GET', undefined, true);
            const rule = ruleset?.rules?.find((item) => item.ref === ruleRef);
            if (rule) assert.deepEqual(rule.action_parameters, redirectRule.action_parameters, 'Launch rule drifted.');
            else if (ruleset) await api(`${cfAccount}/rulesets/${ruleset.id}/rules`, 'POST', redirectRule);
            else
              await api(`${cfAccount}/rulesets`, 'POST', {
                name: 'Account redirects',
                kind: 'root',
                phase: 'http_request_redirect',
                rules: [redirectRule],
              });
            for (const origin of [pages, `https://holding.${project}.pages.dev`]) {
              const response = await request(`${origin}/terms/?launch=1`, {}, true);
              assert.equal(response.status, 301, 'Pages redirect failed.');
              assert.equal(
                response.headers.get('Location'),
                `${apex}/terms/?launch=1`,
                'Pages redirect lost path/query.',
              );
              await response.body?.cancel();
            }
          });
          await step('Disable PRD workers.dev', async () => {
            for (const worker of workers) {
              await api(`${cfAccount}/workers/scripts/${worker}/subdomain`, 'POST', {
                enabled: false,
                previews_enabled: false,
              });
              assert.equal((await api(`${cfAccount}/workers/scripts/${worker}/subdomain`)).enabled, false);
              const response = await request(`https://${worker}.blackboxrecordsathens.workers.dev/`, {}, true);
              assert.ok([404, 410].includes(response.status), 'Disabled workers.dev still answers.');
              await response.body?.cancel();
            }
          });
          await step('Enable and verify HSTS', async () => {
            await api(`${cfZone}/settings/security_header`, 'PATCH', {
              value: {
                ...hsts.value,
                strict_transport_security: {
                  ...hsts.value.strict_transport_security,
                  enabled: true,
                  max_age: 15768000,
                  include_subdomains: true,
                  preload: false,
                },
              },
            });
            for (const origin of [apex, 'https://staff.blackboxrecordsathens.com']) {
              const response = await request(`${origin}/`, {}, true);
              const value = response.headers.get('Strict-Transport-Security') ?? '';
              assert.match(value, /max-age=15768000/);
              assert.match(value, /includeSubDomains/i);
              assert.ok(!/preload/i.test(value), 'HSTS must not request preload.');
              await response.body?.cancel();
            }
          });
          snapshot.finalizedAt = new Date(now()).toISOString();
          saveSnapshot();
        }
      }
    }
    summary.status = dryRun ? 'planned' : 'passed';
  } catch (error) {
    summary.status = 'failed';
    summary.error = redact(error.message);
    print(summary.error);
  } finally {
    if (lock !== undefined) {
      closeSync(lock);
      unlinkSync(path.join(directory, 'launch.lock'));
    }
    summary.finished = new Date(now()).toISOString();
    writeJson(summaryFile, JSON.parse(redact(JSON.stringify(summary))));
    print(`Launch summary: ${path.relative(root, summaryFile)}`);
  }
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  if (args.includes('--help')) console.log('pnpm launch:switch -- <cutover|finalize|rollback> [--dry-run]');
  else if (args.slice(1).some((arg) => arg !== '--dry-run')) {
    console.error('Unknown launch option. Use --help.');
    process.exitCode = 1;
  } else {
    const result = await runLaunch(args[0], { dryRun: args.includes('--dry-run') });
    if (result.status === 'failed') process.exitCode = 1;
  }
}
