# Validation

## Source and environment

- Local, authorized shared worktree `C:/Users/SVall/.codex/worktrees/b553/blackbox-records`, branch `codex/staff-release-updates`.
- Base SHA: `ecbf6e9d79c872d5a4803a2e31d7ef97dd26a570`; uncommitted changes.
- Production CSS SHA256 before and after the focused browser run: `FB2BA0867CC8EE1250E44A88D3C76B41E1B4B0326C364D7925C9AF0BB078B5FD`.
- Browser test SHA256 before and after that run: `EA83E563F0059DBA17C04B5BEA90D0B8C8E9A88CBC5E8532BB8F1D739DE8D697`.
- Browser URL: `http://127.0.0.1:4361/blackbox-records/store/distro/`.

## Results

- `pnpm openspec:guard --allow-worktree`: passed after parent dependency setup completed. An earlier attempt hit concurrent dependency provisioning failure; the completed setup resolved it.
- `pnpm test apps/web/src/layouts/StoreCollectionPage.test.ts` through RTK: passed, exit 0.
- `pnpm test:e2e e2e/store-formats.spec.ts -g 'Veneer titles and quiet credits'`: one Chromium test passed, zero unexpected failures or flaky tests, duration 86.8 seconds.
- The browser test verified Veneer/900 titles at 20px mobile and 24px desktop, Inter/400 credits at 14px and 19.6px line height, source casing and accessible names, linked and unlinked names, artist and item navigation, long-name wrapping and no page overflow at 320px, 390px, 1440px and modeled 200% reflow.
- Strict OpenSpec validation and `git diff --check`: passed.
- Source investigation used the worktree Graphify and CodeGraph indexes. The broad Graphify query truncated; targeted `explain apps_web_src_components_store_storeitemcard` returned all 19 card connections and resolved the relevant caller/impact gap before CodeGraph returned current card and caller source.

## Artifacts and limits

- Browser report retained before later feature runs: `.codex-artifacts/e2e/store-typography/summary.json`. The runner's `.codex-artifacts/e2e/summary.json` is a latest-run pointer.
- Screenshots: `.codex-artifacts/e2e/store-typography/`, including `390.png`, `1440.png`, long-name views and modeled 200% reflow. Inspected the mobile and desktop screenshots. Latin titles and quiet credits show the intended hierarchy; source Greek titles retain the existing font asset's glyph/fallback treatment.
- Screenshot artwork slots were blank and live offer state was unavailable in the static browser fixture. This evidence covers typography, links and reflow; it does not establish live offer or image acceptance.
- Native Chrome blackbox initialization succeeded, but tab creation timed out and left a blank tab. Classification: `bootstrap_ok_but_task_failed`. DevTools fallback failed because its browser profile was already in use. No existing browser or server owned by another chat was stopped.
- Native browser zoom, manual live artwork review and hosted acceptance remain unverified. The browser test models 200% reflow rather than changing browser zoom.
- Applicable acceptance: public presentation and shared Store links. Staff, content publication, commerce authority and software release rows are excluded because this change edits no corresponding behavior.
- Parent integration is recorded below; scoped browser evidence retains its original source identity.

## Parent integration

`pnpm validate` passed in Local mode on the combined tree: 41 affected projects and 55 successful tasks, including tests, lint, type checks and architecture enforcement. Summary: `.codex-artifacts/validation/2026-10-05T05-07-27-381Z-29064-d847ba/summary.json`. Base SHA: `ecbf6e9d79c872d5a4803a2e31d7ef97dd26a570`; matching before/after source fingerprint: `afa0e9ebe0be9d3b7449019e950b5c17f79b3b49854a19820f6fc2b3411d0e48` (76 changed files, no source changes during the accepted pass). Earlier scoped evidence retains its recorded identities. The final run pointer after these note edits is `.codex-artifacts/validation/staff-release-updates-final.json`.

Graphify was refreshed locally using AST extraction, and CodeGraph verified the final shared neutral renderer and its live and shell callers. The known partial extraction of unrelated `scripts/pages-workflow-contract.test.ts` does not establish that file's semantics. Content Publication, hosted acceptance and Software Release remain separate from these Local checks.
