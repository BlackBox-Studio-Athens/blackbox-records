# Validation — 2026-10-13

Local Product Environment, worktree `preorder-flow-design-65884f`, uncommitted tree on `1fa3c2742be5ba89836b501744340fb30b1a9933`.

## Repository gates

`pnpm validate` passed in `mode: local`, with matching before/after fingerprint `91332c1025993cf3808871bfea0da0b67bf84265ccb39c1bae4dccbc201af465` (32 changed files): `.codex-artifacts/validation/2026-10-13T17-04-48-104Z-36344-adffb3/summary.json`. Earlier runs on this change caught the internal contract path list and a staff `exactOptionalPropertyTypes` error; both were fixed before the passing run.

Focused checks:

- `d1-order-dispatch-repository.worker.test.ts`: mark, stale second mark, undo, undo without a mark, operator record.
- `order-search.worker.test.ts`: `notShipped` returns open and undone paid orders only.
- `internal-order-routes.test.ts`: dispatch success, conflict, not ready, not found, same-origin guard, unchanged mark, filter forwarding.
- `api-documents.worker.test.ts`: the dispatch path is in the internal contract.
- `staff-orders`: tile and controls by state, notice removed, store action and conflict reload, filter and paging, PUT header.
- `pnpm openspec -- validate add-order-dispatch-marking --type change --strict` passed.

## Acceptance rows

- **Staff/editor:** focused staff tests and local completion pass. Not run: a browser check of `/orders/` with the Local stack.
- **Commerce/checkout/stock:** the backend write and read tests pass. Checkout, payment and stock paths are unchanged.
- **Boundaries/tooling:** the new repository is exported from `commerce-persistence`; validate's architecture checks passed.
- **Release/environment:** not applicable locally. Migration 0035 is not applied to UAT or PRD (task 3.3).
