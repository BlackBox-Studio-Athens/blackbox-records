## Context

The approved production-only operator hostname is not yet provisioned. PRD uses `staff.blackboxrecordsathens.com`; UAT has no operator hostname and remains a main-site review environment. Once the PRD provider topology exists, Cloudflare Access will provide Google login and an email allowlist at the operator hostname. The PRD Worker must still verify the signed Access assertion because workers.dev or another route can bypass the hostname policy. UAT internal routes remain fail-closed without Access trust configuration. DecapBridge authentication is a separate editorial system and must not become runtime operator authentication.

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

### Use one production staff hostname

PRD uses `staff.blackboxrecordsathens.com`, a subdomain of the existing managed zone that requires no new domain registration. UAT has no staff hostname or hosted operator portal.

Admin changes are verified locally before deployment, then accepted through one protected PRD proof. Provisioning DNS, same-origin static and Worker routing, Zero Trust, and the Access application remains provider-topology work that must exist before that proof can begin.

### Protect the entire staff hostname

The Access application protects `staff.blackboxrecordsathens.com/*`, including `/`, `/stock/`, `/api/internal/*`, and future staff routes. It has no public path exceptions. Shopper-facing content remains on the main public hostname.

`/stock/` is the only initial human-facing staff page. The hostname root redirects to `/stock/`; future staff pages require separate approval. The Decap `/admin/` editorial surface remains outside this staff portal and keeps its independent authentication boundary.

### Use a dedicated staff Pages deployment

`separate-staff-astro-app` moves `/stock/` out of `apps/web` into an independent static `apps/staff` Astro application and deploys its artifact to the dedicated `blackbox-records-staff` Cloudflare Pages project. That change owns source, build, route, artifact, and deployment separation; this change consumes the completed staff deployment for Access configuration and hosted JWT proof.

Provider handoff completed September 2, 2026: production Pages project `blackbox-records-staff` serves the verified staff artifact at `https://blackbox-records-staff.pages.dev/`. Initial deployment `483d4e8d-cdd1-4d0a-9a7e-798f344d5326` uses branch `main` and source commit `270d89e95cd12b2c3f4e26cc24f2562223d388bf`. No custom domain, Worker route, Access policy, or PRD trust secret was attached during this handoff.

Keep `/api/internal/*` on the existing PRD Worker and route it through the staff hostname so the browser uses one origin. No new orchestration library, Astro server adapter, Pages Function, or proxy backend is required.

### Use Cloudflare Zero Trust Free

The account uses the Cloudflare Zero Trust Free plan for operator access. Its current 50-seat ceiling is sufficient for the approved staff allowlist. Revisit the plan only if Cloudflare changes the plan terms or operator access must exceed that ceiling.

### Prefer the concise Zero Trust team name

Use `blackboxrecords` as the preferred Cloudflare Zero Trust team name. If that globally unique name is unavailable during provider setup, use `blackboxrecordsathens`. The resulting `*.cloudflareaccess.com` team domain is a technical trust issuer, not the public staff hostname.

### Use a separate Cloudflare Access Google login

The operator hostname keeps its own Access application with Google as the only identity provider. The initial allowlist contains one shared label Google account for operational simplicity. It may use the same approved Google identity as Decap, but the authentication boundaries remain independent:

- Decap credentials authorize editorial CMS work.
- Access assertions authorize runtime stock and order operations.

No token, cookie, callback, or auth helper crosses between them.

The shared identity means audit records identify the label account rather than an individual operator. Replace it with individually allowlisted Google accounts before per-person accountability is required.

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

PRD requires:

- CF_ACCESS_TEAM_DOMAIN as the exact HTTPS issuer;
- CF_ACCESS_POLICY_AUD as the exact operator Access application audience.

The JWKS URL is derived only from the configured issuer at /cdn-cgi/access/certs. Token claims never select an outbound URL. Missing or malformed PRD configuration produces unavailable before route work. UAT does not configure these trust anchors while it has no operator surface, so internal requests there also fail unavailable before route work.

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

- [Access configuration is wrong] → Preflight presence and verify one real PRD login before deployment acceptance.
- [No hosted UAT operator acceptance] → Keep automated and Local security coverage, then perform one no-net audited PRD proof before completion.
- [Shared Google identity obscures the individual operator] → Accept for the initial single-account workflow; move to individual allowlisted accounts when per-person accountability is required.
- [JWKS is temporarily unavailable] → Let jose use its valid cache; otherwise fail closed with 503.
- [Local settings are deployed] → Require both Product Environment Local and loopback hostname.
- [A future route bypasses middleware] → Mount the complete /api/internal/* router beneath one middleware and test the route set.

## Migration Plan

1. Add direct jose dependency and typed trust configuration.
2. Implement the verifier result and Local branch with focused unit tests.
3. Mount one middleware above the internal router and remove all direct header parsing.
4. Revise runtime preflight so UAT without an operator surface does not require Access trust anchors and remains fail-closed for internal requests.
5. After provider topology provisions `staff.blackboxrecordsathens.com`, configure its PRD Access issuer/audience and verify allowed and bypass requests with one no-net audited mutation.

Rollback reverts middleware while internal APIs remain closed or are redeployed. It must not restore forwarded-email trust as a temporary fallback.
