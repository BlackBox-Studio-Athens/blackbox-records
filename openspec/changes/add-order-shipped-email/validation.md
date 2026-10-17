# Implementation validation

## Source and authorization

- Date: 2026-10-17. Product Environment: Local.
- Original base SHA: `70c781af02f8be3fd2ad69dd711b83a9423e0fcf`. The worktree then fast-forwarded to local `main` at `d7c56bb5` to include its committed Home-scroll repair before the final feature commit. Worktree: `C:/Users/SVall/.codex/worktrees/shipped-order-email/blackbox-records`, branch `feat/order-shipped-email`.
- The owner approved the layout and behavior and authorized implementation, local commit and merge into local `main`. Codex owns this task without Claude delegation. Hosted delivery, push and deployment are outside this request.
- The final source-bound `pnpm validate` summary path, source SHA, matching before/after fingerprints and later commit/merge identity are retained in `.codex-artifacts/email-previews/validation-receipt.json`. This ignored receipt avoids a self-referential documentation fingerprint. Validation must pass before commit.

## Repository checks

`pnpm validate` passed all 61 selected tasks across 47 projects, including tests, lint, type checks and architecture checks. Its Local summary is `.codex-artifacts/validation/2026-10-17T09-25-36-229Z-52840-9aef79/summary.json`, source SHA `70c781af02f8be3fd2ad69dd711b83a9423e0fcf`, with matching before/after fingerprint `d0be471c4d22dea6a0a4fe4a0cdd17479514251f76a2753201206b129078db57` for 42 changed files and no source changes during checks. Strict OpenSpec validation passed. The receipt above records the later final check after integrating local `main` and completing these notes.

## Focused checks

All checks used the repository's scoped `pnpm test <module>` entrypoint:

| Module               | Result     | Relevant evidence                                                                                                                                                                           |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| email-application    | 82 passed  | Approved HTML/text, escaping, reply address, sink/shopper routing, separate stable provider identity and preview snapshot                                                                   |
| commerce-persistence | 69 passed  | Concurrent/stale marks, atomic rollback on queue failure, and migration preservation of existing pending/delivered/review history and dispatch marks                                        |
| orders               | 123 passed | Existing delivery bounds and missing-dispatch-reader refusal                                                                                                                                |
| checkout-integration | 52 passed  | Local D1 service/schedule with mocked provider: immediate send, retry with the same key, undo/re-mark in pending/delivered/review states, incomplete-order refusal and unchanged paid facts |
| public-commerce-http | 336 passed | Access/same-origin protection and separate shipping-delivery summary                                                                                                                        |
| staff-orders         | 46 passed  | Shipping email status separate from dispatch, accessible helper, existing filters and concurrency                                                                                           |

The initial migration test used the wrong import for its helper; the corrected Worker helper and complete persistence rerun passed. Prisma and internal OpenAPI/client artifacts were regenerated through existing commands. Regeneration includes two pre-existing consent schema models; no consent migration was added. Incidental generated trailing whitespace was normalized.

## Browser evidence

- The production shipping renderer emits the approved HTML byte for byte with identical preview data and URLs: SHA-256 `40ffe3dc75f9773be8dd4740894f1520837d15d7347f2835ded5de4c700400ff`.
- Playwright CLI checked the actual email at 720px (476px frame), 390px and 320px. Logo and Veneer loaded, the reference/reply action matched, and no horizontal overflow occurred. The facts row stacks at 320px. The rendered screenshot had no material defect.
- The actual Staff dev application was checked at 1440px and 390px with synthetic API responses. Verified helper text and `aria-describedby`, keyboard Mark shipped, pending Shipping email status, undo recall warning and undo/re-mark with one notification row. No horizontal overflow occurred. Mobile and undo screenshots had no material defect.
- The fixture denied unrelated APIs; its one Staff console error was the intentionally blocked header changes-count read. The static email preview had an unrelated missing favicon. No real customer, private hosted API or provider was used.
- Temporary browser/server sessions were stopped after verification. Browser evidence does not establish Gmail/Outlook or hosted email delivery.

Artifacts under `.codex-artifacts/email-previews/`: `shipped.html`, `shipped.txt`, `shipped-review.png`, `shipped-720.png`, `shipped-390.png`, `shipped-320.png`, `staff-shipping-1440.png`, `staff-shipping-390.png`, `staff-shipping-undo.png`, `staff-shipping-pending.png`, and the render/check scripts. All use synthetic contact/order facts.

## Acceptance limits

Selected acceptance covers commerce persistence, protected internal API, Staff behavior and email presentation. Shell/player, content publication, live catalog and release acceptance do not apply. Graphify was refreshed after implementation; SQL extraction is unavailable, so migration evidence comes from direct SQL and real D1 tests.

Task 5.2 remains a separately authorized UAT sink/provider check before PRD rollout. Actual email-client rendering and hosted delivery remain unverified. No real email, hosted mutation, push or deployment was performed. The local merge must preserve the unrelated harness and Home-scroll work on the primary checkout.

## Earlier draft evidence

The planning-only draft passed strict OpenSpec and local validation at `.codex-artifacts/validation/2026-10-17T08-50-53-229Z-18452-bfd595/summary.json`, matching fingerprint `864911291787f4baabdea79a357e8a1a2a2c46012f81b1947abfb755f36af023`. That evidence covers seven planning files and is superseded by the implementation receipt for code acceptance.
