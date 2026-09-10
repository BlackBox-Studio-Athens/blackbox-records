## 1. Shared-worktree safety

- [x] 1.1 Run `pnpm openspec:guard` and `git status --short --branch`, then exact-read `.github/workflows/pages.yml`, `scripts/verify-environment-model.ts`, `apps/backend/test/scripts/environment-model.test.ts`, and `README.md`; reconcile any concurrent edits before changing a shared file.
- [x] 1.2 Confirm the implementation diff and staging scope exclude unrelated active changes, especially `openspec/changes/catalog-discovery-and-information-architecture/` and performance work already present on `main`.

## 2. Trigger contract regression coverage

- [x] 2.1 Add an exported static-deploy-trigger source verifier in `scripts/verify-environment-model.ts` that accepts the narrow documentation path exclusions plus `workflow_dispatch`, and rejects `**/*.md`, missing manual dispatch, or commit-message coupling.
- [x] 2.2 Add focused accept/reject cases in `apps/backend/test/scripts/environment-model.test.ts`, then run that test and confirm `pnpm environment:model:verify` exposes the current missing trigger policy before the workflow fix.

## 3. Static deployment trigger

- [x] 3.1 Add native `on.push.paths-ignore` entries for `docs/**`, `openspec/**`, root `*.md`, and root `LICENSE` in `.github/workflows/pages.yml`; leave `workflow_dispatch`, jobs, permissions, gates, artifacts, targets, and concurrency unchanged.
- [x] 3.2 Run the focused environment-model test and `pnpm environment:model:verify`; confirm a narrow docs-only fixture skips while mixed, unknown, and `apps/web/src/content/**/*.md` paths remain deploy-relevant.
- [x] 3.3 Update `README.md` so UAT/PRD automation is described as running on deploy-relevant `main` pushes, with documentation-only pushes skipped and manual dispatch retained.
- [x] 3.4 Run `pnpm exec prettier --check .github/workflows/pages.yml scripts/verify-environment-model.ts apps/backend/test/scripts/environment-model.test.ts README.md` to validate the edited YAML and source formatting.

## 4. Repository verification

- [x] 4.1 Run `pnpm openspec -- validate skip-docs-only-static-deploys --type change --strict` and `pnpm openspec -- validate --all --strict`.
- [x] 4.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final tree.
- [x] 4.3 Re-run `git status --short --branch` and a scoped diff; verify only this change's planned files changed and no other agent's files are staged or overwritten.

## 5. Hosted trigger proof

- [x] 5.1 Confirm the deploy-relevant implementation push still creates the shared static workflow, deploys both static targets after existing gates, and starts downstream UAT provider smoke only after success.
- [x] 5.2 On the next natural repository-documentation-only push, verify by commit SHA that no shared static deployment run and no downstream UAT provider smoke run were created; do not synthesize provider work only to prove the skip.
- [x] 5.3 Record hosted evidence and rollback instructions: remove only the `paths-ignore` block to restore every-`main`-push behavior, and use `workflow_dispatch` for an immediate forced redeploy.

## Hosted evidence

- Deploy-relevant implementation reached successful UAT/PRD static deployment in workflow run `29193549924` after existing gates; downstream UAT provider smoke `29193646045` passed.
- Natural documentation-only follow-up push `1e547071` created no push-triggered static deployment run; its only provider-smoke event came from an explicit manual-dispatch probe. The final task-update push is the clean skip proof; no dispatch follows it.
- Rollback: remove only the `paths-ignore` block. Force a redeploy with `workflow_dispatch`.
