import {
  createLocalJWKSet,
  createRemoteJWKSet,
  customFetch,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JSONWebKeySet,
  type JWTVerifyGetKey,
} from 'jose';
import { describe, expect, it } from 'vitest';

import {
  CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER,
  CF_ACCESS_JWT_ASSERTION_HEADER,
  verifyOperatorAccess,
} from '../../src/interfaces/http/auth';

const ISSUER = 'https://blackbox.cloudflareaccess.com';
const AUDIENCE = 'operator-audience';

describe('verifyOperatorAccess', () => {
  it.each([
    ['http://localhost/api/internal/variants', '  Operator@Example.com  '],
    ['http://127.0.0.1/api/internal/orders', 'operator@example.com'],
  ])('allows configured Local identity on loopback: %s', async (url, configuredEmail) => {
    await expect(
      verifyOperatorAccess(new Request(url), {
        LOCAL_OPERATOR_EMAIL: configuredEmail,
        PRODUCT_ENVIRONMENT: 'LOCAL',
      }),
    ).resolves.toEqual({
      identity: { email: 'operator@example.com' },
      status: 'verified',
    });
  });

  it.each([
    {
      bindings: { LOCAL_OPERATOR_EMAIL: 'operator@example.com', PRODUCT_ENVIRONMENT: 'LOCAL' as const },
      expected: { reason: 'non_loopback_local_request', status: 'unauthorized' },
      url: 'https://backend.example/api/internal/variants',
    },
    {
      bindings: { LOCAL_OPERATOR_EMAIL: 'invalid', PRODUCT_ENVIRONMENT: 'LOCAL' as const },
      expected: { reason: 'invalid_local_identity', status: 'unavailable' },
      url: 'http://localhost/api/internal/variants',
    },
    {
      bindings: { LOCAL_OPERATOR_EMAIL: 'operator@example.com', PRODUCT_ENVIRONMENT: 'UAT' as const },
      expected: { reason: 'invalid_trust_configuration', status: 'unavailable' },
      url: 'https://ops.example/api/internal/variants',
    },
    {
      bindings: { LOCAL_OPERATOR_EMAIL: 'operator@example.com', PRODUCT_ENVIRONMENT: 'PRD' as const },
      expected: { reason: 'invalid_trust_configuration', status: 'unavailable' },
      url: 'https://ops.example/api/internal/variants',
    },
  ])('enforces the Local/hosted policy for $url', async ({ bindings, expected, url }) => {
    await expect(verifyOperatorAccess(new Request(url), bindings)).resolves.toEqual(expected);
  });

  it('verifies RS256 signature, issuer, audience, lifetime, and normalized email', async () => {
    const signer = await createSigner('key-1');
    const token = await signer.sign({ email: 'Operator@Example.com' });

    await expect(verifyHosted(token, createLocalJWKSet({ keys: [signer.jwk] }))).resolves.toEqual({
      identity: { email: 'operator@example.com' },
      status: 'verified',
    });
  });

  it.each([
    ['missing', undefined],
    ['malformed', 'not-a-jwt'],
  ])('rejects a %s assertion', async (_case, token) => {
    const signer = await createSigner('key-1');

    await expect(verifyHosted(token, createLocalJWKSet({ keys: [signer.jwk] }))).resolves.toMatchObject({
      status: 'unauthorized',
    });
  });

  it('rejects a non-RS256 assertion', async () => {
    const token = await new SignJWT({ email: 'operator@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode('test-secret-with-enough-length'));
    const signer = await createSigner('key-1');

    await expect(verifyHosted(token, createLocalJWKSet({ keys: [signer.jwk] }))).resolves.toMatchObject({
      status: 'unauthorized',
    });
  });

  it.each([
    ['bad signature', { signingKey: 'other' }],
    ['wrong issuer', { issuer: 'https://other.cloudflareaccess.com' }],
    ['wrong audience', { audience: 'other-audience' }],
    ['expired', { expirationTime: Math.floor(Date.now() / 1000) - 60 }],
    ['not yet valid', { notBefore: Math.floor(Date.now() / 1000) + 300 }],
    ['missing email', { email: undefined }],
    ['invalid email', { email: 'invalid' }],
  ])('rejects %s', async (_case, overrides) => {
    const trusted = await createSigner('trusted');
    const other = await createSigner('trusted');
    const signer = 'signingKey' in overrides && overrides.signingKey === 'other' ? other : trusted;
    const token = await signer.sign(overrides);

    await expect(verifyHosted(token, createLocalJWKSet({ keys: [trusted.jwk] }))).resolves.toMatchObject({
      status: 'unauthorized',
    });
  });

  it('returns unavailable when JWKS retrieval fails', async () => {
    const signer = await createSigner('key-1');
    const token = await signer.sign({});
    const unavailableResolver: JWTVerifyGetKey = async () => {
      throw new TypeError('network unavailable');
    };

    await expect(verifyHosted(token, unavailableResolver)).resolves.toEqual({
      reason: 'jwks_unavailable',
      status: 'unavailable',
    });
  });

  it('returns unavailable when the remote JWKS endpoint is unusable', async () => {
    const signer = await createSigner('key-1');
    const resolver = createRemoteJWKSet(new URL(`${ISSUER}/cdn-cgi/access/certs`), {
      [customFetch]: async () => new Response('unavailable', { status: 503 }),
    });

    await expect(verifyHosted(await signer.sign({}), resolver)).resolves.toEqual({
      reason: 'jwks_unavailable',
      status: 'unavailable',
    });
  });

  it('refreshes a remote JWKS when the signing key rotates', async () => {
    const first = await createSigner('key-1');
    const second = await createSigner('key-2');
    let keys: JSONWebKeySet = { keys: [first.jwk] };
    let fetchCount = 0;
    const resolver = createRemoteJWKSet(new URL(`${ISSUER}/cdn-cgi/access/certs`), {
      cooldownDuration: 0,
      [customFetch]: async () => {
        fetchCount += 1;
        return Response.json(keys);
      },
    });

    await expect(verifyHosted(await first.sign({}), resolver)).resolves.toMatchObject({ status: 'verified' });
    keys = { keys: [second.jwk] };
    await expect(verifyHosted(await second.sign({}), resolver)).resolves.toMatchObject({ status: 'verified' });
    expect(fetchCount).toBe(2);
  });

  it('ignores a forged forwarded email header', async () => {
    const signer = await createSigner('key-1');
    const token = await signer.sign({ email: 'verified@example.com' });
    const request = hostedRequest(token, {
      [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'attacker@example.com',
    });

    await expect(
      verifyOperatorAccess(request, hostedBindings(), createLocalJWKSet({ keys: [signer.jwk] })),
    ).resolves.toEqual({
      identity: { email: 'verified@example.com' },
      status: 'verified',
    });
  });
});

async function createSigner(kid: string) {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  Object.assign(jwk, { alg: 'RS256', kid, use: 'sig' });

  return {
    jwk,
    async sign(overrides: {
      audience?: string;
      email?: string;
      expirationTime?: number;
      issuer?: string;
      notBefore?: number;
      signingKey?: string;
    }) {
      const payload =
        overrides.email === undefined && 'email' in overrides
          ? {}
          : {
              email: overrides.email ?? 'operator@example.com',
            };
      const jwt = new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', kid })
        .setIssuer(overrides.issuer ?? ISSUER)
        .setAudience(overrides.audience ?? AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(overrides.expirationTime ?? '5m');

      if (overrides.notBefore) {
        jwt.setNotBefore(overrides.notBefore);
      }

      return jwt.sign(privateKey);
    },
  };
}

function hostedBindings() {
  return {
    CF_ACCESS_POLICY_AUD: AUDIENCE,
    CF_ACCESS_TEAM_DOMAIN: ISSUER,
    LOCAL_OPERATOR_EMAIL: 'ignored@example.com',
    PRODUCT_ENVIRONMENT: 'UAT' as const,
  };
}

function hostedRequest(token: string | undefined, extraHeaders: HeadersInit = {}) {
  const headers = new Headers(extraHeaders);

  if (token) {
    headers.set(CF_ACCESS_JWT_ASSERTION_HEADER, token);
  }

  return new Request('https://ops.example/api/internal/variants', { headers });
}

function verifyHosted(token: string | undefined, resolver: JWTVerifyGetKey) {
  return verifyOperatorAccess(hostedRequest(token), hostedBindings(), resolver);
}
