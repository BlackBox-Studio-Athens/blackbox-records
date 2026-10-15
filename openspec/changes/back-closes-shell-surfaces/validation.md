# Local acceptance

Scope: implement on the existing main checkout, without worktree, commit, push, publication or deployment. Protected harness files and concurrent design changes are outside this task's edits.

## Reproduction and causes

- Pre-fix Chromium desktop and phone tests confirmed Back left Store with Crate or Artists open. A corrected video fixture confirmed Back left Home in Chromium and WebKit. Initial reproduction logs are retained under `C:/Users/SVall/AppData/Local/rtk/tee/1792055911_test.log` and `1792056022_test.log`.
- The initial release-listing offset probe passed at 700 px on desktop Chromium, phone Chromium and phone WebKit, including nested release/artist history. The precise original scroll-loss reproduction was not established in this session. Inspection found a concrete stale-focus path: `ShellOverlayPanel` called `onReady` when its state changed to null, scheduling content focus while the connected exit panel remained mounted. Shared scheduling now checks that the overlay is still open and uses `preventScroll` when focusing Close. A unit regression covers an overlay closing between scheduling and the frame while its container remains connected. Nested details retain the original listing trigger.
- Crate previously replaced the page's state with its digging record without pushing a dismissible entry. Artists and full video did not add entries. Their markers now use the existing shared primitives and are dispatched by the existing shell popstate router after player/sheet handling. Close controls traverse Back. Crate retains its record, original Grid offset and the explicit Grid button's return-to-record behavior. Video restores Watch focus on the next frame after Back.
- Rapid Back/Forward exposed a separate stale-snapshot race: the existing navigator returned early for the still-rendered page without cancelling the pending outgoing activation. That path now aborts and resets the transition; a unit regression holds the outgoing frame wait until the return completes.

## Surface audit

Searched `apps/web/src` for `role="dialog"`, `aria-modal`, native dialogs, `showModal`, and Radix Dialog/Sheet usage. Active public surfaces are detail overlays, the persistent player, cart drawer, phone Menu and Artists. The first four already participate in shell history; Artists is covered here. Store image galleries are inline carousels. Native Home next-chapter anchor links are unchanged.

## Runtime and fixtures

The initial browser runs reused the existing Local server with its custom three-pre-order projection. The broader Home suite requires the standard expected shipping month, so that run was stopped and `pnpm site:dev:stop` successfully stopped server PID 42556. Subsequent runs use the Playwright-configured `e2e/preorder-projection.json`. The full-video case mounts the real Home component with a video supplied by a client-only Astro fixture, without changing catalog content; provider iframe content is intercepted locally.

Acceptance rows: shell/navigation, modal dismissal, overlay focus/scroll, player continuity and Store interaction. CMS, provider, publication, asset and release acceptance are excluded because this change does not alter those authorities. Browser engines emulate phone input; no physical-device acceptance is claimed.

## Checks

The final source-bound completion receipt is `.codex-artifacts/e2e/back-history/completion.json`. It records the final documentation-bound validation identity and browser command results. Browser logs are isolated here because another concurrent local test run overwrote the shared default E2E summary.

- `pnpm test app-shell`, `pnpm test web-store`, `pnpm test web-platform`: exit 0. Final affected unit reports establish 294, 143 and 74 passed tests respectively, with zero failed tests. The reports are in `.codex-artifacts/validation/2026-10-15T09-49-39-637Z-31344-320ebb/{app-shell,web-store,web-platform}.json`; current inputs were subsequently accepted through matching Nx cache entries by the passing completion run.
- `pnpm test:e2e e2e/shell-navigation.spec.ts e2e/store-crate.spec.ts --grep 'rapid Back|Back preserves|Back closes|bins remember|Back from an item|News precedes' --project=chromium-desktop --project=chromium-mobile --project=webkit-mobile`: 21 passed, 2 skipped, exit 0. Covers all new Back behavior plus the existing Menu/cart, return-to-record and return-from-item regressions. Desktop skips phone-only cases.
- `pnpm validate`: PASSED, 56 tasks / 54 cached, exit 0. Summary `.codex-artifacts/validation/2026-10-15T10-05-03-219Z-27904-3472e7/summary.json`, mode `local`, SHA `4ad90e4324c4d3583bb43c7a6fab0c70534e99a7`, before/after fingerprint `3fcf77207688e8005670ef6108ea9fcba439a457c1269aa23cfd31e3acc3a4bb`, no source changes. Final evidence-document edits receive a subsequent validation receipt.
- `pnpm openspec -- validate back-closes-shell-surfaces --strict`: `Change 'back-closes-shell-surfaces' is valid`, exit 0.
- `git diff --check`: exit 0.
- Firefox retry: `pnpm test:e2e e2e/home-preorders.spec.ts --project=firefox-desktop --grep 'Greece delivery correction' --workers=1 --reporter=list --output=.codex-artifacts/e2e/back-history/firefox-results`: 1 passed, exit 0. Log: `.codex-artifacts/e2e/back-history/firefox-retry.log`.
- Full Chromium desktop/phone and WebKit phone sweep: `pnpm test:e2e e2e/shell-navigation.spec.ts e2e/store-crate.spec.ts e2e/home-preorders.spec.ts --project=chromium-desktop --project=chromium-mobile --project=webkit-mobile --reporter=list --output=.codex-artifacts/e2e/back-history/test-results`. Exact final output is in `.codex-artifacts/e2e/back-history/final-browser.log` and its counts are retained in the completion receipt. The suite's viewport-specific skips are intentional.

Earlier unit commands `pnpm test app-shell`, `pnpm test web-store`, and `pnpm test web-platform` passed. An attempted combined `pnpm test web-store web-platform` was invalid: the second name is interpreted as a file filter and produced no matching tests; the two modules were rerun separately and passed. A prior `pnpm validate` was interrupted with exit 130 while stopping the incompatible browser run; it is not passing evidence. Strict OpenSpec validation passed before final evidence edits.

The first broad browser sweep reported 74 passed, 18 skipped and 3 failed: a Crate Grid return regression subsequently corrected, a News navigation abort during source churn, and a Firefox process failure. The focused rerun passed both corrected Crate behavior and News across its selected engines; the separate Firefox retry passed. A later completion run passed its selected repository tasks but was invalidated by source churn; only summaries explicitly marked passed with matching before/after source identity establish completion. An optional background-site helper timed out during the final setup; the final sweep used the standard Playwright-owned server successfully.

Final post-code `graphify update .` passed: 28,681 nodes / 45,966 edges. Existing extractor limitations: SQL parser unavailable and one unrelated script partially extracted. No LLM enrichment ran.

## Changed files

Shell lifecycle and adjacent unit tests: `AppShellRoot.tsx`, `navigation/shell-popstate-navigation.ts`, `navigation/shell-popstate-navigation.test.ts`, `navigation/shell-section-navigation.ts`, `navigation/shell-section-navigation.test.ts`, `overlay/shell-overlay-focus.ts`, `overlay/shell-overlay-focus.test.ts`, `player-shell/player-modal-history.ts`, and `view/ShellOverlayPanel.tsx`, all under `apps/web/src/components/app-shell/`.

Store: `apps/web/src/components/store/crate/crate-view.ts`, `StoreDistroSearch.tsx` and `StorePreorderShowcase.tsx` in that Store project. Shared browser primitives: `apps/web/src/platform/lib/surface-history.ts`, its adjacent test, and `apps/web/src/platform/project.json`. Browser regressions: `e2e/shell-navigation.spec.ts`. Contract: `openspec/specs/module-boundaries/spec.md`. Planning and acceptance: this change's scaffold, proposal, design, tasks, two delta specs and this validation note.

The pre-existing protected harness edits, untracked module guides, and concurrent `apps/web/src/styles/global.css` design edit were not authored by this task. Home showcase edits are confined to history/focus wiring.
