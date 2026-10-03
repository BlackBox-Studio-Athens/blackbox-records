# PERF-006: Hosted delivery implementation

Date: 2026-10-03. Baseline: `e818b709a2364aa29dfd54cadcd0433779a1f263`; recovered integration base: `fe099b01cea42266cdf21c2318851af361db1210`. Product Environment: Local emulation only. UAT/PRD and providers were not contacted.

## Implemented and locally verified

- Canonical media-SHA sources, live plus three recent accepted snapshots, bounded widths and stable text-only publication URLs. Compatibility `/_image` preserves verified short-lived originals on transform failure.
- Direct Images URLs preserve default WebP, WebP68 editorial art, WebP40 blur and JPEG metadata. Repo ESM images/`_astro` and favicons bypass Pages Function work. Native browser fallback clears responsive candidates and requests the canonical original once.
- A release-generated route allowlist returns static `no-store` 404s without rendering. Gateway forwards Accept and optional If-None-Match and preserves asset bytes.
- SQLite HTML reuse survives actor restart with an 8 MiB byte LRU/2 MiB entry ceiling, indexed eviction, single-flight pointer refresh, weak ETags/304/HEAD, lazy snapshot parsing and separate cache-only public/publication instances. `eeur` is best effort.
- Runtime activation refreshes the exact accepted pointer in `public-v2` through a private default-entrypoint service call, then purges publication-tagged HTML from that entrypoint. Refresh epochs prevent old reads overwriting activation. Failed or lost purge receipts keep accepted content intact and confirmation pending for idempotent retry. Local alone can proceed without an edge cache API; UAT/PRD require purge success.
- SSR-only execution ordering and fail-closed bundle/image checks against locally rendered documents and the actual client asset root run before copying release artifacts.
- Hosted purchase-information reads the current owner override. A validated synthetic accepted snapshot includes explicit local test wording; the actual SSR renderer emits that wording in hosted inline JSON. Static Local output retains its existing separate reader behavior.

The actual local UAT-shaped build and Wrangler capture are recorded in `.codex-artifacts/performance-resume/hosted-fixture.json`, `hosted-documents/capture.json`, `hosted-bundles.json`, `build-hosted-fixture.log`, `capture-hosted-fixture.log` and `hosted-build-gates.log`. Capture verifies snapshot/media checksums and release response identities, renders representative pages and overlay fragments, and stops its isolated emulator. It creates no hosted publication. Image-byte gate values use labelled local Sharp models from verified media, not observed Cloudflare transformations.

Worker tests prove restart reuse, byte LRU, ETags, 304, single-flight refresh, recent media eligibility, canonical source/options and legacy handling. Gateway tests prove binary favicon identity, allowlists, forbidden paths and header forwarding. Final source-bound repository evidence is in [validation.md](validation.md).

## Cost and unresolved limits

The [Free-tier rule](../../../docs/cloudflare-free-tier.md) keeps the shared 5,000 monthly transformation allowance. The conservative emitted/compatibility ceiling is 53 source/options combinations per media SHA per environment: 17 default WebP, 17 editorial WebP68, one blur, one JPEG and 17 legacy auto. Actual monthly use includes the union of prior configurations/removed media and both environments; the builder ceiling is not a provider abuse control.

The local gateway model budgets two Worker invocations per document visit, cold or warm. Direct browser Images URLs remove per-image Pages requests, but Images source-cache fills and original fallbacks still add origin requests. There is no local account-wide usage, cache-hit or hosted per-page-view measurement; the authorized pilot must measure it.

Tag purge is documented as Free-available and activation is now wired to the default renderer's tagged cache. Worker tests cover the actual D1/R2 activation and real DO RPC/selection/persisted HTML; only the provider purge result is controlled. The installed emulator lacks a native purge API even with production cache configuration, so global purge propagation is unverified. Parent tests verify actual default-handler behavior for both Local and UAT. HTML keeps the existing 30 s freshness plus 30 s revalidation window. No longer TTL, paid plan, new KV binding or provider/zone configuration is introduced.

The retained CI/static publication route verifies a deployed Pages identity and updates journal receipts; it does not activate the runtime R2 pointer. Software releases retain version-scoped caching. That separate path is unchanged and is not counted as runtime purge coverage. `purge-result.md`, `purge-final-focused.log`, `purge-parent-focused.log`, `purge-local-entrypoint.log` and `purge-runtime-capability.json` retain the bounded tests and emulator limitation; final repository evidence supersedes earlier slice fingerprints after parent integration.

The cross-zone direct URL cannot use Images' same-zone redirect fallback. JavaScript browsers have the native handler; JavaScript-disabled browsers and metadata crawlers remain unverified on quota exhaustion. The owner must accept or separately amend that delivery limitation.

The owner-authorized UAT pilot, account-wide usage/headroom, real formats/bytes/cache status/Age/304, actual location, PRD promotion and apex `image_transform` smoke remain open. Fail-open versus fail-closed static fallback is documented without selecting a new policy. Conditional predecessor reconciliation and archival remain pending. This report records local implementation, not release acceptance.
