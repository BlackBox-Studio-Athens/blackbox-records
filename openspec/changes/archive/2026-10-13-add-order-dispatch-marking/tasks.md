# Tasks

## 1. Backend

- [x] 1.1 Add migration `0035_order_dispatch.sql`, the `OrderDispatchRepository` port and its D1 implementation with a conditional upsert. Worker tests cover mark, stale second mark, undo, undo without a mark and the operator record.
- [x] 1.2 Add the protected dispatch PUT route and the `dispatch` read field, and the `dispatch=not_shipped` search filter. Route tests cover success, conflict, not ready, not found, the same-origin guard and an unchanged mark; a worker test covers the filter.
- [x] 1.3 Regenerate the internal contracts (`pnpm generate:api`).

## 2. Staff

- [x] 2.1 Add the Dispatch tile, Mark shipped and confirmed Mark not shipped to order detail; remove the private-dispatch-record notice.
- [x] 2.2 Add the Shipped/Not shipped list label and the "Not shipped" filter, restored from the address.

## 3. Docs and acceptance

- [x] 3.1 Update `docs/commerce-operations.md` so Orders is the dispatch record.
- [x] 3.2 Run `pnpm validate` on the final tree and record the evidence in validation.md.
- [ ] 3.3 Apply migration 0035 and check marking on UAT, then PRD, with the release.
