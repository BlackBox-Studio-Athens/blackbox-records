# Validation

Base commit: `8a1a1677`. Commit `4d731ebf` on branch `claude/image-loading-performance-21ca0a` (worktree `checkout-compact-design-7a18c0`), local only.
Product Environment: Local, `astro dev` on `http://127.0.0.1:4321/blackbox-records/`, started by Playwright or by `pnpm site:dev:bg` and stopped after each run.

## Repository gates

- `pnpm test:app-shell`: 39 files, 179 tests pass.
- `pnpm test:e2e e2e/shell-navigation.spec.ts`: the new Store check fails before the fix on both projects and passes after it. The full spec passes against a warmed dev server: 6 passed, 2 skipped (desktop-only tests on the mobile project). Summary `.codex-artifacts/e2e/summary.json` (ignored).
- A first cold run failed the existing test "header section link swaps main in place and shows the delayed Store status": "Loading Store" stayed visible for 30 seconds while the dev server compiled pages in parallel. The test passed alone (39.6 s) and in the warmed full run, so this is dev-server compile time, not the change.
- `pnpm openspec -- --allow-worktree validate inert-shell-page-snapshots --type change --strict`: valid.
- Final `pnpm validate`: the run pointer is kept in `.codex-artifacts/image-delivery-fixes/final-validation.md` (ignored).

## Browser acceptance (Acceptance row: Shell/player/routing)

Image requests while loading Store and waiting two seconds after the shell mounts, without scrolling, in a fresh Chromium context; `<main>` holds 110 images.

| Viewport         | Before | After |
| ---------------- | ------ | ----- |
| 1440 × 900       | 111    | 33    |
| 390 × 844 mobile | 130    | 19    |

Section navigation, overlays, the mobile navigation sheet and history restoration pass in the same spec; snapshot HTML is unchanged, so cached restoration and first-screen image waits behave as before.

## Not verified

- Hosted UAT/PRD measurement after release; expected to match the Local drop (PRD before: 136 of 137 Store images on a phone).
- Firefox and Safari; the defect was measured in Chromium only.
