# Tasks

## 1. EmDash price drafts

- [x] 1.1 Add the `price-drafts` route and `content:afterDelete` cleanup to the `blackbox-editorial` plugin; verify CRUD, compare-and-set conflicts, shape validation and cleanup with worker tests.
- [x] 1.2 Allow exactly the price-draft route through the CMS request guard; verify the guard test.
- [x] 1.3 Attach drafts in `readStaffWorkspace` and keep draft-only catalog records in review discovery; verify with the staff workspace worker test.

## 2. Staff item publishing

- [x] 2.1 Add the shared price-draft client, price command runner and `planItemPublication`; verify with unit tests.
- [x] 2.2 Replace the price form submit with a staged EmDash draft and remove the separate shop publication block; relabel stock actions as immediate.
- [x] 2.3 Show Publish changes on both tabs with the pending count, and run the reviewed sequence with per-step progress and retry.
- [x] 2.4 Show draft prices in Review changes.

## 3. Documentation

- [x] 3.1 Update the backoffice design reference, DESIGN.md, design inspiration and content workspace documents.

## 4. Validation

- [x] 4.1 Run focused tests, `pnpm validate:editor`, `pnpm check:boundaries`, strict OpenSpec validation and `pnpm validate`; record Local browser evidence in validation.md.
