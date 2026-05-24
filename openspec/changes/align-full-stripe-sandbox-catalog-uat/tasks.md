## 1. OpenSpec

- [x] 1.1 Create `align-full-stripe-sandbox-catalog-uat`.
- [x] 1.2 Add proposal, design, tasks, and spec deltas for full sandbox UAT catalog alignment.

## 2. Catalog Projection

- [x] 2.1 Update the Astro-derived catalog projection policy so all current Store Items are sandbox checkout-eligible.
- [x] 2.2 Add format-based sandbox expected Price defaults.
- [x] 2.3 Generate the backend Product Projection manifest from the filesystem adapter.
- [x] 2.4 Add a check command that fails when generated catalog artifacts drift.

## 3. Sandbox D1 Readiness

- [x] 3.1 Add sandbox UAT seed SQL for all current Store Items.
- [x] 3.2 Seed `StoreItemOption`, `ItemAvailability`, and `Stock`.
- [x] 3.3 Keep `afterglow-tape` as the only low-stock item and all other items at `99/99`.
- [x] 3.4 Add `pnpm --filter @blackbox/backend d1:seed:sandbox:uat-catalog`.

## 4. Stripe Sandbox Reset

- [x] 4.1 Add a dry-run default sandbox reset/report command.
- [x] 4.2 Require `--confirm` for mutation and reject non-sandbox environments.
- [x] 4.3 Deactivate old active repo-owned sandbox Prices and Products instead of hard deleting.
- [x] 4.4 Ensure reset reports redact provider IDs and do not touch unrelated Stripe objects.

## 5. Frontend UAT Availability

- [x] 5.1 Mark current Store Items statically available with browser-safe Worker-confirmed copy.
- [x] 5.2 Keep static state free of Stripe Price IDs, D1 IDs, stock authority, secrets, and authoritative prices.

## 6. Documentation

- [x] 6.1 Document price defaults, stock defaults, reset/apply sequence, and no-secret evidence rules.
- [x] 6.2 Document GitHub Pages UAT smoke commands.

## 7. Verification

- [x] 7.1 Run focused unit/script tests for catalog projection, seed stock policy, reset safety, and static availability.
- [x] 7.2 Run `pnpm test:unit`.
- [x] 7.3 Run `pnpm check`.
- [x] 7.4 Run `pnpm build`.
- [x] 7.5 Run `openspec validate align-full-stripe-sandbox-catalog-uat --type change --strict`.
- [x] 7.6 Run `openspec validate --all --strict`.
- [ ] 7.7 Run sandbox/UAT provider proof sequence when Stripe credentials and deployment state permit it.
