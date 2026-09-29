# Blackbox task acceptance

Use this document to choose project checks and record evidence. [Project references](agent-reference.md) supply task-specific edit points and runtime constraints.

## Task state

For a substantive change, use its existing OpenSpec proposal, tasks and delta specs. Record the outcome, observable acceptance criteria, affected modules, material decisions and remaining work there. A validation note in the same change links the evidence. Do not create a parallel planning directory or task database.

Domain specs describe intended behavior; the module-boundary manifest is executable policy. Source and runtime observations establish current behavior. Resolve disagreements before recording acceptance.

## Iteration and local completion

- Run `pnpm test` (tests reached by your working-tree changes), `pnpm test <file>`, or `pnpm test:watch <file>` while editing; `pnpm validate` before completion; these are iteration commands and their results are partial.
- Public frontend work reuses the site and hot updates. CMS, checkout and publication acceptance use the normal Local stack. See [local runtime](agent-reference.md#local-runtime).
- `pnpm validate` uses the Nx project graph to select affected module tests and package-level lint/type checks, plus required architecture checks, and records source-bound evidence. `pnpm validate --plan` prints the native task graph without running tasks. Boundary manifest/enforcement changes select `pnpm check:boundaries`; executable OpenSpec policy is not prose.
- `pnpm agent:check` checks local links, root package command names and the entry-point line budget in these three agent documents. It does not crawl linked documents, check heading anchors, interpret shell programs or execute examples. Review semantic freshness when behavior changes.
- Full tests, checks and target builds remain CI gates. `pnpm validate:full` runs module-level tests and package-level lint, type and build targets through Nx `run-many`; this avoids rerunning TypeScript-aware lint for every source module. Nx local caching is enabled by default with at most three tasks in parallel; `--no-cache` only disables cache reuse and does not broaden selection. [Validation feedback](validation-feedback.md) owns selection, cache behavior and recovery.

## Acceptance matrix

Select rows by changed behavior, not only filename. Shared changes may need multiple rows. Tooling-only changes can mark product rows not applicable with a reason.

| Change                          | Existing checks and observed acceptance                                                                                                                                                                                                                                                                                 | Evidence                                                                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell/player/routing            | `pnpm test:app-shell`; inspect desktop header/footer and mobile navigation, scroll/focus reset, open/minimize/reopen/stop player, overlay continuity and console errors on affected routes.                                                                                                                             | Local summary plus browser observations/screenshots. [Shell/player spec](../openspec/specs/app-shell-and-player/spec.md).                               |
| Staff/editor                    | `pnpm validate:editor` in addition to local completion; confirm affected editing, preview and access behavior.                                                                                                                                                                                                          | Editor logs/reports with source and environment. [Workspace](content-workspace.md).                                                                     |
| CMS/schema/publication          | Relevant Local checks from [publication](content-publication.md) and [workspace](content-workspace.md). Verify draft privacy, accepted revision/snapshot, ordering and restart reuse when affected. The existing `scripts/test-local-content-publication.mjs` creates Local content; target the intended fixture/stack. | Publication output, snapshot identity, request IDs and browser evidence. Local results do not prove hosted publication.                                 |
| Commerce/checkout/stock         | Affected backend/API tests and the existing Local mock scenario. Verify Worker authority, protected stock writes and checkout gates. [Commerce](commerce-operations.md) and [Stripe UAT](stripe-sandbox-uat.md) own prerequisites.                                                                                      | Test/mock logs and request IDs. Authorized hosted scenarios use `pnpm smoke:stripe-uat` and their smoke summaries; local validation never invokes them. |
| Boundaries/tooling/instructions | `pnpm agent:check`, focused tests and `pnpm validate`. Boundary-policy changes select `pnpm check:boundaries`. Validate the OpenSpec change with `pnpm openspec -- validate <change-id> --type change --strict`.                                                                                                        | Source-bound summary and focused diagnostics. Product browser acceptance does not apply to tooling-only changes.                                        |
| Release/environment             | [Environment model](environment-model.md) and [catalog promotion](catalog-promotion.md) define full CI gates, candidate identity, hosted smoke, immutable promotion and separate production confirmations.                                                                                                              | Workflow run, full SHA, candidate/bundle identity and hosted smoke. Local success cannot approve promotion or launch.                                   |

## Completion evidence

Read `.codex-artifacts/validation/<run>/summary.json` first, then the reported log for a failing phase. Smoke suites retain `.codex-artifacts/smoke/<environment>/<suite>/<run>/summary.json`, scenario `evidence.json` and screenshots. Keep ignored artifacts in these existing locations.

In the change's validation note, record:

- Source SHA, matching before/after fingerprint, final summary path, `mode` and status.
- Product Environment and selected acceptance rows, including reasons for exclusions.
- Commands/checks and observed results, required behavior still unverified, and unresolved failures.
- Artifact paths, browser observations/screenshots, relevant snapshot/release identities and safe request IDs.

[Worker observability](worker-observability.md) connects `X-Request-Id` to structured events and defines redaction. Link compact evidence instead of copying successful logs or provider payloads.

Source changes invalidate completion evidence. A passed `mode: local` summary proves only selected repository checks; unrun browser/provider/release checks stay unverified. Write tracked handoff notes before final validation and retain the final run pointer in ignored artifacts so recording it does not alter the tested source.

## Recurring friction

For repeated failures, update the existing command, instruction or fixture owner and add the smallest regression check that detects the problem. Use current timing/reporting and the scheduled unused-code audit to assess recurrence. Add a recurring job only for an observed maintenance need.
