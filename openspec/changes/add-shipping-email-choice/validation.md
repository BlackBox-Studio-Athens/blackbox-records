# Validation

## Source and scope

- Product Environment: Local, on main. Base HEAD: `508fa091`.
- Codex implements UI and backend under the explicit user override. Preserve pre-existing OpenSpec/search/release notes and other unrelated files.
- Acceptance rows: Staff/editor and Commerce/checkout/stock. Public shell/player/routing and content publication are unchanged. Release/environment remains separate hosted acceptance.
- No live order, payment, stock, customer message or hosted provider state was changed.

## Passing focused checks

- `pnpm test staff-orders`: passed.
- `pnpm test apps/backend/src/infrastructure/persistence/d1-order-dispatch-repository.worker.test.ts`: affected selection passed 12/12 tasks, including migration preservation, suppression, conflicting choices, undo/re-mark and atomic rollback.
- `pnpm test apps/backend/src/interfaces/http/internal-order-routes.test.ts`: affected selection passed 7/7 tasks; default/true/false values, invalid types and Access/same-origin protections covered.
- `pnpm test apps/backend/test/integration/checkout/order-shipping.worker.test.ts`: passed from valid cached evidence; explicit opt-out makes zero provider calls and no shipping delivery even after schedule, response retry and undo/re-mark. Normal send/retry behavior remains covered.
- `node --test scripts/feedback-guard.test.mjs`: 8/8 passed. The new focused mode does not exempt the unfiltered editor suite.
- `pnpm build:staff`: passed, including route isolation and Staff bundle budgets.
- `node --import tsx scripts/test-content-workspace.mjs --orders-shipping` and the same with `--firefox`: passed at 320, 390 and 1280 px. Verify checked/unchecked requests, refresh/failure retention, disabled saving controls, reset between orders, skipped/reopened/undo/re-mark states, existing-email protection, keyboard focus and label reachability, and no overflow. The fixture queues no real email.
- Browser summaries and screenshots: `.codex-artifacts/content-workspace/{chromium,firefox}/orders-shipping-summary.json` and `orders-shipping-{choice,skipped}-<width>.png`. The 390px checkbox screenshot was visually inspected; the checkbox reuses the existing native Staff style. Final browser runs use the final Staff build; its successful build/route-isolation/budget log is `.codex-artifacts/content-workspace/shipping-staff-build.log`.
- `pnpm openspec -- validate add-shipping-email-choice --type change --strict`: passed.
- `graphify update .`: passed after the final API-client fix, 30,348 nodes. Tool coverage limits: SQL extraction is unavailable because tree_sitter_sql is not installed, and the existing pages-workflow-contract test has a partial parse. Actual SQL behavior is covered by D1 tests; no semantic enrichment or dependency installation was performed.

## Completion validation

`pnpm validate` passed all 62 tasks (48 cached), mode `local`, in 317.7 seconds. Summary: `.codex-artifacts/validation/2026-10-24T11-22-02-933Z-38224-22f5d3/summary.json`. Both source fingerprints match `a506ae3a0940cd5e1ee9ca93bef1a599deb5c3a79d852439a051c820dacd41a7` at full HEAD `508fa091c6044fbb60776fb570413bcb02d7dc27`.

That complete run preceded the final browser-navigation and evidence-note edits. The final-tree validation pointer and matching fingerprints are recorded in ignored `.codex-artifacts/shipping-email-choice-20261024/final-validation.json` after the completion rerun, avoiding a self-referential tracked fingerprint.

Earlier validation exposed an optional/defaulted generated-client type mismatch, fixed by defaulting the Staff wrapper's omitted choice to true. Its automatic rerun also caught formatting of a test edited during that run; the next complete run above passed. Browser harness corrections install the fake clock before page timers and wait for DOM plus actual controls after navigation, rather than waiting for unrelated load events. Both final Chromium and Firefox journeys pass. These are recorded failures and fixes, not waivers.

## Hosted limits and release handoff

No commit, push, UAT deployment or PRD promotion has been performed. Apply migration 0039 before the suppression-aware Worker; verify protected API false-choice behavior before Staff exposure. Keep suppression-aware dispatch code on rollback. Local fixtures do not prove hosted delivery or release acceptance. The user will mark the real already-delivered order after production acceptance; implementation does not perform that operation.
