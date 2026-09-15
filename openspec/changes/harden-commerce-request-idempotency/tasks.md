## 1. Confirm low-volume scope and existing guarantees

- [ ] 1.1 Run `pnpm openspec:guard`, verify completed EmDash acceptance/cutover/handoff and spec reconciliation plus RFC 9457 acceptance; deliver a final audit of checkout holds/provider keys/recovery, stock/count concurrency, webhook deduplication and item/price journal coverage.
- [ ] 1.2 Record a before-change Local duplicate-submit/acknowledgement-loss reproduction for uncovered checkout and stock operations; verify which effects repeat and omit any proposed mechanism already supplied by the completed epic.

## 2. Add durable checkout retry identity

- [ ] 2.1 Add only missing nullable digest/fingerprint/original-request fields and scoped uniqueness to existing order/ledger persistence using additive Prisma/D1 migrations; verify Local migration compatibility, duplicate constraints and unchanged historical records without adding a second hold or generic journal.
- [ ] 2.2 Wire keyed checkout lookup, atomic hold identity and conditional execution/recovery through existing repository/application seams; verify concurrent identical requests and process restart produce one hold and one original provider request identity.
- [ ] 2.3 Preserve original provider parameters, gate checks and terminal/uncertain behavior; verify acknowledgement loss, expiry, paid/review state, disabled launch, changed input, and retry beyond provider key retention never create a replacement payable Session or release an uncertain hold.

## 3. Add stock replay and client intent

- [ ] 3.1 Commit stock request identity atomically with StockChange/StockCount and replay recognized effects before recount revision comparison; verify distinct same-quantity intents still work, concurrent replay applies once, and first-execution stale recounts still conflict.
- [ ] 3.2 Document/validate the scoped UUIDv4 Idempotency-Key header and safe conflict/retry responses, update only required CORS allowances, and regenerate API clients; verify actor/environment isolation, malformed keys and changed-payload conflicts.
- [ ] 3.3 Add checkout attempt identity/fingerprint state in sessionStorage outside StoreCart and equivalent pending operator intent state; verify double-click, reload, network retry, edited input, canceled/terminal checkout, and explicit new intent use the intended key lifecycle without automatic failure-triggered rotation.
- [ ] 3.4 On stock replay refresh authoritative stock while identifying the original ledger result; verify replay cannot replace current stock with the old response or silently update a stale recount's submitted revision.

## 4. Migration and acceptance

- [ ] 4.1 Exercise optional-key server, migrated clients and final required-key enforcement in Local/UAT; verify old/new combinations, safe refresh-required errors and honest documentation of keyless bridge limitations before declaring retry protection complete.
- [ ] 4.2 Measure additional Local D1 reads/writes and stored metadata per attempt/stock operation, including failed and abandoned attempts; deliver a low-volume budget and confirm no new queue, KV binding, scheduled cleanup or paid service is required.
- [ ] 4.3 Run real Local D1 transaction/restart/concurrency and provider-uncertainty regression cases, then `pnpm test:unit`, `pnpm check`, `pnpm build`, generated-contract checks and strict OpenSpec validation; retain only redacted result evidence.
- [ ] 4.4 Prepare compatible rollout/rollback and execute normal promotion with any hosted test-mode writes separately budgeted and authorized; verify pending holds and populated additive fields survive rollback, and final maintained clients require keys.
