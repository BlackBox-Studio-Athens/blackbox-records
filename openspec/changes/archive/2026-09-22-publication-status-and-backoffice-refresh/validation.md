# Validation

## Local verification — 2026-09-16

- `pnpm test:unit` passed: web 575 tests, staff 53 tests, backend 530 tests plus 289 backend Node tests and repository contract tests.
- `pnpm check` passed with no errors. Existing dependency-boundary deprecation notices and Astro deprecation hints remain informational.
- `pnpm build` passed the public static build, cache/font/image checks, staff build, and route-isolation checks.
- `pnpm build:staff` passed after the final source change.
- `node scripts/test-content-workspace.mjs` passed in Chromium.
- `node scripts/test-content-workspace.mjs --firefox` passed in Firefox.
- `node scripts/test-preview-policy.mjs` passed in Chromium and Firefox: approved CSS/images/fonts load while external assets, scripts, and forms remain blocked.

The browser fixture covers the retained historical failure followed by a newer pending and live request, direct top-right refresh, bounded pending polling, visibility/focus refresh, single-flight refresh, stale responses, preview recovery, discard protection, field validation, image selection, mobile tabs, root/logo routing, Stock mode switching, and responsive Stock/Orders layouts. The fixture was updated for the explicit Stock Adjust/Count mode switch and for status labels that may include the stale marker. The final Firefox run also caught and fixed iframe scroll restoration after the preview was closed during a superseded render.

Screenshots from the completed browser runs are stored in the ignored `.codex-artifacts/content-workspace/chromium/` and `.codex-artifacts/content-workspace/firefox/` directories. They cover 390, 768, 1280, and 1600 px Content/Images layouts. The Stock and Orders changes also passed compilation and preserve their existing read/mutation boundaries; dedicated hosted verification remains a release step.

## Remaining release verification

UAT deployment and hosted verification are still required for this change. Before promotion, verify in Chromium and Firefox that a new pending request replaces an older top-right failure, the failed row remains in history, newest failed/live states are truthful, and the standalone Refresh control works without opening history.
