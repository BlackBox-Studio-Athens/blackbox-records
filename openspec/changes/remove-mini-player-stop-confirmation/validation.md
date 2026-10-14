# Local acceptance

The owner clarified on 15 October 2026: keep Stop and remove its confirmation. This request authorizes this scoped UI change, local commit, merge into local main and worktree removal. No push or deployment is authorized.

## Scope and behavior

Base: `3c59520a668d84c468e895f85060cbee769873d7`. The existing square Stop button keeps its accessible name and routes its first activation to the existing session teardown. Arming state, timer, confirmation copy and announcement are removed. No lifecycle, navigation or provider code changes.

The shell/player acceptance row applies. Unit coverage verifies the Stop routing attribute exists in the initial render and confirmation markup is absent. Browser coverage retains navigation, minimize/reopen, history, Store Item/information-page continuity and phone layout checks, and verifies one Stop activation removes the iframe and mini player. Provider embeds use the suite's local fixture; real provider controls and physical devices are not acceptance claims.

## Checks

- `pnpm test app-shell`: PASS, 45 files and 291 tests.
- `pnpm openspec -- validate remove-mini-player-stop-confirmation --type change --strict --allow-worktree`: PASS.
- `graphify update .`: PASS, local AST extraction. Existing SQL-parser and partial-extraction warnings do not affect this component's change.
- `pnpm test:e2e e2e/player-continuity.spec.ts`: PASS, all 12 cases across Chromium desktop, Chromium mobile and WebKit mobile; no skipped, unexpected or flaky cases. Final report: `.codex-artifacts/mini-player-stop-confirmation/e2e/summary.json` in main.
- `pnpm validate`: PASS, mode `local`, 15 tasks (13 cached in the automatic final pass). Summary: `2026-10-14T21-44-25-136Z-23364-f0df39/summary.json`; matching before/after source SHA is the base above and matching fingerprint is `427b4f66b426d90cc9dd849e717cd4873b3ed0c5657fc2ed047616fda2879577`. The runner detected the test edit and repeated its selection before accepting this result. The final documentation-only rerun and source identity are recorded in the integration receipt.

An initial browser run was interrupted after an added focus assertion failed: the original source control had left the document after navigation. That assertion was removed; the existing connected-source focus semantics remain unchanged. Only the final test-file rerun counts as browser acceptance.

## Integration

Unrelated agent-harness edits on local main are outside this change and must be preserved. Validation artifacts are retained under `.codex-artifacts/mini-player-stop-confirmation/` in the main checkout before this worktree is removed. Its `completion.json` records the final validation summary, source commit, merge and cleanup outcome. Hosted checks and release are excluded from this local-only request.
