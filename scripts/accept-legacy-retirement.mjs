import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = 'c521b1250a5fb3ec287e8aa2c4976dde4ac10f33';
const site = 'https://blackbox-records-web-uat.pages.dev';
const digest = (body) => createHash('sha256').update(body).digest('hex');
const providerFiles = {
  'resend-uat/20260915105500/evidence.json': '4fa745690a06ff5a5d0866139dff631032e1ef8a8c617393606c889e470790d9',
  'stripe-sandbox/20260915105234/happy_path_paid/evidence.json':
    '41612a42f4fd448c8085520cd4f3f83a42831ae0f80bc8b92eb0235ed52d35b4',
  'stripe-sandbox/20260915105234/pay_what_you_want_paid/evidence.json':
    '0dc998c4244b26930bb1858c540dcd62dd901925aee61cb77b91466e34196064',
};
export const cachedFiles = {
  '/admin/': '37c53de20334e0e6d5f0fdcdb5d2af87e0a47242cce1ff042336c8c0c0e89700',
  '/admin/config.yml': '5730ce199efedfb2cb19ebf18a0f580992341e8e3f2748ae731f8ce17ed4a4b3',
  '/admin/init.js': '2e924cd149f71e34e87b3d9830e7d543adfdf55d55acddde8236873e3ebfc7f6',
  '/admin/admin.css': '751c9c576ce5db9de9c231105881ff3b644d8bf95aedc3f402c7089dc11b1c17',
  '/admin/preview.css': '844b4418bfc067edc3a6af8f358c04a1295e12a2afc91b6ae0965930e7c7ab5b',
};

// ponytail: one expiring, source-pinned operator exception, not a general release waiver mechanism.
export function validateExceptionContext(env, release, now = Date.now()) {
  assert.equal(env.CONFIRM_RETIRED_ADMIN_CACHE_EXCEPTION, 'true', 'Explicit cache exception approval required.');
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch');
  assert.equal(env.SOURCE_SHA, source, 'Provider evidence applies only to the reviewed source.');
  assert.equal(release.sha, source);
  assert.equal(String(release.runId), env.GITHUB_RUN_ID);
  assert.ok(now < Date.parse('2026-09-22T10:46:49Z'), 'Retirement exception evidence expired.');
  assert.equal(
    release.content?.snapshotSha256,
    'a6ad24d148046c1aef2c1e3d2a8206168bf26a707da867207adb8bc87bfc3cef',
    'UAT publication changed; provider evidence cannot be reused.',
  );
}

export function verifyProviderEvidence(directory) {
  for (const [file, expected] of Object.entries(providerFiles)) {
    const bytes = readFileSync(path.join(directory, file));
    assert.equal(digest(bytes), expected, `Prior provider evidence changed: ${file}`);
    const evidence = JSON.parse(bytes);
    assert.ok(evidence.passed === true || evidence.status === 'passed', `Provider check did not pass: ${file}`);
  }
}

export function validateStaticEvidence(evidence) {
  assert.deepEqual(evidence.map((entry) => entry.scenario).sort(), [
    'checkout_shell',
    'public_assets',
    'public_routes',
  ]);
  const waived = [];
  for (const entry of evidence) {
    assert.equal(entry.siteUrl, site);
    assert.equal(entry.environment, 'uat');
    assert.equal(entry.readOnly, true);
    assert.deepEqual(entry.consoleErrors, []);
    assert.deepEqual(entry.pageErrors, []);
    assert.equal(entry.checks.length, { public_assets: 6, checkout_shell: 1, public_routes: 23 }[entry.scenario]);
    for (const check of entry.checks) {
      if (entry.scenario === 'public_routes' && Object.hasOwn(cachedFiles, check.path) && check.status === 200) {
        assert.equal(check.expectedStatus, 404);
        assert.deepEqual(check.issues, [`Retired route ${check.path} must return 404; received 200.`]);
        waived.push(check.path);
      } else {
        assert.equal(check.status, check.expectedStatus ?? 200, `Non-cache failure: ${check.path}`);
        assert.deepEqual(check.issues, [], `Non-cache failure: ${check.path}`);
      }
    }
  }
  assert.equal(new Set(waived).size, waived.length);
  return waived;
}

export async function verifyCachedResponse(route, response) {
  assert.ok(Object.hasOwn(cachedFiles, route));
  if (response.status === 404) return;
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cf-cache-status'), 'HIT', 'Only existing cached legacy responses are waived.');
  assert.equal(digest(Buffer.from(await response.arrayBuffer())), cachedFiles[route], 'Cached legacy body changed.');
}

async function main() {
  const release = JSON.parse(readFileSync('.codex-artifacts/release/uat/public/release.json', 'utf8'));
  validateExceptionContext(process.env, release);
  verifyProviderEvidence('.codex-artifacts/legacy-provider-evidence');
  const { runUatStaticSmoke, parseUatStaticSmokeArgs } = await import(
    pathToFileURL(path.resolve('scripts/smoke-uat-static.ts')).href
  );
  const evidence = await runUatStaticSmoke(parseUatStaticSmokeArgs(['--scenario', 'all']));
  const waived = validateStaticEvidence(evidence);
  for (const route of waived) {
    await verifyCachedResponse(
      route,
      await fetch(site + route, { redirect: 'error', signal: AbortSignal.timeout(15_000) }),
    );
  }
  const receipt = {
    acceptedWithDocumentedCacheException: true,
    source,
    candidateRunId: process.env.GITHUB_RUN_ID,
    providerEvidenceRunId: '34958898685',
    providerFiles,
    waived,
    generatedAt: new Date().toISOString(),
    outstanding: 'Verify natural cache expiry separately; no 404 failure has been marked passed.',
  };
  writeFileSync('.codex-artifacts/smoke/uat/retirement-exception.json', JSON.stringify(receipt, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `\nApproved retirement cache exception: ${JSON.stringify(receipt)}\n`,
    );
  }
  console.log(JSON.stringify(receipt));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
