# Local validation

## Source and scope

Worktree: `C:/Users/SVall/.codex/worktrees/7df8/blackbox-records`.
Branch: `codex/secure-consent-verification`.
Base: `dfea9e105f51e7e472dc08e535a479e7dbb2186b`.
Product Environment: Local only. Backend, D1, contracts, tests and this change's planning/handover documents. No website or staff UI source edits, publication, push, deployment, real email, tax or launch changes.

## Verification

`pnpm validate` passed all 61 selected checks across 47 affected projects, including required dependencies. The source-bound [acceptance summary](../../../.codex-artifacts/validation/2026-10-14T10-12-39-254Z-71952-0c7137/summary.json) records `mode: local`, `status: passed`, identical before/after SHA `dfea9e105f51e7e472dc08e535a479e7dbb2186b`, no source changes, and identical before/after fingerprint `8f8885e04a7aca08fbe7ef4baa43ff11906115a4aaa11314e52dcada32d7f566`. Its closure pass reused 42 of 61 checks with matching inputs.

This summary precedes the final evidence-note/task-checkbox edits. A final documentation closure check follows those edits. Its summary, fingerprints, final local commit and precise changed-file list are recorded in the ignored `.codex-artifacts/consent-completion/receipt.json`, avoiding a self-referential tracked fingerprint.

- Guarded worktree opt-in passed; all OpenSpec commands used `pnpm openspec -- --allow-worktree ...`.
- `pnpm generate:api` passed; public OpenAPI and client types include all three new endpoints and the pending-confirmation flag.
- Strict validation of this OpenSpec change passed.
- Real workerd/D1 persistence tests passed, including exact newsletter recipient preservation, mailbox confirmation, token hashing, concurrent single-use claims, identical provider retries, expiry/wrong purpose, failed activation replay, daily cap/pruning, queued/leased withdrawal, and the parent's two-token registration interleaving.
- Resend gateway tests passed: unverified Contact calls have no writes; verified writes omit `unsubscribed`. The pinned Resend 6.30.0 SDK was inspected and forwards the optional field without inserting a false default.
- Public HTTP, email application, order, checkout, API-client, web/staff/backend lint and type checks, and architecture checks passed. Commerce persistence records 64/64 passing tests, including all seven new consent regressions.
- `graphify update .` completed after the parent race fix: 28,072 nodes and 44,962 edges. CodeGraph reported this worktree unindexed; exact source reads were the documented fallback. Graphify did not index SQL because its SQL parser is absent; real D1 tests establish SQL behavior. Context7 returned a quota error, so official provider documentation and the pinned SDK were used.

The initial affected test run found the missing OpenAPI path inventory entries; they were corrected. Earlier validation attempts were invalidated while final fixes were made and caught formatting changes. Those attempts are not acceptance evidence.

The broader CMS real-workerd Local invalidation fixture hit its 30-second timeout once and passed on retry without CMS source changes at its existing timeout. A test-helper regexp lint finding was corrected to use `RegExp.exec`.

## Acceptance boundaries

- Commerce/backend/API: Local mocked providers plus actual workerd/D1, including cancellation without provider credentials. Existing price, stock, tax, checkout and launch authority remains unchanged.
- Module boundaries: new email-consent persistence export/dependencies are declared with their delta spec; repository architecture checks cover them.
- Browser, CMS/publication, provider, inbox rendering, UAT and PRD: unverified and outside this local execution. Claude owns website integration and browser/continuity checks in task 4.1; reviewed actual CMS privacy publication is task 4.2; separately authorized hosted acceptance is task 4.3.
- A delivery already being processed may still arrive if withdrawal commits after the final lease read and before/during provider submission. Deleted queue rows cannot be retried or recreated by stale delivery work. All existing mailbox withdrawal capabilities are invalidated atomically to prevent the two-token registration race.

## Parent reconciliation

Migration `0036_email_consent_capabilities.sql` follows existing `0035_order_dispatch.sql`. Reconcile sibling migration allocations before combining changes. The new private records and technical cleanup policy need the privacy sibling's review. No real editorial/controller data was replaced; proposed narrow publication copy and exact Claude edit points are in [handover.md](handover.md). Official legal/provider sources and the chosen operational policy rationale are in [design.md](design.md).

Parent reviewed and accepted the atomic all-capability invalidation, two-token regression, exact recipient preservation, provider guard and corrected in-flight/maintenance limits. Six local backend/handover tasks are complete; tasks 4.1–4.3 remain open for Claude UI, actual CMS publication and separately authorized hosted acceptance. Parent owns integration into main and combined-tree validation.

## Owner correction: automatic newsletter confirmation, 16 October 2026

The owner authorized this scoped UI fix in a new worktree, merge to main and PRD Software Release. A well-formed newsletter email link now clears its fragment, submits the existing POST automatically, and renders Email confirmed only after success. No second confirmation is required. Malformed, expired, used, unavailable and offline states remain truthful; only connection failure offers Try again. Availability withdrawal stays explicit. Existing unsubscribe preferences and all backend token rules remain unchanged.

- Base: `0962e1f117f0325343966a75046b4ccfbd63688b`; isolated worktree `newsletter-confirm-success`.
- `pnpm test apps/web/src/components/store/checkout/email-preferences.test.ts`: passed all 9 affected project tasks.
- `pnpm test:e2e e2e/email-preferences.spec.ts`: 9 passed, 0 failed or flaky, including delayed-response success, automatic single POST, URL/storage/referrer protection, final server errors, manual offline retry, 320/390px success reflow, and explicit mobile alert withdrawal. Evidence: `.codex-artifacts/e2e/summary.json` in the worktree.
- `pnpm validate`: passed 21 tasks; local summary `.codex-artifacts/validation/2026-10-16T14-07-26-139Z-57700-bfee38/summary.json`; matching before/after source fingerprint `3d84f459584ec876837c33cb3af56a774beb5bec54f51df4e10bd25a42c9b664`.
- `pnpm build:web`, strict guarded OpenSpec validation and local AST-only Graphify update: passed. No migrations, new dependencies or provider configuration changes.
- Acceptance rows: email/checkout presentation and release. No shell routing or active-player behavior changed; the email document remains standalone. CMS/publication and live inbox/provider acceptance are outside this fix. UAT/PRD evidence follows after deployment.
- Trade-off accepted by the requested behavior: a mail scanner that executes JavaScript may consume a single-use confirmation capability. A plain GET still performs no consent mutation.
