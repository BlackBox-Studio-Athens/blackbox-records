# Request idempotency evidence

## Baseline

The pre-change reproduction recorded in [baseline-evidence.md](baseline-evidence.md) showed repeated keyless checkout calls creating two holds/provider requests and repeated keyless stock changes applying two ledger effects. Keyless calls remain outside the new guarantee during the compatibility bridge.

## Focused behavior checks

- WebStorm MCP passed the checkout use-case suite, the D1 checkout-hold suite, the D1 operator-stock idempotency suite, and the staff stock-operations suite.
- D1 persistence coverage includes concurrent keyed checkout convergence, provider-claim exclusion, concurrent stock replay, actor/fingerprint conflict, committed-count replay after revision advance, and first-execution stale-count rejection.
- Checkout coverage includes stable provider parameters across SDK retries, one hold/provider request for duplicate input, catalog-price changes without repricing, uncertainty recovery, terminal-state handling, and disabled-checkout gates.
- Browser/staff coverage includes sessionStorage attempt reuse/rotation/clear behavior, pending operator intent restoration, retry-key reuse, and current-stock refresh after replay.
- The WebStorm route runner cannot finish its temporary HTTP test configuration before discovery. The equivalent backend Node Vitest fallback passed both route files: 2 files, 44 tests.

## Contract and repository gates

- `pnpm generate:api` passed after the final route contract changes.
- `pnpm --filter @blackbox/backend prisma:generate` passed after repairing the local Prisma engine package; the committed generated client now contains the additive fields.
- `pnpm validate` passed in final run `2026-09-18T11-04-40-884Z-25864` with Node `v24.20.0` and pnpm `12.0.0`: unit tests, environment model, formatting, lint, types, boundaries, and build all passed. Unit totals included web 109 files/564 tests, staff 13/65, backend worker/node suites 75/550 and 47/298, API client 1/8, and 2 auxiliary files/17 tests. Final validation source fingerprint: `0aac9f578dec2201886e056624d3fbc8153f7f735c9768a89cb6c6982eae6b3f`, 2,126 files.
- `pnpm validate:editor` passed its partial editor gate in run `2026-09-18T11-11-43-335Z-8792`: staff build, preview policy, Chromium workspace checks, and Firefox workspace checks.
- `pnpm openspec:guard` and strict change validation passed.

The final simplification pass removed unused request-identity facade exports, kept replay-only fingerprints inside the D1 persistence row shape, and stopped exposing or selecting unused stock idempotency metadata in shared history records.

## Budget and rollout

- The migration is additive and nullable. Each keyed parent row stores one 64-character SHA-256 key digest and one 64-character input fingerprint, scoped by Product Environment and actor where required; raw keys are never stored.
- A keyed checkout retry performs one durable identity lookup before catalog/hold work. A stock retry checks the existing ledger identity before mutation and refetches current stock on replay. No generic journal, KV, queue, scheduled cleanup, or paid service is added.
- At the design ceiling of three purchases per day, retained checkout identities are 1,095 successful purchase-associated identities per year, plus actual operator operations and abandoned attempts.
- The compatibility bridge accepts optional keys when `COMMERCE_IDEMPOTENCY_KEYS_REQUIRED` is unset. Maintained Local, UAT, and PRD Wrangler environments set it to `true`; stale keyless clients receive `idempotency_key_required`. The additive fields and pending holds remain valid across rollback.

## Hosted boundary

No hosted UAT/PRD deployment, live catalog mutation, payment creation, or provider test write was performed. Those actions remain separate promotion/acceptance work requiring their existing authorization and evidence.
