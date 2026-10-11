## Context

The approved operating model is editorial content in Sveltia, selling prices in Stripe Dashboard, and stock/orders in Worker D1. UAT listing snapshots are currently missing following a failed reset. Unrelated account objects must not veto releases.

## Decisions

1. Add a nullable Product binding to the existing variant mapping for additive migration. Backfill only from trusted mapped Prices after validating identity and environment. Select the Product's explicit default Price; older active Prices do not create ambiguity.
2. Resolve current Product state directly for detail, checkout, and signed webhook refresh. Preserve currency, tax, supported price-kind, quantity, and identity checks. Refresh only the bound variant; provider payload snapshots never select authority.
3. Scope release synchronization to the canonical source manifest. Register new identities without overwriting existing stock or availability. UAT can bootstrap genuinely new items from explicit test inputs; PRD requires configured Stripe prices and one-run authorization.
4. Generate one ignored manifest from the source SHA. Use it for synchronization and Worker presentation. Remove generated bot commits and duplicate committed catalogs.
5. Use pages.yml as one release workflow, with shared non-cancelling concurrency. Complete repository gates and all selected catalog preflights before deployment. Deploy and smoke-test the same SHA. Invalid bindings/defaults block all deployments; intentional sold-out/paused state and PRD launch-disabled state are valid.
6. Export affected D1 state and inventory before recovery. Never reset catalogs or archive unrelated objects. Reuse persisted bindings and scoped identity discovery on retry; idempotency keys alone do not permanently prevent duplicates.

## Risks and Rollout

Stripe, D1, Worker, and static hosts are not one transaction. Keep preparation additive and retryable, keep the previous frontend until replacement artifacts are ready, and report completed stages. Recover UAT explicitly and verify fresh listings and checkout smoke. Do not mutate PRD without its separate one-run confirmation.

## Validation

Cover default switches with older Prices active, bound foreign identities, unrelated objects, fixed/custom price and tax checks, webhook replay/order/recovery, stock/pause preservation, interrupted synchronization, and identical content-only/mixed release gating. Run unit tests, checks, builds, and fresh UAT smoke against the final revision.
