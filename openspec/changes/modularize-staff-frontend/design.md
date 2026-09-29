# Design

## Context

The backend and web apps were split into Nx module projects by `shorten-validation-release-feedback`. Staff was left as one module, so the module-scoped test loop did not help staff work. See `proposal.md` and the delta spec.

## Goals / Non-Goals

**Goals:** Acyclic closed staff modules using the existing manifest, `project.json` and `scripts/module-test-projects.ts` machinery, with no behavior change.

**Non-Goals:** Per-module lint or `astro check` (both need package-wide type information), a separate `staff-api` module, new tooling, or changes to routes, styles or the release flow.

## Decisions

- **Modules** (all `closed`, tags `module`, `scope:staff`), layered `ui` ← `platform` ← {`orders`, `publication`} ← {`shell`, `stock`} ← `content` ← root:

  | Project             | Root under `apps/staff/src`                        | Allowed staff deps                  |
  | ------------------- | -------------------------------------------------- | ----------------------------------- |
  | `staff-ui`          | `components/ui`                                    | none                                |
  | `staff-platform`    | `lib`                                              | ui                                  |
  | `staff-orders`      | `components/orders`                                | ui, platform                        |
  | `staff-publication` | `components/publication`                           | ui, platform                        |
  | `staff-shell`       | `components/shell`                                 | ui, platform, publication           |
  | `staff-stock`       | `components/stock`                                 | ui, platform, publication           |
  | `staff-content`     | `components/content`                               | ui, platform, publication, stock    |
  | `staff-frontend`    | `.` (pages, layouts, `StaffOverview`, root styles) | all, also as `implicitDependencies` |

  Shell lazy-loads publication history and the editor lazy-loads stock's catalog selling, so the editor is the top feature and shell and stock never depend on it. `staff-publication` is the fan-in hub: an edit there runs four test tasks.

- **Moves that remove cycles:** `lib/utils.ts` to `components/ui/utils.ts` (otherwise ui imports platform while `StaffBack` imports ui); `StaffBack` and `use-draft-autosave` into `lib/`; `internal-order-api` and its test into `components/orders/`; publication components, previews, validation, selection, `WebsiteChanges` and `content.css` into `components/publication/`; `youtubeVideoId` from `ContentFields` into `content-validation.ts`; `StaffShell` and `ReviewChangesControl` into `components/shell/`; item-setup files, `WebsitePages` and editor/media styles into `staff-content`. Only import paths change.
- **Config:** each test-bearing module copies the existing staff `project.json` test targets with its own `--project`; the manifest gains one entry per module with `providedEntrypoints` limited to files another module imports; roots come from the nested projects. `apps/staff/package.json`, Nx config and validation scripts are unchanged because nested-root discovery and the transitive graph already cover them.
- **Moving files:** a scratch Node codemod does `git mv` and rewrites relative specifiers (`from`, `import()`, bare `import`, keeping `?inline` and `.ts`) from a per-step `{old: new}` map. WebStorm has no move-file refactoring and its patch tool leaves importers stale. `astro check`, tests and the architecture check verify each step.
- **Architecture test:** loops over manifest modules whose `project` starts with `apps/staff/src/`, so it holds before, during and after the split.
- **One commit per carve step**, squashed at the end without pushing.

## Alternatives Considered

- Per-module lint or `astro check`: both need whole-package type information, so they stay package-level.
- A separate `staff-api` module: `internal-order-api` fits in orders and the rest of `lib` is platform; another module adds a layer with no consumer.
- WebStorm move refactoring: unavailable, see above.

## Measurements

Baseline at `5d269954`, after at `82a3da9f` (raw logs in `.codex-artifacts/staff-modules/{baseline,after}/`). Timings are single uncontended runs on a noisy Windows machine; identical reruns varied by up to 40%, so treat differences under about 20% as noise.

| Metric                                                  | Before                   | After                                                                               |
| ------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `pnpm test:staff` wall / Vitest duration                | 17.5s / 15.04s           | 14.8s / 13.37s                                                                      |
| Import / tests / transform time                         | 10.05s / 0.674s / 0.999s | 8.50s / 0.673s / 1.75s                                                              |
| `nx run-many -t test --projects="tag:scope:staff"` cold | n/a (one task)           | 19.9s (6 tasks, 3 parallel)                                                         |
| Single module cold, `nx run <m>:test --skip-nx-cache`   | 17.5s (whole suite)      | orders 4.3s, platform 5.5s, stock 7.9s, content 8.2s, publication 9.9s, shell 10.8s |
| Same module cached (`staff-orders`)                     | n/a                      | cache hit, 2.9s wall (339ms Nx)                                                     |
| `pnpm build:staff` wall                                 | 21.2s                    | 16.1s                                                                               |

Per-edit test tasks (`nx show projects --affected --withTarget=test`, staff projects only):

| Edited file                                    | Before | After | Staff projects run                                                  |
| ---------------------------------------------- | ------ | ----- | ------------------------------------------------------------------- |
| `components/orders/OrderDetail.tsx`            | 1      | 1     | orders                                                              |
| `components/stock/stocktake.ts`                | 1      | 2     | stock, content                                                      |
| `components/content/ContentFields.tsx`         | 1      | 1     | content                                                             |
| `components/ui/button.tsx`                     | 1      | 6     | ui dependents: platform, orders, publication, shell, stock, content |
| `components/publication/PublicationStatus.tsx` | 1      | 4     | publication, shell, stock, content                                  |

Every affected list also contains `backend-tooling`, `web-tooling` and `workspace`; these repository-wide tooling projects depend on all staff files and appear for any staff edit (not measured before the split). A module edit now reruns 1 to 6 tasks of 0.3 to 10s instead of one 15s suite; a full run is about as slow as before because each module pays its own Vitest startup, so the gain is the edit loop and caching, not the full suite.

Slowest files (unchanged): `staff-navigation.test.ts` 271ms, `order-workspace.test.tsx` 87ms, `StaffShell.test.tsx` 41ms.

Eager route graphs (`performance:bundles --scope=staff`, brotli bytes against the JS budget):

| Route    | Baseline | Budget  | After   |
| -------- | -------- | ------- | ------- |
| overview | 121,231  | 122,880 | 121,233 |
| website  | 150,305  | 176,128 | 150,310 |
| stock    | 153,039  | 153,600 | 153,058 |
| orders   | 126,267  | 128,000 | 126,259 |

Route isolation and bundle budgets pass; sizes are unchanged within 20 bytes.

### Experiments

- **`isolate: false` (rejected).** Results were identical (19 files, 88 tests) in every run, including eight `--sequence.shuffle` runs. Wall time was noisy: shuffled runs averaged about 12.5s (16% below the 14.8s reference) and unshuffled runs about 9.7s (35% below), so the gate of 30% under shuffle failed. Single modules improved unevenly: `staff-publication` 9.1s to 4.9s, `staff-content` about 7s either way. Shared module state across test files is a leak risk for a gain the gate could not confirm, so the setting was reverted.
- **`check:fast` (rejected).** `tsc --noEmit -p .` took 11.2s on both runs (gate: 10s) and reported two errors on the clean tree that `astro check` (24.8s, 0 errors) does not: an unused `@ts-expect-error` in `packages/content-model/src/prose.ts` and a missing `vitest/node` export in `scripts/module-test-projects.ts`, both pulled in by the `**/*` include. Fixing them would need ignores or config changes, so the script was not added.

## Risks

- Every staff edit still pays package-level typecheck, lint and build inside `pnpm validate`; only the module test loop gets faster unless `check:fast` is adopted.
- Overview, orders and stock bundles have under 1.5% budget headroom; the split must not add eager chunks to them.
- The Linux CI boundary-fixture failure from the handoff is unrelated and needs its own fix before any push.

### Paired benchmark

`5d269954` (before) and `570577dc` (after) were run 3 times each. Runs alternated between before and after, caching was off, and each side had a warm-up run. The command for single-file edits was `nx affected -t test --files=<f>`, excluding the repository-wide tooling projects. All 56 runs passed. Raw data is in `.codex-artifacts/staff-modules/bench/`. Values are medians.

| Scenario                         | Before | After  | Result                   |
| -------------------------------- | ------ | ------ | ------------------------ |
| Edit `orders/OrderDetail.tsx`    | 21.9s  | 7.5s   | about 3× faster          |
| Edit `stock/stocktake.ts`        | 24.3s  | 9.0s   | about 2.7× faster        |
| Edit `content/ContentFields.tsx` | 25.0s  | 9.0s   | about 2.8× faster        |
| Edit `ui/button.tsx`             | 28.1s  | 22.0s  | no measurable difference |
| Cached rerun (orders edit)       | 4.3s   | 4.3s   | same                     |
| All staff tests                  | 21.0s  | 18.6s  | no measurable difference |
| `pnpm validate:full --no-cache`  | 423.2s | 435.7s | no measurable difference |

A result is "no measurable difference" when the before and after min–max ranges overlap.
