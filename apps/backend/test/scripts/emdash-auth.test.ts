import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const bindings = vi.hoisted(() => ({
  PRODUCT_ENVIRONMENT: 'UAT',
  CF_ACCESS_TEAM_DOMAIN: 'https://emdash-checkpoint.cloudflareaccess.com',
  CF_ACCESS_POLICY_AUD: 'cms-uat-audience',
  CMS_HOSTNAME: 'staff-uat.example',
  CMS_OWNER_EMAIL: 'owner@example.com',
  LOCAL_OPERATOR_EMAIL: 'local@example.com',
}));
vi.mock('cloudflare:workers', () => ({ env: bindings }));
import { authenticate } from '../../src/cms/auth';

const keys = await generateKeyPair('RS256');
beforeAll(async () => {
  const jwk = await exportJWK(keys.publicKey);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => Promise.resolve(Response.json({ keys: [{ ...jwk, kid: 'cms' }] }))),
  );
});
afterAll(() => vi.unstubAllGlobals());

async function token(overrides: Record<string, unknown> = {}, key = keys.privateKey) {
  return new SignJWT({
    email: 'member@example.com',
    exp: Math.floor(Date.now() / 1000) + 300,
    iss: bindings.CF_ACCESS_TEAM_DOMAIN,
    aud: bindings.CF_ACCESS_POLICY_AUD,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'cms' })
    .sign(key);
}
async function request(overrides: Record<string, unknown> = {}) {
  return new Request('https://staff-uat.example/_emdash/api/content/posts', {
    headers: { 'Cf-Access-Jwt-Assertion': await token(overrides) },
  });
}

describe('EmDash identity mapping', () => {
  it('maps verified members and the explicit owner to EmDash roles', async () => {
    await expect(authenticate(await request())).resolves.toMatchObject({ email: 'member@example.com', role: 30 });
    await expect(authenticate(await request({ email: 'owner@example.com' }))).resolves.toMatchObject({ role: 50 });
  });
  it.each([{ exp: 1 }, { iss: 'https://foreign.example' }, { aud: 'prd-audience' }])(
    'rejects invalid hosted claims: %j',
    async (claims) => {
      await expect(authenticate(await request(claims))).rejects.toThrow('Unauthorized');
    },
  );
  it('rejects forged signatures, missing JWTs, forwarded email, and alternate hosts', async () => {
    const foreign = await generateKeyPair('RS256');
    await expect(
      authenticate(
        new Request('https://staff-uat.example/_emdash/api/content/posts', {
          headers: { 'Cf-Access-Jwt-Assertion': await token({}, foreign.privateKey) },
        }),
      ),
    ).rejects.toThrow('Unauthorized');
    await expect(
      authenticate(
        new Request('https://staff-uat.example/', {
          headers: { 'cf-access-authenticated-user-email': 'owner@example.com' },
        }),
      ),
    ).rejects.toThrow('Unauthorized');
    await expect(
      authenticate(
        new Request('https://alias.example/', {
          headers: { 'Cf-Access-Jwt-Assertion': await token() },
        }),
      ),
    ).rejects.toThrow('Unauthorized hostname');
  });
  it('allows the configured Local identity only on loopback', async () => {
    bindings.PRODUCT_ENVIRONMENT = 'LOCAL';
    try {
      await expect(authenticate(new Request('http://127.0.0.1/'))).resolves.toMatchObject({
        email: 'local@example.com',
      });
      await expect(authenticate(new Request('https://alias.example/'))).rejects.toThrow('Unauthorized');
    } finally {
      bindings.PRODUCT_ENVIRONMENT = 'UAT';
    }
    await expect(authenticate(new Request('http://127.0.0.1/'))).rejects.toThrow('Unauthorized hostname');
  });
});
