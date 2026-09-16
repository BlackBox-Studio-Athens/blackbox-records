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
const bindings = project.deployment_configs.production.services ?? {};
const service = `blackbox-records-public-${target}`;
if (bindings.PUBLIC_SITE?.service !== service)
  await request('PATCH', {
    deployment_configs: {
      production: { services: { ...bindings, PUBLIC_SITE: { service, environment: 'production' } } },
    },
  });
assert.equal((await request('GET')).deployment_configs.production.services.PUBLIC_SITE.service, service);
console.log(`${target.toUpperCase()} Pages public renderer binding verified.`);
