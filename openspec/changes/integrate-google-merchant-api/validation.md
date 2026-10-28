# Local implementation evidence — 2026-10-27

The approved local implementation is complete. Credentials, Google account/source changes, hosted migration/deployment, provider testing and live activation were excluded by the owner. Tasks 3.2 and 3.3 remain open; this change must not be archived as fully accepted.

## Source and checks

Final-review fixes (2026-10-27): current UTC clock slots now control scan cadence, while real-time leases and quota deadlines remain unchanged. Strict Merchant checkout reads inspect provider evaluation details and reject both thrown failures and error results; shopper fallback is unchanged. Focused `pnpm test commerce-persistence`, `pnpm test checkout-core`, and `pnpm test backend-runtime` all passed. Regressions cover unequal scheduler/delivery delays, no missed-slot replay, overlap protection, strict versus shopper flag behavior, and preservation of a managed offer with no Google calls after a failed gate read. The final validation pointer below records the closing repository check for these fixes; earlier fingerprints describe the preceding implementation only.

The first review-fix validation found one test-only lint violation (`consistent-type-imports`); the regression now uses a separate type import. That failed pass and any pass invalidated by this correction are not closing acceptance evidence.

- Checkout: shared `main`, base SHA `09907cddd506413d3527bc41a98b4e8574f33640`. Unrelated dirty Staff and OpenSpec work was preserved. No branch, worktree or commit was created.
- `pnpm openspec:guard` passed before implementation. Strict `pnpm openspec -- validate integrate-google-merchant-api --strict` passed.
- `pnpm test merchant-sync` passed during implementation. Final coordinated validation covers the later recovery and checkout-gate changes.
- `pnpm validate` passed in `mode: local`: 66 tasks succeeded, with 44 cached in its final pass. Summary: [2026-10-27T16-21-01-744Z-33300-3a0626](../../../.codex-artifacts/validation/2026-10-27T16-21-01-744Z-33300-3a0626/summary.json). Matching before/after fingerprint: `0a98167d9f4ccda86b370623b4e43dfe4c7d1e0a996567a7ca27a3d85cdb0d1a`; no source changes remained in that pass.
- The closing check after this evidence and task-state update is linked by the ignored [final validation pointer](../../../.codex-artifacts/validation/merchant-sync-final.json). It records the final whole-tree summary, SHA, matching fingerprints, mode and status without requiring a recursive edit to this evidence file.
- Relevant passing suites: `merchant-sync` 21 tests; `google-merchant` 41; `backend-runtime` 56; `cms-runtime` 175; `commerce-persistence` 78. Existing checkout, stock, orders, CMS integration and boundary/environment checks also passed in the repository run. The runtime suite includes disabling checkout during a scan and independent delivery/Merchant failures.
- `graphify update .` completed locally with AST extraction. Its SQL parser is unavailable, and it reported a pre-existing syntax warning in `scripts/pages-workflow-contract.test.ts`; SQL behavior is covered by the D1 Worker tests, not the graph. No semantic enrichment or paid provider was used.

Earlier attempts are not acceptance evidence: a two-file selector became an inappropriate Vitest filter; Nx plugin startup timed out; one native-RPC run timed out under concurrent work; and the first repository run stopped on formatting while changes were landing. The stable coordinated run passed, including the native-RPC test.

## Behavior covered

Local provider fakes and Worker D1 tests cover accepted snapshots versus missing/incomplete publication, pointer changes, raw pre-order exclusion after exact dates, effective checkout holds, unavailable/removal/reinsertion behavior, omission of unknown identifiers and condition, stable long-ID mapping, fixed EUR conversion, and per-item uncertainty.

The scan tests cover five-candidate fair rotation, fifteen-minute atomic claims, lease fencing, seven-day refresh, and persisted intent before both insertion and deletion. Regressions prove recovery after a lost success receipt, including an update followed by a price reversion and deletion followed by restock. Quota failures defer work to the next noon UTC and require a complete non-exhausted quota check before recovery.

The Google adapter tests validate signed service-account assertions, fixed endpoints, expected test/production account identity, Greece-only free-listing sources, response limits/timeouts, redirect rejection, no immediate retries, safe error classification, and idempotent removal. They use generated test-only key material and fake network responses; no Google account was contacted.

The runtime remains disabled unless explicitly configured; Local never performs Merchant provider work. Production also requires its separate approval setting. Runtime binding propagation clears removed credentials and switches, and a closed checkout makes products ineligible without stopping removal work. No new package dependency, UI, event hook, change detector, queue, cron or automatic product-status polling was added.

## Resource evidence and acceptance limits

The local D1 fixture for five first submissions measured **23 statements, 27 rows read and 18 rows written**. Evidence is the `commerce-persistence` test report and its console output in `C:/Users/SVall/.nx/b86e1106e080a2ea/cache/terminalOutputs/8123472968445929512`. This covers only the Merchant ledger with injected source/provider fakes. Catalog, holds, stock, Stripe, R2, CPU and hosted billing are outside that measurement. The [runbook](../../../docs/merchant-product-sync.md) records source-operation ceilings and the bounded authorized pilot required before activation.

Acceptance-matrix rows selected: CMS/publication read privacy; commerce/checkout/stock authority; module boundaries and runtime configuration. Tests exercise these locally. Shopper UI, player/navigation and Staff interaction changes are not part of this implementation, so no new browser acceptance is claimed. Existing affected browser-component tests ran through repository validation because this shared checkout also contains unrelated work.

Unverified: real credentials and account permissions; Google processing/eligibility; product condition and assigned identifiers; actual quota headroom/hosted CPU and storage use; shipping and return-policy presentation; and production deployment/activation. An API test account cannot prove public serving or real policy approval. Missing identifiers can limit serving, and the approved rotating scan can leave older Google facts visible between passes or during an outage.
