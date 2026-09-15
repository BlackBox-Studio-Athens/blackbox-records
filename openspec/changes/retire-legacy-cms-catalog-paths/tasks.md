## 1. Remove obsolete execution paths

- [x] 1.1 Remove Sveltia routes, assets, tooling and configuration; verify retired-route smoke and source scans.
- [x] 1.2 Remove compiled catalog and automatic generation; verify diagnostic fixtures and runtime reader tests without the manifest.
- [x] 1.3 Restrict source-derived catalog writes to explicit recovery commands; verify deployment contract tests prohibit routine seeds/sync.
- [x] 1.4 Require combined CMS release artifacts and remove staff Pages deployment; verify manifest compatibility, digests and workflow tests.

## 2. Regression and documentation

- [x] 2.1 Verify runtime-only items, current prices, recovery preservation, published distro, draft privacy and publication ordering through existing focused tests.
- [x] 2.2 Reconcile EmDash baseline specs, module ownership and current runbooks; validate OpenSpec strictly.
- [x] 2.3 Run unit/check/build/unused and combined CMS/KV checks; verify canonical Local stack preserves publication state without manifest generation.

## 3. Release and external retirement

Historical candidate `34958898685` deployed cleanup SHA `c521b1250a5fb3ec287e8aa2c4976dde4ac10f33` to UAT but failed retired-route acceptance because Cloudflare still served five cached admin resources as HTTP 200. It remains failed; do not bypass it with cache-busting assertions. See `docs/cms-retirement.md` for the separately accepted replacement.

The operator subsequently approved a documented stale-cache-only exception. A new successful candidate may reuse pinned passing provider evidence for that same source and publication, with fresh email-free static checks and exact cached-body verification. The original candidate remains failed. Natural cache expiry stays explicitly outstanding and is not a completed 404 check.

- [x] 3.1 Inventory exact external resources and recovery artifacts; record IDs, consumers and retirement eligibility without exposing secrets.
- [x] 3.2 Accept a fresh UAT candidate, promote that exact combined release and verify public/staff behavior with checkout disabled.
- [ ] 3.3 Retire confirmed Sveltia resources and detached staff Pages project; verify live Worker hostname/Access and record actual deletion receipts.
- [ ] 3.4 Complete retirement evidence and final spec validation; report any unresolved hosted work explicitly.

Candidate `34963650477` passed and PRD promotion `34965404366` succeeded with unchanged publication and commerce fingerprints. Worker `sveltia-cms-auth`, detached staff Pages and three legacy repository settings are deleted and verified absent. Task 3.3 still awaits OAuth application deletion confirmation. Natural cache verification remains outside completed acceptance under the explicitly approved stale-cache-only exception; no purge was performed.
