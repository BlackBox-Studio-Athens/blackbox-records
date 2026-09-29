## 1. Baseline and specification

- [x] Record pre-split test timings and bundle sizes in `design.md` and `.codex-artifacts/staff-modules/baseline/`.
- [x] Author this change and rewrite the staff manifest architecture test to pass before and after the split.
- [x] Add the staff module line to `docs/agent-reference.md`.

## 2. Carve modules

One commit per step. Each step runs `pnpm test <module>`, `pnpm test:staff`, `nx run workspace:architecture` and scoped eslint.

- [x] 2.1 `staff-ui`: move `lib/utils.ts`, update `components.json` and the shadcn note in `docs/content-workspace.md`.
- [x] 2.2 `staff-platform`: `lib` with `StaffBack` and `use-draft-autosave`.
- [x] 2.3 `staff-orders`: including `internal-order-api` and its test.
- [x] 2.4 `staff-publication`: publication components, `content.css` and `youtubeVideoId`; also run `pnpm --filter @blackbox/staff check`.
- [x] 2.5 `staff-stock`, then `staff-shell`.
- [x] 2.6 `staff-content`: styles and item setup; drop the root test target; confirm the `staff-content` to `staff-stock` and `staff-shell` to `staff-publication` edges in the Nx graph.

## 3. Experiments

Run after the carve, on an uncontended machine. Record numbers either way; keep only what passes.

- [x] 3.1 `isolate: false` for staff Vitest: identical results over three `--sequence.shuffle` runs and at least 30% faster. Rejected: gate not met.
- [x] 3.2 `check:fast` (`tsc --noEmit -p .`): passes clean, fails a seeded `.tsx` error, takes 10s or less. Rejected: 11.2s and two errors on the clean tree.

## 4. Verify and finish

- [x] 4.1 Fill the "After" measurements and goal verification in `design.md`.
- [x] 4.2 Run `nx run workspace:architecture`, `pnpm check` (covered by `pnpm validate` affected lint and typecheck), `pnpm --filter @blackbox/staff check`, `pnpm build:staff`, `pnpm validate`, `pnpm validate:editor`, `pnpm audit:unused`, `git diff --check` and `graphify update .`.
- [x] 4.3 Squash to one commit with `git reset --soft 5d269954`; do not push.
