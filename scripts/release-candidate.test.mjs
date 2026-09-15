import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  cachedFiles,
  validateExceptionContext,
  validateStaticEvidence,
  verifyCachedResponse,
  verifyProviderEvidence,
} from './accept-legacy-retirement.mjs';
import {
  contentPublicationIdentity,
  configuration,
  publicationCodeIdentity,
  refreshedReleaseIdentity,
  inventory,
  observe,
  validateArtifacts,
  validateIdentity,
  validateOrder,
  validatePublicationFreshness,
  validateRun,
  validateWorker,
  verifyFiles,
  waitForDeployment,
} from './release-candidate.mjs';

const sha = 'a'.repeat(40);
const repository = 'example/repository';

test('retirement exception requires explicit dispatch, pinned source, publication and unexpired evidence', () => {
  const source = 'c521b1250a5fb3ec287e8aa2c4976dde4ac10f33';
  const env = {
    CONFIRM_RETIRED_ADMIN_CACHE_EXCEPTION: 'true',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    SOURCE_SHA: source,
    GITHUB_RUN_ID: '123',
  };
  const release = {
    sha: source,
    runId: '123',
    content: { snapshotSha256: 'a6ad24d148046c1aef2c1e3d2a8206168bf26a707da867207adb8bc87bfc3cef' },
  };
  const now = Date.parse('2026-09-15T12:00:00Z');
  validateExceptionContext(env, release, now);
  for (const key of Object.keys(env))
    assert.throws(() => validateExceptionContext({ ...env, [key]: '' }, release, now));
  assert.throws(() => validateExceptionContext(env, { ...release, content: {} }, now));
  assert.throws(() => validateExceptionContext(env, release, Date.parse('2026-09-23T00:00:00Z')));
});

test('retirement exception allows only exact retired-route failures and retains other static gates', () => {
  const evidence = Object.entries({ public_assets: 6, checkout_shell: 1, public_routes: 23 }).map(
    ([scenario, count]) => ({
      scenario,
      siteUrl: 'https://blackbox-records-web-uat.pages.dev',
      environment: 'uat',
      readOnly: true,
      consoleErrors: [],
      pageErrors: [],
      checks: Array.from({ length: count }, (_, index) => ({ path: `/page-${index}/`, status: 200, issues: [] })),
    }),
  );
  const routes = evidence[2].checks;
  for (const [index, route] of Object.keys(cachedFiles).entries()) {
    routes[index] = {
      path: route,
      status: 200,
      expectedStatus: 404,
      issues: [`Retired route ${route} must return 404; received 200.`],
    };
  }
  assert.deepEqual(validateStaticEvidence(evidence), Object.keys(cachedFiles));
  for (const mutate of [
    (copy) => {
      copy[0].checks[0].status = 500;
    },
    (copy) => {
      copy[2].checks[0].issues.push('Unexpected error');
    },
    (copy) => {
      copy[2].checks[0].status = 403;
    },
    (copy) => {
      copy[1].pageErrors.push('Runtime failure');
    },
    (copy) => {
      copy[2].checks.pop();
    },
  ]) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.throws(() => validateStaticEvidence(copy));
  }
  for (const check of routes.slice(0, 5)) {
    check.status = 404;
    check.issues = [];
  }
  assert.deepEqual(validateStaticEvidence(evidence), []);
});

test('retirement exception rejects missing provider evidence and changed or uncached legacy bodies', async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'retirement-evidence-'));
  try {
    assert.throws(() => verifyProviderEvidence(directory));
    mkdirSync(path.join(directory, 'resend-uat/20260915105500'), { recursive: true });
    writeFileSync(path.join(directory, 'resend-uat/20260915105500/evidence.json'), '{"status":"passed"}');
    assert.throws(() => verifyProviderEvidence(directory), /evidence changed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  await verifyCachedResponse('/admin/', new Response(null, { status: 404 }));
  await assert.rejects(
    verifyCachedResponse('/admin/', new Response('changed', { headers: { 'cf-cache-status': 'HIT' } })),
  );
  await assert.rejects(verifyCachedResponse('/admin/', new Response('legacy')));
  await assert.rejects(verifyCachedResponse('/unexpected/', new Response(null, { status: 404 })));
});

test('rejects promotion when combined CMS configuration differs from the candidate', () => {
  const config = configuration();
  const candidate = { schema: 2, sha, runId: '123', runNumber: 10, configuration: config };
  const current = { sha, runId: '123', runNumber: 10 };
  for (const field of ['cmsResources', 'cmsBuild']) {
    assert.match(config[field], /^[0-9a-f]{64}$/);
    assert.throws(() => validateIdentity(candidate, current, { ...config, [field]: 'changed' }));
  }
  assert.ok(Object.keys(config.cmsMigrations).includes('0001_publications.sql'));
  assert.throws(() => validateIdentity(candidate, current, { ...config, cmsMigrations: {} }));
});

test('refreshes an artifact at the same reviewed code SHA while retaining target publication identity', () => {
  const code = { sha, runId: '456', runNumber: 11 };
  const content = {
    publicationId: '12345678-1234-4234-8234-123456789012',
    ciRunId: '123',
    snapshotSha256: 'b'.repeat(64),
  };
  assert.deepEqual(refreshedReleaseIdentity(code, content), { ...code, content });
  assert.deepEqual(refreshedReleaseIdentity(code, null), code);
  assert.throws(() => refreshedReleaseIdentity(code, { ...content, snapshotSha256: '' }));
});

test('code promotion cannot replace newer target content with an old artifact', () => {
  const content = { publicationId: 'one', ciRunId: '123', snapshotSha256: 'a'.repeat(64) };
  validatePublicationFreshness({}, null);
  validatePublicationFreshness({ content }, { content });
  assert.throws(() => validatePublicationFreshness({}, { content }), /refresh the artifact/);
  assert.throws(
    () => validatePublicationFreshness({ content: { ...content, publicationId: 'old' } }, { content }),
    /refresh the artifact/,
  );
});

test('publication metadata preserves deployed code identity while replacing only content identity', () => {
  const code = { sha, runId: '123', runNumber: 10, content: { old: true }, private: 'omit' };
  const content = {
    publicationId: '12345678-1234-4234-8234-123456789012',
    ciRunId: '456',
    snapshotSha256: 'b'.repeat(64),
    token: 'omit',
  };
  assert.deepEqual(contentPublicationIdentity(code, content, sha), {
    sha,
    runId: '123',
    runNumber: 10,
    content: { publicationId: content.publicationId, ciRunId: '456', snapshotSha256: content.snapshotSha256 },
  });
  assert.throws(() => contentPublicationIdentity(code, content, 'c'.repeat(40)), /selected deployed code/);
  for (const invalid of [{ publicationId: '../private' }, { ciRunId: 'main' }, { snapshotSha256: 'bad' }])
    assert.throws(() => contentPublicationIdentity(code, { ...content, ...invalid }, sha));
});
const run = {
  head_sha: sha,
  status: 'completed',
  conclusion: 'success',
  path: '.github/workflows/pages.yml',
  head_branch: 'main',
  event: 'push',
  repository: { full_name: repository },
  head_repository: { full_name: repository },
};

test('publication selects canonical deployed code independently of a newer UAT candidate', () => {
  const current = { sha, runId: '123', runNumber: 10 };
  const releaseRun = { ...run, id: 123, run_number: 10 };
  const project = {
    name: 'blackbox-records-web',
    canonical_deployment: {
      environment: 'production',
      latest_stage: { name: 'deploy', status: 'success' },
      deployment_trigger: { metadata: { commit_hash: sha, branch: 'main' } },
    },
  };
  assert.deepEqual(publicationCodeIdentity(project, current, releaseRun, 'prd', repository), current);
  const invalid = [
    { name: 'blackbox-records-web-uat' },
    { canonical_deployment: { ...project.canonical_deployment, environment: 'preview' } },
    { canonical_deployment: { ...project.canonical_deployment, latest_stage: { name: 'deploy', status: 'failure' } } },
    {
      canonical_deployment: {
        ...project.canonical_deployment,
        deployment_trigger: { metadata: { commit_hash: 'b'.repeat(40), branch: 'main' } },
      },
    },
  ];
  for (const patch of invalid)
    assert.throws(() => publicationCodeIdentity({ ...project, ...patch }, current, releaseRun, 'prd', repository));
  for (const patch of [{ id: 124 }, { run_number: 11 }, { conclusion: 'failure' }, { event: 'pull_request' }])
    assert.throws(() => publicationCodeIdentity(project, current, { ...releaseRun, ...patch }, 'prd', repository));
});

test('post-deployment propagation checks retry within a fixed attempt budget', async () => {
  let attempts = 0;
  const pause = async () => {};
  await waitForDeployment(async () => {
    if (++attempts === 1) throw new Error('Previous edge revision');
  }, pause);
  assert.equal(attempts, 2);
  attempts = 0;
  await assert.rejects(
    waitForDeployment(async () => {
      attempts += 1;
      throw new Error('Still mismatched');
    }, pause),
    /Still mismatched/,
  );
  assert.equal(attempts, 12);
});

test('partial deployment evidence retains the Worker revision when Pages is unavailable', async () => {
  const candidate = {
    sha,
    runId: '123',
    runNumber: 10,
    configuration: { uatBackend: 'https://api.example.com', uatSite: 'https://uat.example.com' },
  };
  const result = await observe(candidate, 'uat', async (url) =>
    url.includes('/api/')
      ? new Response('{}', { headers: { 'X-Release-SHA': sha, 'X-Release-Run-Number': '10' } })
      : new Response('', { status: 503 }),
  );
  assert.equal(result.worker.sha, sha);
  assert.deepEqual(result.frontend, { unavailable: 'HTTP 503' });
});

test('only a successful trusted main candidate with the selected SHA is accepted', () => {
  validateRun(run, sha, repository);
  for (const patch of [
    { head_sha: 'b'.repeat(40) },
    { conclusion: 'failure' },
    { status: 'in_progress' },
    { path: '.github/workflows/other.yml' },
    { head_branch: 'feature' },
    { event: 'pull_request' },
    { repository: { full_name: 'foreign/repo' } },
    { head_repository: { full_name: 'fork/repo' } },
  ]) {
    assert.throws(() => validateRun({ ...run, ...patch }, sha, repository));
  }
  assert.throws(() => validateRun(run, 'main', repository));
});

test('superseded UAT, mixed revisions and changed config cannot authorize promotion', () => {
  const configuration = { site: 'https://uat.example.com' };
  const candidate = { schema: 2, sha, runId: '123', runNumber: 10, configuration };
  const current = { sha, runId: '123', runNumber: 10 };
  validateIdentity(candidate, current, configuration);
  for (const patch of [{ sha: 'b'.repeat(40) }, { runId: '124' }, { runNumber: 11 }]) {
    assert.throws(() => validateIdentity(candidate, { ...current, ...patch }, configuration));
  }
  assert.throws(() => validateIdentity(candidate, current, { site: 'https://changed.example.com' }));
  validateOrder(candidate, null);
  validateOrder(candidate, current);
  assert.throws(() => validateOrder(candidate, { ...current, runNumber: 11 }));
  validateWorker(candidate, new Response('{}', { headers: { 'X-Release-SHA': sha, 'X-Release-Run-Number': '10' } }));
  assert.throws(() =>
    validateWorker(candidate, new Response('{}', { headers: { 'X-Release-SHA': sha, 'X-Release-Run-Number': '11' } })),
  );
  assert.throws(() =>
    validateWorker(
      candidate,
      new Response('{}', { headers: { 'X-Release-SHA': 'b'.repeat(40), 'X-Release-Run-Number': '10' } }),
    ),
  );
});

test('retained artifact verification rejects missing and modified files', (context) => {
  validateArtifacts([{ name: `release-${sha}`, expired: false }], sha);
  assert.throws(() => validateArtifacts([{ name: `release-${sha}`, expired: true }], sha));
  assert.throws(() => validateArtifacts([{ name: `release-${'b'.repeat(40)}`, expired: false }], sha));
  const directory = mkdtempSync(path.join(os.tmpdir(), 'blackbox-release-'));
  context.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    rmSync(directory, { recursive: true });
  });
  const files = {};
  for (const target of ['uat/public', 'prd/public', 'uat/worker', 'prd/cms', 'migrations']) {
    mkdirSync(`${directory}/${target}`, { recursive: true });
    writeFileSync(`${directory}/${target}/artifact`, sha);
    if (target === 'uat/worker' || target === 'prd/cms') {
      for (const file of [
        'server/wrangler.json',
        'server/entry.mjs',
        'client/content/index.html',
        'client/items/index.html',
        'client/stock/index.html',
      ]) {
        mkdirSync(path.dirname(`${directory}/${target}/${file}`), { recursive: true });
        writeFileSync(`${directory}/${target}/${file}`, sha);
      }
    }
    files[target] = inventory(`${directory}/${target}`);
  }
  assert.throws(() => verifyFiles({ schema: 1, files }, directory), /fresh candidate/);
  verifyFiles({ schema: 2, files }, directory);
  writeFileSync(`${directory}/prd/public/artifact`, 'tampered');
  assert.throws(() => verifyFiles({ schema: 2, files }, directory), /digest mismatch/);
  writeFileSync(`${directory}/prd/public/artifact`, sha);
  rmSync(`${directory}/prd/cms`, { recursive: true });
  assert.throws(() => verifyFiles({ schema: 2, files }, directory), /Missing combined CMS artifact/);
});
