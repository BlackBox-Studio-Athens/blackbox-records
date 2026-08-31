## Why

Internal routes currently trust a forwarded email header without proving Cloudflare Access authenticated the request. Operator access needs one small, cryptographically verified Google-login boundary that is independent from Decap editorial authentication.

## What Changes

- Protect all /api/internal/* routes with one Hono middleware.
- Verify Cloudflare Access assertions with direct jose 6.2.3 usage: createRemoteJWKSet and jwtVerify.
- Require RS256, configured issuer and audience, valid lifetime, and a normalized email claim.
- Derive operator identity only from verified JWT claims and ignore the forwarded email header.
- Use a separate Cloudflare Access Google login for operator routes; it may share the same Google identities and allowlist as Decap but does not reuse Decap tokens, cookies, or code.
- Keep one explicit Local loopback identity path and fail closed elsewhere.
- Return generic no-store 401 for invalid identity and 503 when verification infrastructure is unavailable.
- Do not add custom JWT parsing, custom JWKS caching, OAuth code, sessions, roles, or an authorization framework.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- orders-stock-operator: Hosted operator identity requires a verified Access JWT before internal route work.
- environment-model: Local bypass and hosted Access trust configuration are explicit Product Environment rules.

## Impact

- Backend dependency declaration, Worker bindings, shared Hono middleware/context, internal stock and order handlers, actor attribution, OpenAPI error responses, deployment preflight, and focused tests.
- Public shopper, Stripe webhook, Decap, newsletter, and services routes remain outside this boundary.
