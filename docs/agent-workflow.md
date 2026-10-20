# Blackbox task acceptance

Use this document to choose project checks and record evidence. [Project references](agent-reference.md) supply task-specific edit points and runtime constraints.

## Task state

For a substantive change, use its existing OpenSpec proposal, tasks and delta specs. Record the outcome, observable acceptance criteria, affected modules, material decisions and remaining work there. A validation note in the same change links the evidence. Do not create a parallel planning directory or task database.

Domain specs describe intended behavior; the module-boundary manifest is executable policy. Source and runtime observations establish current behavior. Resolve disagreements before recording acceptance.

## Iteration and local completion

- While editing, run `pnpm test <module|file>` or keep `pnpm test:watch <module>` running; results are partial. Public frontend work reuses this checkout's site and hot updates; `pnpm test:e2e e2e/<spec>.spec.ts` checks the feature under work in the browser. CMS, checkout and publication acceptance use the normal Local stack. See [local runtime](agent-reference.md#local-runtime).
- At completion, run `pnpm validate`. It formats changed files, runs affected module tests, package lint and type checks and the required architecture checks through Nx, and records source-bound evidence. `pnpm validate --plan` prints the task graph without running tasks. Boundary manifest/enforcement changes select `pnpm check:boundaries`; executable OpenSpec policy is not prose.
- [feedback-policy.json](../feedback-policy.json) decides what may run locally. Whole-project commands and an unfiltered `pnpm test:e2e` are refused without a maintainer grant, and agent hooks deny raw runners that bypass the refusal; both name the scoped command. CI is unaffected. [Validation feedback](validation-feedback.md) owns slots, formatting, cache inputs and recovery.
- Use the installed `act` tool only for a requested workflow rehearsal or CI-only diagnosis. [Local Actions rehearsal](validation-feedback.md#local-actions-rehearsal) documents manual commands and known limits; keep `pnpm test` and `pnpm validate` as the ordinary feedback loop.
- `pnpm agent:check` checks local links, root package command names and the entry-point line budget in the agent entry points (`AGENTS.md`, `CLAUDE.md`) and these two agent documents, including `@import` targets. It does not crawl linked documents, check heading anchors, interpret shell programs or execute examples. Review semantic freshness when behavior changes.

## Acceptance matrix

Read the [behavior acceptance matrix](agent-acceptance.md) for affected behavior. Select by behavior, not filename; tooling-only work may exclude product rows with a reason.

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
