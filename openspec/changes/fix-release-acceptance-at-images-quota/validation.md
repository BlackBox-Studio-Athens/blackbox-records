# Release acceptance at Images quota

## Local repair

The account's exhausted Images transformation quota remains unchanged on Free. The existing browser fallback remains responsible for failed responsive transformations. Software release smoke now resolves trusted direct Images URLs to the exact published same-environment media original; the explicit `image_transform` scenario still rejects originals and requires a real transformation.

Two new overlay regression cases failed before repair: a missing or disconnected panel allowed a delayed frame to target document scrolling. Guarding the actual connected panel at callback execution preserves normal close-button focus and the shared document scroll API. Scoped `pnpm test apps/web/src/components/app-shell/overlay/shell-overlay-focus.test.ts` passed all three affected projects after repair. The new canonical-media assertion failed before repair; `pnpm test apps/backend/test/scripts/smoke-uat-static.test.ts` then passed all seven affected projects/dependencies, including source-origin/base-path checks and strict transformation coverage.

The production-preview browser run passed all 12 existing selected cases across Chromium desktop, Chromium mobile and WebKit mobile: overlay Close/Back scroll and focus, player navigation/history/Stop, player Back scroll, and three-item cart reopening through every dismissal. Existing mobile cart settling behavior was retained. Controlled fallback subsequently passed on all three engines: mocked transformation HTTP 429 responses recover to one decoded original, responsive candidates are removed, and resize issues no further requests. WebKit may speculatively start `src` while selecting `srcset`; the test bounds that initial request count. Intentional HTTP 429 diagnostics are scoped to this test, and a normal-sized original avoids a zero integer natural width under responsive image density. Initial fixture failures are preserved in ignored receipts rather than counted as product acceptance.

Evidence lives under `.codex-artifacts/release-monitor/2026-10-11/`: before/after unit logs, `quota-browser.log` and `quota-browser-initial/`, the corrected fallback run, production-build log and final validation summary. Hosted identities and checkout-window receipts live in `quota-recovery/`.

`pnpm validate` passed 28/28 tasks in local mode in `.codex-artifacts/validation/2026-10-11T05-29-46-748Z-16464-30d71c/summary.json`. The final `pnpm build:web` passed, including static cache policy, Veneer delivery, generated image markup and runtime bundle graph checks (`quota-fix-build-final.log`). Strict OpenSpec validation passed. Final-tree validation is repeated after recording this note, before the release commit.

## Release boundaries

The captured 2026-10-11 05:21 UTC baseline is UAT code `a58f0d234ad4b59a601db817a1c0001e82d82a3c` / run 553 and PRD code `4bb78b4fd0c55b75e9eb412705c1205d68728848` / run 551. UAT accepted publication is `7883a0f6-8701-4567-91e4-8e0015352533`, snapshot `78651b0e6c63cba6abaab747f01b6f6fa7e95e9ed606663807c4ec4711889225`. PRD's independently published content is `a6714300-b25b-43c9-9468-4f9a83322e77`, snapshot `3e840436082ce0003c09b3c8a4427924c880b70f8e8ad8dc46a65f1a2e3cde05`. Both checkouts were enabled. Preserve these content pointers and PRD controls, temporarily close and restore only the captured UAT checkout gate, and release PRD only after the complete candidate push succeeds.

The holding-page apex is outside the main release's identity check. The deleted scheduled monitor stays deleted. Unrelated OpenSpec acceptance gates, including simplification 29.2 and Crate 8.3, remain unresolved; this change does not grant them acceptance.
