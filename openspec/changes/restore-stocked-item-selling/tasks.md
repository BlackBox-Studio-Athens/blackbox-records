# Tasks

## 1. Reproduce the gap

- [x] 1.1 Add one isolated retained-item regression (null setup fields/revision zero, stock 1/1 and ledger history) plus a configured-price control. Exercise the real unpriced path, not the `price_mock_*` shortcut. Reuse the recorded PRD evidence; inspect actual hosted bindings before PRD acceptance, without blocking Local work on unavailable diagnostics.

## 2. Extend the existing backend

- [x] 2.1 Add the selected-item Selling read and strict initialization contracts. Reuse native source/`_rev` adapters and existing type/money rules; return ready/setup-required/blocked states, preserve old contracts, and generate the client with `pnpm generate:api`. Verify GET is non-mutating and provider failures cannot become setup permission.
- [x] 2.2 Add `price_initialize` through the existing journal/migration pattern, storing accepted input/projection atomically. Preserve historical operations and existing claim/uniqueness guards; only dedicated atomic completion may finish the new kind.
- [x] 2.3 Implement initialization on the retained variant using existing Stripe gateway methods and a small selected-Product check. Resolve replay first; reject invalid fresh requests before journal/provider writes; complete runtime setup, mapping, snapshot and receipt atomically without stock/publication writes.
- [x] 2.4 Extend existing command/repository tests for the new branches: invalid input/live confirmation, unsafe binding, type derivation, zero/missing stock, replay after provider work or browser-state loss, a competing operation and atomic completion preserving inventory. Reuse existing auth, money, provider-recovery and checkout coverage; avoid duplicating their full matrices.

## 3. Connect the staff workflow

- [x] 3.1 Make CatalogSelling the single read owner and reuse ItemPriceEditor for Set price/Change price. Add the blank initial amount, required format choice and explicit Resume/blocked actions. Refresh on entry, explicit request and confirmed completion; preserve the reviewed draft on conflict, ignore obsolete responses, and keep success visible if refresh fails.
- [x] 3.2 Add the same-item Stock → Selling handoff through the existing variant resolver, preserving `tab=selling`. Refresh the selected summary/publication prerequisites after success, explain incomplete setup before publication preflight, and leave editorial review and general navigation behavior with their existing owners.

## 4. Verify and document

- [x] 4.1 Run one focused Chromium browser journey at desktop and 320 CSS pixels with keyboard input, comma/point amounts, initial pricing, configured control, conflict/refresh feedback and the Stock round trip. Add another browser only for a concrete browser-specific concern.
- [x] 4.2 Update docs/content-workspace.md with Set price and manual recovery. Change README or docs/catalog-promotion.md only if an existing instruction becomes inaccurate; do not duplicate the journey or introduce a new release process.
- [x] 4.3 Run `pnpm validate` and `pnpm validate:editor` on the final tree, plus the relevant Local CMS runbook checks and `pnpm --filter @blackbox/backend d1:check:stripe-mock:local`. Confirm the existing no-KV build/launcher contract and initial-pricing publication/checkout boundaries through the existing gates.

## 5. Accept the release

- [ ] 5.1 After release authorization, perform one UAT stock-first smoke and configured-item control. Record the candidate SHA/run ID and unchanged inventory result. Keep failure simulation local; apply the Free-tier usage preflight if hosted work expands into repeated probes, recovery rehearsals or bulk operations.
- [ ] 5.2 Promote the reviewed compatible migration/code through the existing job with `confirm_live_catalog_changes=false`. Verify the served Worker identity and preserved journal history; use a compatible candidate or forward fix for rollback.
- [ ] 5.3 With the existing one-run live authorization, verify the actual PRD item's reviewed initial price, unchanged inventory/history and unchanged launch controls. Leave this task open without authorization or an observed result; route any legacy binding repair to a separate scoped operation.
