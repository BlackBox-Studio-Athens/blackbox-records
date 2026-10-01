# Validation

Base commit: `aaed80b3` (local `main`), rebased on 2026-10-01 from `21e63c1a`, where the first runs below were made. Branch `claude/xenodochial-feynman-abcd02` (worktree `xenodochial-feynman-abcd02`), for a fast-forward into local `main`; not pushed.
Product Environment: Local, `astro dev` from this worktree on `http://127.0.0.1:4331/blackbox-records/`. Port 4321 was held by the `astro dev` of worktree `press-email-change-443090`, so Playwright ran with an ignored override config (`.codex-artifacts/playwright.side.config.ts`: base URL on 4331, no web server).

## Repository gates

- `e2e/shell-islands.spec.ts` before the fix: fails at the restored Who we are form, which still holds the email typed before leaving. With that assertion removed, Subscribe sends no request and the status stays empty, because no React handler is attached. After the fix: passes, including Home (the initial document) and the fixture's zero page-error and console-error checks, so the restored islands hydrate without mismatch warnings.
- `pnpm test:app-shell`: 194 tests pass, including the new restore unit test.
- Full Playwright suite (`pnpm test:e2e` specs through the override config): 41 passed, 5 skipped (desktop-only and mobile-only tests on the other project). Log: `.codex-artifacts/rehydrate/e2e.log` (ignored).
- `pnpm openspec -- --allow-worktree validate rehydrate-cached-shell-islands --type change --strict`: valid.
- After the rebase, which brought main's About copy buttons (shell-owned DOM, not an island, with their own snapshot reset): `pnpm test:app-shell` passes 197 tests and the full Playwright suite passes 42 with 5 skipped, including main's `e2e/about-contact.spec.ts`. Logs: `.codex-artifacts/rehydrate/*-rebased.log` (ignored).
- Final `pnpm validate`: run pointer in `.codex-artifacts/rehydrate/final-validation.md` (ignored).

## Acceptance rows

- Shell/player/routing: covered by the e2e and app-shell runs above. The change touches only snapshot HTML for `astro-island` elements; player, overlays and history are unchanged and their specs pass.
- Other rows do not apply: no CMS, commerce, boundary or release change.

## Not verified

- Hosted UAT/PRD, Firefox and Safari.
- Old React roots are still not unmounted when the shell replaces `<main>` (Astro unmounts islands only on its own `astro:after-swap`). This predates the change and does not affect behavior seen here.
