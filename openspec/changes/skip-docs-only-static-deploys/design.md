## Context

`.github/workflows/pages.yml` currently starts on every push to `main`, builds and deploys both static targets, and completes successfully before `.github/workflows/uat-smoke.yml` redeploys the UAT Worker and runs provider smoke. Repository-only documentation and OpenSpec changes cannot alter either static artifact, so this work has no deploy value.

The trigger must stay conservative because Astro content collections contain deployable Markdown. A Conventional Commit type is also insufficient evidence: a `docs(...)` commit can include scripts or site content, and one push can contain several commits. Other agents are working in the same main worktree, so this change must remain isolated to its own OpenSpec directory until implementation and must re-read shared files immediately before editing.

## Goals / Non-Goals

**Goals:**

- Prevent UAT, PRD, and downstream UAT provider work after pushes containing only audited repository documentation.
- Trigger normally for mixed pushes, unknown paths, site content, build inputs, workflow changes, and runtime changes.
- Keep manual deployment available and retain every existing gate once the workflow starts.
- Add a small executable source-contract check without a new dependency.

**Non-Goals:**

- Infer deployment relevance from Conventional Commit types or GitHub skip tokens.
- Build a general monorepo change-classification framework.
- Optimize backend-only pushes or split CI from deployment in this slice.
- Change hosting targets, deploy jobs, UAT smoke behavior after a real deploy, or PRD commerce gates.

## Decisions

### Use native push path exclusions

Add a narrow `paths-ignore` list beneath the existing `push` trigger in `.github/workflows/pages.yml`:

- `docs/**`
- `openspec/**`
- root `*.md`
- root `LICENSE`

GitHub skips a path-filtered workflow only when every changed path matches an ignored pattern; any mixed or unknown path therefore keeps the current fail-open deployment behavior. `workflow_dispatch` remains a separate unfiltered event. This uses the platform feature documented in [Triggering a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow) and adds no action, script, or dependency.

Do not use `**/*.md`: `apps/web/src/content/artists/**`, `apps/web/src/content/releases/**`, and `apps/web/src/content/news/**` contain Markdown that changes the built site. Do not broaden the list to directories merely because they currently look inactive; unrecognized paths should deploy.

Alternatives rejected:

- Commit-message checks fail on misleading types, mixed commits, and multi-commit pushes.
- A positive deploy-path allowlist can silently miss a future build input.
- An in-workflow classifier still creates a successful upstream run, so the existing `workflow_run` listener would require additional coordination to avoid UAT Worker redeploy and smoke.
- Splitting validation and deployment workflows adds duplication and is unnecessary for the requested scope.

### Prevent downstream work by preventing the upstream run

Keep `.github/workflows/uat-smoke.yml` unchanged. A documentation-only push creates no `Deploy UAT and PRD static sites` run, so no matching `workflow_run` event exists. A successful deploy-relevant run continues to trigger UAT provider smoke exactly as today.

### Reuse environment-model validation

Extend `scripts/verify-environment-model.ts` with one exported helper that checks the narrow ignore patterns, preserved manual dispatch, absence of broad Markdown exclusion, and absence of commit-message coupling. Add focused accept/reject cases to `apps/backend/test/scripts/environment-model.test.ts`. The existing `pnpm environment:model:verify` and `pnpm check` paths then enforce the contract without parsing YAML or adding a package.

### Keep shared-worktree edits conflict-aware

Implementation starts with `git status --short --branch` and exact reads of the three target files. If another agent changed one, reconcile the latest content instead of overwriting it. Stage or commit only this change's explicit files; unrelated active OpenSpec and performance work remains untouched.

## Risks / Trade-offs

- GitHub evaluates path filters against at most the first 300 changed files → Keep the ignored set narrow, treat unusual large pushes as deploy-risk events, and use `workflow_dispatch` to force the latest commit when needed. Replace trigger filtering with a full-diff design only if large pushes become routine.
- Trigger-level filtering also skips the test/check jobs inside `pages.yml` for documentation-only pushes → Keep the repository's local OpenSpec and formatting gates mandatory. If server-side docs validation becomes required, add a separate lightweight validation workflow instead of coupling docs back to deployment.
- A future required `pull_request` check could remain pending when path-filtered → This workflow currently listens only to `push` and `workflow_dispatch`; reassess before adding a pull-request trigger.
- Some nested documentation outside the audited list will still deploy → This is intentional fail-open behavior. Add a path only after confirming it cannot affect build output.

## Migration Plan

1. Recheck shared-worktree state, then update the workflow trigger, verifier helper, focused tests, and the README statement that currently says every `main` push deploys UAT.
2. Run the focused environment-model test, `pnpm environment:model:verify`, YAML/workflow syntax validation available in the repo, OpenSpec strict validation, then `pnpm test:unit`, `pnpm check`, and `pnpm build` on the exact final tree.
3. After merge, observe one repository-documentation-only push: neither static deployment workflow nor downstream UAT provider smoke should exist for its SHA. Confirm a deploy-relevant or manual run still builds and deploys both targets.
4. Roll back by removing only the `paths-ignore` block. Use `workflow_dispatch` if the latest commit needs an immediate redeploy; no data migration exists.

## Open Questions

None.
