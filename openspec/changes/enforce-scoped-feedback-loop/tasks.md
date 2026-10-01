# Tasks

## 1. Policy contract

- [x] 1.1 Add `feedback-policy.json` classifying every root command and stating slots, deny rules, grant and local-resource settings.
- [x] 1.2 Add `scripts/feedback-policy.mjs` (policy loader, shared state directory, grant check) with tests.

## 2. Runner: slots and converging validation

- [x] 2.1 Add `scripts/machine-slots.mjs` with exclusive slot files, PID reclaim and an arrival-order queue; test acquisition from two processes, reclaim and the wait message.
- [x] 2.2 Make `pnpm validate` take slots and pass the count as Nx parallelism; focused `pnpm test` takes a slot only when free.
- [x] 2.3 Set `NX_PLUGIN_NO_TIMEOUTS=true` in the wrapper environment and assert it.
- [x] 2.4 Format changed files before recording source identity in local mode; keep CI check-only.
- [x] 2.5 Identify source through git instead of hashing every tracked file; keep the summary shape and the benchmark caller working.
- [x] 2.6 Rerun the Nx command once when source changed during the run; report invalidated only after a second change.

## 3. CI

- [x] 3.1 Decide whether `check-candidate` can reuse the Nx cache between runs; record the finding (rejected: unsupported across runner machines) and keep the job uncached.
- [x] 3.2 Cache publication media by sha256 and use a cached file only when its digest matches; cover match, mismatch and absent cache.
- [x] 3.3 Remove staff previews from `prepare-prd`, Playwright quick checks from `deploy-uat-static` and the `smoke-uat` job from the push path; keep `verify-hosted uat`.
- [x] 3.4 Add promotion acceptance jobs (UAT identity, static smoke, provider smoke, staff previews, whole e2e) that `deploy-prd` needs.
- [x] 3.5 Add a weekly and manual uncached full-validation workflow.
- [x] 3.6 Update workflow contract tests, environment verification, `docs/environment-model.md` and `docs/catalog-promotion.md`; run `actionlint`.

## 4. Nx inputs

- [x] 4.1 Declare narrow inputs for `workspace:lint`, `architecture` and `environment`.
- [x] 4.2 Split `workspace:test-content` and `workspace:test-tooling` by what each test reads, keeping every test owned exactly once.
- [x] 4.3 Verify each narrowed task with a miss, hit, miss check and record the result.
- [x] 4.4 Assert in `scripts/check-module-projects.mjs` that a documentation-only change selects no code task.

## 5. Local resources

- [x] 5.1 Add `scripts/local-resources.mjs` with the per-worktree site port registry and tests.
- [x] 5.2 Use the assigned port in the foreground and background site launchers and in `playwright.config.ts`.
- [x] 5.3 Lease the full Local stack in `run-local-stack.mjs`.
- [x] 5.4 Add the Chrome lease hook and wire it for the Chrome tools.
- [x] 5.5 Add `pnpm local:status`.

## 6. Guards

- [x] 6.1 Add `scripts/feedback-guard.mjs` and `pnpm feedback:grant-full`; route release-tier root commands through the guard; apply it inside the validation wrapper.
- [x] 6.2 Add `scripts/run-e2e.mjs` so `pnpm test:e2e` requires a spec or title filter locally and takes a slot.
- [x] 6.3 Add `scripts/agent-hooks/command-guard.mjs`; wire it in `.claude/settings.json` and `.codex/hooks.json`; record denials.
- [x] 6.4 Carry the override in the committed run configurations that need it.
- [x] 6.5 Add the contract test that fails on an unclassified command, an unguarded release-tier command or a missing hook.

## 7. Instructions and measurement

- [x] 7.1 Shrink the completion guidance in `AGENTS.md`, `docs/agent-workflow.md`, `docs/agent-reference.md` and `docs/validation-feedback.md`; keep `pnpm agent:check` passing.
- [x] 7.2 Add `pnpm feedback:report` over the Nx task history.

## 8. Review fixes

- [x] 8.1 Remove the root package manifest from the inherited `toolchain` input; keep it for root tasks; guard against its return.
- [x] 8.2 Make a second validation of the same checkout wait for the first.
- [x] 8.3 Close matcher gaps: direct `nx affected`, runners by file path, bare package directories, release-tier validation modes, release-tier script files; drop the marker that could lock the maintainer out of granting.
- [x] 8.4 Fix the report test under the task runner, compute the contention minimum from successful runs, and summarize guard denials.
- [x] 8.5 Append validations, denials and e2e runs to one shared history log and report a weekly timeline.

## 9. Review and acceptance

- [x] 9.1 Parent review of every package for errors and inconsistencies; fix findings.
- [x] 9.2 Demonstrate: docs-only plan has no code task; two checkouts queue; guarded commands are denied and scoped ones run; a linked worktree uses its own port.
- [x] 9.3 Run `pnpm agent:check`, strict OpenSpec validation and final `pnpm validate`; write `validation.md` with before and after measurements and unobserved hosted behavior.
- [ ] 9.4 After `shorten-validation-release-feedback` is archived, add MODIFIED deltas for its two superseded requirements.
