import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchWithUatAccess, uatAccessHeaders } from './uat-access.mjs';

const env = { UAT_ACCESS_CLIENT_ID: 'test-client', UAT_ACCESS_CLIENT_SECRET: 'test-secret' };
const site = 'https://blackbox-records-web-uat.pages.dev';

test('Access secrets apply only to the UAT Pages production and preview hosts', () => {
  for (const url of [site, 'https://abc.blackbox-records-web-uat.pages.dev'])
    assert.equal(uatAccessHeaders(url, env)['CF-Access-Client-Secret'], env.UAT_ACCESS_CLIENT_SECRET);
  for (const url of [
    'https://blackbox-records-web.pages.dev',
    'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
    'https://checkout.stripe.com',
    `${site}.example.com`,
    site.replace('https:', 'http:'),
    `${site}:8443`,
  ])
    assert.deepEqual(uatAccessHeaders(url, env), {});
  assert.deepEqual(uatAccessHeaders(site, {}), {});
  assert.throws(() => uatAccessHeaders(site, { UAT_ACCESS_CLIENT_ID: 'id' }), /both/);
});

test('authenticated HTTP reads preserve request options and never follow redirects with credentials', async () => {
  const calls = [];
  const request = async (url, init) => {
    calls.push({ url, init });
    return new Response(null, { status: 302, headers: { Location: 'https://untrusted.example/' } });
  };
  await assert.rejects(
    fetchWithUatAccess(site, { headers: { Accept: 'application/json' } }, request, env),
    /redirected/,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.redirect, 'manual');
  assert.equal(calls[0].init.headers.get('Accept'), 'application/json');
  assert.equal(calls[0].init.headers.get('CF-Access-Client-Secret'), env.UAT_ACCESS_CLIENT_SECRET);
});

test('public backend requests receive no Access credentials', async () => {
  const init = { method: 'OPTIONS', headers: { Origin: site } };
  await fetchWithUatAccess(
    'https://api.example.com',
    init,
    async (_url, actual) => {
      assert.deepEqual(actual, init);
      return new Response();
    },
    env,
  );
});

test('a missing service token cannot turn an Access sign-in redirect into a successful release read', async () => {
  await assert.rejects(
    fetchWithUatAccess(
      site,
      {},
      async (_url, init) => {
        assert.equal(init.redirect, 'manual');
        return new Response(null, { status: 302, headers: { Location: 'https://team.cloudflareaccess.com/' } });
      },
      {},
    ),
    /redirected/,
  );
});
