## Context

Cloudflare Access already provides Google login and an email allowlist at the operator hostname. The Worker must still verify the signed Access assertion because workers.dev or another route can bypass the hostname policy. DecapBridge authentication is a separate editorial system and must not become runtime operator authentication.

## Goals / Non-Goals

**Goals:**

- Authenticate every hosted internal request once before any D1 read or mutation.
- Make verified operator identity the only type handlers can receive.
- Reuse a maintained JWT library already present transitively.
- Preserve deterministic Local development without a hosted bypass.

**Non-Goals:**

- Decap token reuse, custom Google OAuth, shopper login, sessions, roles, or permissions.
- Hand-written JWT/base64/RSA code or a custom JWKS cache.
- Comparing or trusting cf-access-authenticated-user-email.

## Decisions

### Use a separate Cloudflare Access Google login

The operator hostname keeps its own Access application and Google login. It may use the same approved Google accounts and allowlist as Decap, but the authentication boundaries remain independent:

- Decap credentials authorize editorial CMS work.
- Access assertions authorize runtime stock and order operations.

No token, cookie, callback, or auth helper crosses between them.

### Add jose as a direct backend dependency

Declare the already resolved jose 6.2.3 package directly. Build the remote key set from the configured Access issuer and call jwtVerify with:

- algorithms limited to RS256;
- exact configured issuer;
- exact configured Access application audience;
- normal exp and nbf validation;
- a required normalized email claim.

createRemoteJWKSet owns key caching, cooldown, and rotation retrieval. The Worker adds no parser, WebCrypto wrapper, key store, or refresh state.

Alternative: custom Worker WebCrypto verification. Rejected because it duplicates security-sensitive standard behavior and creates more invalid intermediate states.

### Use one closed authentication result

The verifier returns a discriminated result:

- verified with OperatorIdentity;
- unauthorized with a safe internal reason;
- unavailable with a safe internal reason.

The Hono middleware converts the two failure variants to generic no-store 401 or 503 responses. Only the verified branch stores OperatorIdentity in typed Hono context. Internal handlers accept that typed context and cannot read Access headers directly.

The forwarded email header is ignored. Actor email always comes from the verified assertion claim.

### Keep trust anchors configured

Hosted UAT and PRD require:

- CF_ACCESS_TEAM_DOMAIN as the exact HTTPS issuer;
- CF_ACCESS_POLICY_AUD as the exact operator Access application audience.

The JWKS URL is derived only from the configured issuer at /cdn-cgi/access/certs. Token claims never select an outbound URL. Missing or malformed hosted configuration produces unavailable before route work.

### Keep Local bypass narrow

JWT-free Local identity is allowed only when all three are true:

1. Product Environment is Local;
2. request hostname is localhost or 127.0.0.1;
3. LOCAL_OPERATOR_EMAIL is configured and valid.

UAT and PRD ignore LOCAL_OPERATOR_EMAIL. A Local profile on any non-loopback hostname is unauthorized.

### Keep failures generic and logs redacted

Invalid/missing token, signature, claims, algorithm, audience, or email returns generic 401. Missing trust config or unusable JWKS retrieval returns generic 503. Both are no-store and execute no route service.

Logs contain only route family and a safe reason. They never contain assertion text, claims, keys, audience, issuer, or full email.

## Risks / Trade-offs

- [Access configuration is wrong] → Preflight presence and verify one real UAT login before deployment acceptance.
- [JWKS is temporarily unavailable] → Let jose use its valid cache; otherwise fail closed with 503.
- [Local settings are deployed] → Require both Product Environment Local and loopback hostname.
- [A future route bypasses middleware] → Mount the complete /api/internal/* router beneath one middleware and test the route set.

## Migration Plan

1. Add direct jose dependency and typed trust configuration.
2. Implement the verifier result and Local branch with focused unit tests.
3. Mount one middleware above the internal router and remove all direct header parsing.
4. Configure UAT Access issuer/audience and verify allowed and bypass requests.
5. Add PRD trust configuration only as part of operator-host readiness; this change does not open PRD operations.

Rollback reverts middleware while internal APIs remain closed or are redeployed. It must not restore forwarded-email trust as a temporary fallback.
