# Blackbox task acceptance

Use this document to choose project checks and record evidence. [Project references](agent-reference.md) supply task-specific edit points and runtime constraints.

## Task state

For a substantive change, use its existing OpenSpec proposal, tasks and delta specs. Record the outcome, observable acceptance criteria, affected modules, material decisions and remaining work there. A validation note in the same change links the evidence. Do not create a parallel planning directory or task database.

Domain specs describe intended behavior; the module-boundary manifest is executable policy. Source and runtime observations establish current behavior. Resolve disagreements before recording acceptance.

## Iteration and local completion

- While editing, run `pnpm test <module|file>` or keep `pnpm test:watch <module>` running; results are partial. Public frontend work reuses this checkout's site and hot updates; `pnpm test:e2e e2e/<spec>.spec.ts` checks the feature under work in the browser. CMS, checkout and publication acceptance use the normal Local stack. See [local runtime](agent-reference.md#local-runtime).
- At completion, run `pnpm validate`. It formats changed files, runs affected module tests, package lint and type checks and the required architecture checks through Nx, and records source-bound evidence. `pnpm validate --plan` prints the task graph without running tasks. Boundary manifest/enforcement changes select `pnpm check:boundaries`; executable OpenSpec policy is not prose.
- [feedback-policy.json](../feedback-policy.json) decides what may run locally. Whole-project commands and an unfiltered `pnpm test:e2e` are refused without a maintainer grant, and agent hooks deny raw runners that bypass the refusal; both name the scoped command. CI is unaffected. [Validation feedback](validation-feedback.md) owns slots, formatting, cache inputs and recovery.
- `pnpm agent:check` checks local links, root package command names and the entry-point line budget in the agent entry points (`AGENTS.md`, `CLAUDE.md`) and these two agent documents, including `@import` targets. It does not crawl linked documents, check heading anchors, interpret shell programs or execute examples. Review semantic freshness when behavior changes.

## Acceptance matrix

Select rows by changed behavior, not only filename. Shared changes may need multiple rows. Tooling-only changes can mark product rows not applicable with a reason.

| Change                          | Existing checks and observed acceptance                                                                                                                                                                                                                                                                                                                                                                               | Evidence                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell/player/routing            | `pnpm test:app-shell` and `pnpm test:e2e e2e/<spec>.spec.ts` for the changed behavior: canonical routes, section navigation with focus/scroll reset, overlays, mobile navigation at 390px, player minimize/reopen/stop continuity, cart and console errors. Extend or add a spec for new shell behavior; the whole suite runs at PRD promotion. Inspect the browser only for visual, motion or performance judgement. | Local summary plus `.codex-artifacts/e2e/summary.json`; screenshots only for uncovered behavior. [Shell/player spec](../openspec/specs/app-shell-and-player/spec.md). |
| Staff/editor                    | Focused staff tests and local completion; confirm affected editing, preview and access behavior. Staff previews in Chromium and Firefox run at PRD promotion; `pnpm validate:editor` runs locally only under a maintainer grant.                                                                                                                                                                                      | Test output, and editor logs/reports with source and environment when run. [Workspace](content-workspace.md).                                                         |
| CMS/schema/publication          | Relevant Local checks from [publication](content-publication.md) and [workspace](content-workspace.md). Verify draft privacy, accepted revision/snapshot, ordering and restart reuse when affected. The existing `scripts/test-local-content-publication.mjs` creates Local content; target the intended fixture/stack.                                                                                               | Publication output, snapshot identity, request IDs and browser evidence. Local results do not prove hosted publication.                                               |
| Commerce/checkout/stock         | Affected backend/API tests and the existing Local mock scenario. Verify Worker authority, protected stock writes and checkout gates. [Commerce](commerce-operations.md) and [Stripe UAT](stripe-sandbox-uat.md) own prerequisites.                                                                                                                                                                                    | Test/mock logs and request IDs. Authorized hosted scenarios use `pnpm smoke:stripe-uat` and their smoke summaries; local validation never invokes them.               |
| Boundaries/tooling/instructions | `pnpm agent:check`, focused tests and `pnpm validate`. Boundary-policy changes select `pnpm check:boundaries`. Validate the OpenSpec change with `pnpm openspec -- validate <change-id> --type change --strict`.                                                                                                                                                                                                      | Source-bound summary and focused diagnostics. Product browser acceptance does not apply to tooling-only changes.                                                      |
| Release/environment             | [Environment model](environment-model.md) and [catalog promotion](catalog-promotion.md) define CI gates, candidate identity, immutable promotion and separate production confirmations. A push deploys UAT and verifies its release identity; PRD promotion first confirms UAT serves the candidate, then runs UAT static and provider smoke, staff previews and the whole e2e suite before any PRD mutation.         | Workflow run, full SHA, candidate/bundle identity and promotion acceptance evidence. Local success cannot approve promotion or launch.                                |

## Completion evidence

Read `.codex-artifacts/validation/<run>/summary.json` first, then the reported log for a failing phase. Smoke suites retain `.codex-artifacts/smoke/<environment>/<suite>/<run>/summary.json`, scenario `evidence.json` and screenshots. `pnpm test:e2e` writes `.codex-artifacts/e2e/summary.json` and keeps a trace, screenshot and `error-context.md` per failed test under `.codex-artifacts/e2e/test-results/`. Keep ignored artifacts in these existing locations.

In the change's validation note, record:

- Source SHA, matching before/after fingerprint, final summary path, `mode` and status.
- Product Environment and selected acceptance rows, including reasons for exclusions.
- Commands/checks and observed results, required behavior still unverified, and unresolved failures.
- Artifact paths, browser observations/screenshots, relevant snapshot/release identities and safe request IDs.

[Worker observability](worker-observability.md) connects `X-Request-Id` to structured events and defines redaction. Link compact evidence instead of copying successful logs or provider payloads.

Evidence covers only the source identity it recorded. A passed `mode: local` summary proves only selected repository checks; unrun browser/provider/release checks stay unverified. Documentation and OpenSpec change edits leave cached code tasks valid (an agent guidance edit also reruns the architecture check), so rerunning `pnpm validate` after writing the validation note is cheap; keep the final run pointer in ignored artifacts.

## Recurring friction

For repeated failures, update the existing command, instruction or fixture owner and add the smallest regression check that detects the problem. Use current timing/reporting and the scheduled unused-code audit to assess recurrence. Add a recurring job only for an observed maintenance need.
