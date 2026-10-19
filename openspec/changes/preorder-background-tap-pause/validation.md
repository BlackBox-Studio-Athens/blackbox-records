# Local acceptance

Prepared in `C:/Users/SVall/.codex/worktrees/preorder-tap-pause/blackbox-records` from `59f20954c1ea5b6c33024777e9a80368e4aac85b` on 19 October 2026. User approved this exact invisible background-film interaction and a focused local commit. Main, hero, checkout and provider controls were not edited. Coordinator owns integration.

## Evidence

- `pnpm test apps/web/src/components/store/StorePreorderShowcase.test.tsx`: all six affected test projects passed. Final repository validation also passed the affected source/tests.
- `pnpm test:e2e e2e/preorder-tap-pause.spec.ts e2e/home-preorders.spec.ts --project=chromium-desktop --project=chromium-mobile --grep 'preorder (film|direct|keyboard|manual|pause|failed|clip)'`: 26/26 passed, with no retries, in 3.4 minutes. This covers all 18 dedicated cases and eight existing media-lifecycle cases. `browser-final.json` supersedes the earlier split reports.
- The dedicated suite uses real Local film assets and stubbed listening/full-video provider documents at desktop 1440px and touch 390px. It verifies tap/click, Enter/Space, keyboard-only focus, frozen rather than hidden frames, manual-pause persistence through another record and live clip changes, hidden tabs/music sessions/full video, actual artist/Listen/Watch/chapter/purchase behavior, rejected moved/cancelled gestures, native touch scrolling, pause during cold loading, and reduced-motion/data-saving restrictions.
- Paused screenshots were visually inspected: no icon, caption or persistent control appears, and composition is preserved. `.codex-artifacts/preorder-tap-pause/mobile-paused.png` and `desktop-paused.png` retain these views. `source-hashes.json` binds the four source/test files to the browser reports.
- `pnpm openspec -- --allow-worktree validate preorder-background-tap-pause --type change --strict`: passed.
- `graphify update .`: passed after the code/test batch, local AST only. Primary Graphify/CodeGraph provided component/caller context; this worktree has no CodeGraph index. Graphify retained its existing SQL-parser and unrelated contract-test parse limitations.
- Earlier `pnpm validate` passed 62 tasks across 48 selected projects, `mode: local`, in 501.7 seconds including one automatic rerun after a test edit. Its before/after fingerprint is `1428eb1942ca13489a21153e695292a3a953e26fdcea5ddd39670830c14def00`, `sourceChanges: []`; summary `.codex-artifacts/validation/2026-10-19T13-51-05-525Z-46560-26c509/summary.json`. This historical run precedes the final clip-frame guard and is superseded by the final receipt.
- After recording this note, the final `pnpm validate` pointer, matching fingerprint, source hashes and commit identity are retained in `.codex-artifacts/preorder-tap-pause/completion.json`. Final browser evidence is preserved as `browser-final.json` in that directory.

The first browser iteration exposed and fixed touch pointer-leave ordering; a separate retry collided with a shutting-down test-owned server and was discarded. Keyboard tests explicitly expose the focused film above the existing visibility threshold before asserting automatic playback. All accepted browser evidence uses the final implementation.

## Acceptance scope and integration

Selected acceptance: public UI/media and shell/player interactions under Local fixtures. Pointer focus has no new visible treatment; keyboard focus has an inset outline. Text and actions are siblings of the film button, not nested inside it. Manual pause is independent per slug-keyed chapter and clip; ordinary automatic restrictions remain authoritative.

Read-only comparison with current main found one actual overlapping file: `apps/web/src/styles/global.css`. This patch adds only `.home-preorders__ambient-toggle` and its focus rule near pre-order media styles, so checkout edits in the same file are separate hunks. The navigation coordinator may also touch `apps/web/src/components/store/StorePreorderShowcase.tsx`; this media patch does not change the history adapter. Existing markup assertions change only the removed-control assumptions in `StorePreorderShowcase.test.tsx`. The unique browser spec and this change directory are new.

No physical phone, actual Safari/Firefox, real provider playback, hosted deployment, publication or release acceptance was performed. No merge, cherry-pick, push or deployment is authorized for this worktree. The hero/controller and All → Filter → Vinyl 12-inch → Distro behavior are outside this patch.
