import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

import { productEnvironmentSchema, type AppBindings, type OperatorIdentity } from '../../../env';

export const CF_ACCESS_JWT_ASSERTION_HEADER = 'Cf-Access-Jwt-Assertion';
export const CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER = 'cf-access-authenticated-user-email';

type OperatorAccessReason =
  | 'invalid_environment'
  | 'invalid_local_identity'
  | 'invalid_token'
  | 'invalid_trust_configuration'
  | 'jwks_unavailable'
  | 'missing_token'
  | 'non_loopback_local_request';

export type OperatorAccessResult =
  | { status: 'verified'; identity: OperatorIdentity }
  | { status: 'unauthorized'; reason: OperatorAccessReason }
  | { status: 'unavailable'; reason: OperatorAccessReason };

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
const audienceSchema = z.string().trim().min(1);
const remoteJwks = new Map<string, JWTVerifyGetKey>();

export async function verifyOperatorAccess(
  request: Request,
  bindings: Pick<
    AppBindings,
    'CF_ACCESS_POLICY_AUD' | 'CF_ACCESS_TEAM_DOMAIN' | 'LOCAL_OPERATOR_EMAIL' | 'PRODUCT_ENVIRONMENT'
  >,
  keyResolver?: JWTVerifyGetKey,
): Promise<OperatorAccessResult> {
  const environment = productEnvironmentSchema.safeParse(bindings.PRODUCT_ENVIRONMENT);

  if (!environment.success) {
    return { status: 'unavailable', reason: 'invalid_environment' };
  }

  if (environment.data === 'LOCAL') {
    if (!isLoopbackHostname(new URL(request.url).hostname)) {
      return { status: 'unauthorized', reason: 'non_loopback_local_request' };
    }

    const email = emailSchema.safeParse(bindings.LOCAL_OPERATOR_EMAIL);

    return email.success
      ? { status: 'verified', identity: { email: email.data } }
      : { status: 'unavailable', reason: 'invalid_local_identity' };
  }

  const trust = parseHostedTrust(bindings);

  if (!trust) {
    return { status: 'unavailable', reason: 'invalid_trust_configuration' };
  }

  const assertion = request.headers.get(CF_ACCESS_JWT_ASSERTION_HEADER)?.trim();

  if (!assertion) {
    return { status: 'unauthorized', reason: 'missing_token' };
  }

  try {
    const { payload } = await jwtVerify(assertion, keyResolver ?? remoteKeyResolver(trust.issuer), {
      algorithms: ['RS256'],
      audience: trust.audience,
      issuer: trust.issuer,
    });
    const email = emailSchema.safeParse(payload.email);

    return email.success
      ? { status: 'verified', identity: { email: email.data } }
      : { status: 'unauthorized', reason: 'invalid_token' };
  } catch (error) {
    if (
      error instanceof errors.JWKSTimeout ||
      error instanceof errors.JWKSInvalid ||
      error instanceof errors.JWKInvalid ||
      error?.constructor === errors.JOSEError ||
      !(error instanceof errors.JOSEError)
    ) {
      return { status: 'unavailable', reason: 'jwks_unavailable' };
    }

    return { status: 'unauthorized', reason: 'invalid_token' };
  }
}

function parseHostedTrust(
  bindings: Pick<AppBindings, 'CF_ACCESS_POLICY_AUD' | 'CF_ACCESS_TEAM_DOMAIN'>,
): { audience: string; issuer: string } | null {
  const audience = audienceSchema.safeParse(bindings.CF_ACCESS_POLICY_AUD);
  const issuer = parseHttpsOrigin(bindings.CF_ACCESS_TEAM_DOMAIN);

  return audience.success && issuer ? { audience: audience.data, issuer } : null;
}

function parseHttpsOrigin(value: string | undefined): string | null {
  try {
    const url = new URL(value ?? '');

    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function remoteKeyResolver(issuer: string): JWTVerifyGetKey {
  const jwksUrl = new URL('/cdn-cgi/access/certs', issuer).href;
  let resolver = remoteJwks.get(jwksUrl);

  if (!resolver) {
    resolver = createRemoteJWKSet(new URL(jwksUrl));
    remoteJwks.set(jwksUrl, resolver);
  }

  return resolver;
}
