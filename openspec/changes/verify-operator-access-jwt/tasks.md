## 1. Dependency and Trust Configuration

- [x] 1.1 Run `pnpm openspec:guard`, verify `align-cloudflare-environment-names` is complete and archived, then add jose 6.2.3 as a direct backend dependency; verify the lockfile has one compatible jose resolution and trust config uses only Local/UAT/PRD names.
- [x] 1.2 Add validated CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_POLICY_AUD, and Local-only LOCAL_OPERATOR_EMAIL bindings; verify hosted profiles cannot select the Local branch.
- [x] 1.3 Confirm the operator Access application uses Google and the approved allowlist independently from Decap; verify no Decap credential or callback enters backend runtime config.
- [x] 1.4 Extend runtime config verification so Local requires its loopback operator identity and UAT/PRD require both Access trust values before hosted proof can begin.

## 2. One Verified Identity Boundary

- [x] 2.1 Implement the discriminated verified/unauthorized/unavailable result using createRemoteJWKSet and jwtVerify with RS256, configured issuer/audience, lifetime, and normalized email checks.
- [x] 2.2 Add the loopback-only Local result and verify Local plus non-loopback, UAT, and PRD combinations are exhaustive.
- [x] 2.3 Mount one typed Hono middleware above /api/internal/*, derive actor identity only from verified context, and delete direct forwarded-email parsing; verify public and webhook routes remain outside it.
- [x] 2.4 Map invalid identity to generic no-store 401 and unavailable trust/JWKS to generic no-store 503; verify route services and D1 are untouched on rejection.

## 3. Compact Security Verification

- [x] 3.1 Add focused jose-backed tests for valid token, missing/malformed token, non-RS256, bad signature, wrong issuer/audience, expired/not-yet-valid token, missing/invalid email, JWKS failure, and key rotation.
- [x] 3.2 Add table-driven Local/hosted policy tests and one integration test over the registered internal route set; verify actor audit email comes only from the JWT claim and the forwarded header is ignored.
- [x] 3.3 Verify logs and responses contain no assertion, claims, key, trust value, or full email.

## 4. Hosted Proof and Completion

- [ ] 4.1 Configure UAT trust values, then use Browser Use to prove an allowlisted operator can read and perform one audited mutation through the protected hostname.
- [ ] 4.2 Probe workers.dev and every reachable UAT hostname without a valid assertion and with a forged forwarded email; verify denial before D1 access.
- [ ] 4.3 Run `pnpm generate:api` if contracts changed, `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm openspec -- validate verify-operator-access-jwt --strict`; archive the change only after the exact UAT proof tree passes.
