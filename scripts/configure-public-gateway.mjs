import assert from 'node:assert/strict';
const target = process.argv[2];
assert.ok(['uat', 'prd'].includes(target));
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
assert.match(account ?? '', /^[a-f0-9]{32}$/);
assert.ok(process.env.CLOUDFLARE_API_TOKEN);
const name = `blackbox-records-web${target === 'uat' ? '-uat' : ''}`;
const url = `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${name}`;
const headers = { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' };
async function request(method, body) {
  const response = await fetch(url, {
    method,
    headers,
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
    redirect: 'error',
  });
  assert.ok(response.ok, `Pages configuration failed (${response.status}).`);
  const result = await response.json();
  assert.equal(result.success, true, 'Pages configuration failed.');
  return result.result;
}
const project = await request('GET');
assert.equal(project.name, name);
// Read-only credential check: a release fails here, before any migration, when the Pages token is unusable.
if (process.argv[3] === '--check') {
  console.log(`${target.toUpperCase()} Pages credential verified.`);
  process.exit(0);
}
const bindings = project.deployment_configs.production.services ?? {};
const service = `blackbox-records-public-${target}`;
if (bindings.PUBLIC_SITE?.service !== service)
  await request('PATCH', {
    deployment_configs: {
      production: { services: { ...bindings, PUBLIC_SITE: { service, environment: 'production' } } },
    },
  });
const configured = (await request('GET')).deployment_configs.production;
assert.equal(configured.services.PUBLIC_SITE.service, service);
// HOST-11: the API rejects fail_open in a PATCH, so the project setting is kept in the dashboard and guarded here.
assert.equal(
  configured.fail_open,
  false,
  `Set ${name} Settings > Runtime > Fail open/closed to "Fail closed" in the Cloudflare dashboard.`,
);
console.log(`${target.toUpperCase()} Pages renderer binding and fail-closed mode verified.`);
