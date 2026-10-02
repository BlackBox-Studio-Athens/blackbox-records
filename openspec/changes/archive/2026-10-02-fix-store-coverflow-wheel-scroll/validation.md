# Validation

## Source and environment

- Product Environment: Local; managed worktree `coverflow-wheel-scroll`.
- Starting source SHA: `df2ceae0b8ac6934d1f44662e6e79ad189580905`, plus the implementation and change artifacts in this worktree.
- Controller SHA-256 before the fix: `316BFB7DB547244AC5FD1E87F9CA9ED3141EC48AB1F17DC6EF3457FF111C65B6`.
- Controller SHA-256 after the fix: `BCB3AE2C670D761BF81227163F2540F8E669BA077231330E64AAA46BCE70D17D`.
- Unit-test SHA-256: `4CAC6AF15B526A6D17B65C64C1C5289C05D4970EECE8C165C3491F52E901E2C2`.
- Browser-test SHA-256: `BDE2FD39429D4F643E82297DE53EA060505200F29BCD83EE819416EEEC578B96`.
- The ignored final result pointer `.codex-artifacts/validation/coverflow-wheel-scroll/final.json` records the final validation summary, source SHA, matching before/after fingerprint, and these code-file hashes without changing the validated tracked notes.

## Regression evidence

- Before implementation, Chrome advanced one cover and scrolled the page about 207px on the starting source.
- With regression assertions added and the controller unchanged, `pnpm test web-store` failed two propagation checks; its output is retained in `.codex-artifacts/validation/coverflow-wheel-scroll/red-unit.txt`.
- `pnpm test:e2e e2e/store-formats.spec.ts -g 'Coverflow wheel navigation'` failed for both All Store and Distro: an 8px wheel event moved the page by 8px. The original failure summary, screenshots, and traces are retained in `.codex-artifacts/e2e/coverflow-wheel-scroll-red/`.
- Adding propagation cancellation fixed cover hits. The first full browser run then identified the hidden inner stage's empty-space hit-test behavior; binding wheel ownership to the enclosing surface fixed that path as well.
- Final `pnpm test web-store`: 55 tests passed across six files, including touch behavior, accumulation, repeat throttling, Ctrl-wheel, zero-delta, Grid/search passthrough, and cleanup.
- Both new browser regressions pass with Lenis active: cover and gap wheel navigation holds page position over 750ms; input below the movement threshold also stays contained; outside-stage and Grid wheel input scroll the page normally.
- Strict OpenSpec validation passes with `pnpm openspec -- --allow-worktree validate fix-store-coverflow-wheel-scroll --type change --strict`.

## Acceptance coverage

The public shell acceptance row applies. The full Store formats browser suite covers canonical catalog order, filter/view changes, no-JavaScript fallback, responsive layout, and shell/player continuity. Its final result is recorded below. Provider, CMS publication, hosted environment, and release acceptance do not apply to this local wheel-input fix; no hosted work was performed.

The primary checkout's existing Graphify and CodeGraph results established the shared controller and callers before edits. The authorized worktree graph is built locally with AST extraction only and is refreshed after the final code batch. No API-backed enrichment or hooks were added.

## Final results

- `pnpm test:e2e e2e/store-formats.spec.ts`: six passed, zero skipped, zero unexpected failures, and zero flaky results. Summary: `.codex-artifacts/e2e/summary.json`.
- `pnpm validate`: all 18 selected tasks passed, including affected tests, web lint/type checks, formatting, environment, and architecture gates. The code validation run completed in 206.5s and retained `.codex-artifacts/validation/2026-10-02T13-53-52-796Z-85884-a5a01d/summary.json`, with `mode: local`, `status: passed`, and matching before/after fingerprint `a4d4f00b3778d319e9e1d58906feb70fe79d58e651b70a8e8b03a3124c23ecc0`.
- Validation is repeated after completing this note and the task checklist; the final result pointer above selects that documented tree. The implementation and browser-test hashes remain unchanged.
- Strict OpenSpec validation passes with the worktree opt-in. All four implementation tasks are complete.
- Graphify's final local AST refresh completed successfully after the controller change. It retained a pre-existing parse warning for `scripts/pages-workflow-contract.test.ts`; no graph enrichment was used.

No required local acceptance checks or unresolved failures remain. Hosted release acceptance was not requested.
