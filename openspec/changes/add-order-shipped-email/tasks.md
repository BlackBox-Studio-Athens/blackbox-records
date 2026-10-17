# Tasks

## 1. Draft and approval

- [x] 1.1 Prepare the copy and local static preview with the existing shopper email helpers; verify HTML/text and a synthetic order reference without sending email.
- [x] 1.2 Obtain explicit owner approval of the email copy, design and send-once behavior before starting implementation; record the response in this change. Approved 2026-10-17 with authorization for implementation, local commit and merge into local main.

## 2. Shopper email

- [x] 2.1 Add the approved shipping-email renderer and existing preview/export entrypoints; verify matching HTML/plain text, escaping, configured reply address, subject and 320px/390px/desktop wrapping with focused email tests and browser review.

## 3. Durable dispatch delivery

- [x] 3.1 Add the fourth delivery kind and smallest additive D1/Prisma changes; commit the successful compare-and-set dispatch and first delivery intent atomically, with persistence tests for rollback, stale/concurrent writes, repeat requests and no historical backfill.
- [x] 3.2 Connect immediate and existing scheduled delivery, preserving the shared budget, environment routing, lease, retry bounds and provider identity; verify failures keep Shipped intact and undo/re-mark cannot produce a second email with focused orders/schedule tests.

## 4. Staff visibility and operational guidance

- [x] 4.1 Extend protected notification summaries and regenerate the existing internal client; label Shipping email in Staff and include it in current notification attention behavior, verified by contract and Staff tests.
- [x] 4.2 Add inline Mark shipped helper text and the existing undo dialog's recall warning; update fixtures and the commerce runbook, and verify keyboard/narrow-screen behavior and truthful pending/delivered/review feedback in focused Staff tests.

## 5. Integration acceptance

- [x] 5.1 Run `pnpm validate` and strict OpenSpec validation on the implemented tree; record matching source fingerprints, summaries, browser observations and any remaining provider/client acceptance limits.
- [ ] 5.2 Once separately authorized, verify one UAT sink email from the real Staff dispatch flow and prove repeated clicks and undo/re-mark do not create another provider send; record source and safe receipt evidence before requesting any PRD rollout.
