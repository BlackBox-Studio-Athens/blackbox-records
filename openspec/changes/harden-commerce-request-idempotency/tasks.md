## 1. Confirm low-volume scope and existing guarantees

- [ ] 1.1 Run `pnpm openspec:guard`, reuse accepted EmDash/runtime-publication receipts and confirm RFC 9457 acceptance; reconcile current checkout/stock contracts and audit remaining retry gaps, preserving item/price/publication journals, accepted monetary policy and paid-order/outbox recovery without closing separate hosted acceptance.
- [ ] 1.2 Record a before-change Local duplicate-submit/acknowledgement-loss reproduction for uncovered checkout and stock operations; verify which effects repeat and omit any proposed mechanism already supplied by the completed epic.

## 2. Add durable checkout retry identity

- [ ] 2.1 Reuse existing order monetary/line fields and add only missing nullable digest/fingerprint/replay fields and scoped uniqueness through additive Prisma/D1 migrations; verify Local compatibility, duplicate constraints and unchanged historical records, without a second hold, generic journal or publication identity migration.
- [ ] 2.2 Wire keyed checkout lookup, atomic hold identity and conditional execution/recovery through existing repository/application seams; verify concurrent identical requests and process restart produce one hold and one original provider request identity.
- [ ] 2.3 Preserve original ordered provider parameters, accepted shipping/monetary policy, gate checks and terminal/uncertain behavior; verify retries across price/tariff changes, fixed multi-line/custom-price restrictions, acknowledgement loss, expiry, paid/review state, disabled launch and provider key-retention expiry never duplicate or reprice the attempt or release an uncertain hold.

## 3. Add stock replay and client intent

- [ ] 3.1 Commit stock request identity atomically with StockChange/StockCount and replay recognized effects before recount revision comparison; verify distinct same-quantity intents still work, concurrent replay applies once, and first-execution stale recounts still conflict.
- [ ] 3.2 Document/validate UUIDv4 Idempotency-Key only for checkout creation and stock adjustment/count, with safe conflict/retry responses and required CORS allowance; regenerate clients and verify actor/environment isolation and payload conflicts. Keep delivery quotes and existing item/price/publication request IDs outside the new header requirement.
- [ ] 3.3 Add checkout attempt identity/fingerprint state in sessionStorage outside StoreCart and equivalent pending operator intent state; verify double-click, reload, network retry, edited input, canceled/terminal checkout, and explicit new intent use the intended key lifecycle without automatic failure-triggered rotation.
- [ ] 3.4 On stock replay refresh authoritative stock while identifying the original ledger result; verify replay cannot replace current stock with the old response or silently update a stale recount's submitted revision.

## 4. Migration and acceptance

- [ ] 4.1 Exercise optional-key server, migrated clients and final required-key enforcement in Local/UAT; verify old/new combinations, safe refresh-required errors and honest documentation of keyless bridge limitations before declaring retry protection complete.
- [ ] 4.2 Measure additional Local D1 reads/writes and stored metadata per attempt/stock operation, including failed and abandoned attempts; deliver a low-volume budget and confirm no new queue, KV binding, scheduled cleanup or paid service is required.
- [ ] 4.3 Run real Local D1 transaction/restart/concurrency, accepted-policy replay and provider-uncertainty regressions, then `pnpm validate`, `pnpm validate:editor`, generated-contract checks and strict OpenSpec validation. Run applicable Local CMS/publication checks if shared integration is touched; retain redacted evidence and final source fingerprints, not partial-gate claims.
- [ ] 4.4 Prepare compatible rollout/rollback and execute normal promotion with any hosted test-mode writes separately budgeted and authorized; verify pending holds and populated additive fields survive rollback, and final maintained clients require keys.
