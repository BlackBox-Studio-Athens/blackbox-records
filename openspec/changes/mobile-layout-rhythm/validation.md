# Planning validation

Revision: 15 October 2026, after the orchestrator's eight decisions. This record supersedes the initial planning fingerprints and task counts.

## Authoring checks

- Task counts: Claude (UI): 10; Codex (non-UI): 0; shared: 6 (16 total). All implementation checkboxes remain unchecked.
- Guard: `pnpm openspec:guard` passed before this revision.
- Strict validation: PASS with `pnpm openspec -- validate mobile-layout-rhythm --type change --strict`.
- Scoped formatting: PASS across the three change folders.
- Planning-artifact SHA-256 fingerprint: `e6b07b1dff15d123be06a10ce121b72a7c50fdb4a6b224156ad60302839be9db` across 10 files, hashing sorted relative-path/file-SHA256 lines joined with LF; validation.md is excluded.
- F1–F22 coverage is retained. C2/C3 still depend on C1.
- Edits are limited to the three named OpenSpec change directories. No direct Git commands, source edits, implementation tests, publication or deployment are part of this pass.
- Preservation check: all 17 protected files retain their pre-revision SHA-256 values.

## Decisions verified in the revised plan

Catalogue order stays as implemented: All places BlackBox releases first by catalog number, then Distro by artist. Existing Distro format links and their Distro counts only move; the no-JavaScript fallback remains reachable. The purchase note stays above the grid. No new order control, facets, counts or data/projection work remains.

Home film chapters retain a 44px phone pause/resume icon; the removal request is recorded as a declined accessibility deviation. The footer target is about 290px at 390px with 44px tap rows, icons beside the logo, inline wrapping links and two-line meta beside Est. 2026. Store format lines are plain ink Inter, Buy keeps its icon, and Only N left shares the Violet edge/surface while Coming Soon/Repressing retain dashed neutral boxes.

No dedicated Codex implementation is identified. Claude owns UI, UI tests and DESIGN.md updates; verification, final pnpm validate and the coordinated UAT push remain shared tasks.

## Acceptance not claimed

This is planning validation, not implementation or browser acceptance. The supplied audit measured Local fixtures; revised geometry, native-link fallback, pause interaction and footer wrapping still require implementation verification. Full `pnpm validate` is deferred to integration because its local formatter can modify unrelated dirty files in the shared checkout. No PRD promotion or Content Publication is implied.

# Implementation validation (Claude, UI)

Recorded 15 October 2026 on `main` at `42f4c2e7` plus the uncommitted C3 tree. Final `pnpm validate`: PASSED, `mode: local`, source fingerprint `384f1788240601fbfd3724bfebdf12e7ed2ffb701a4d883e93a555ad2255dbc1` (37 files, before = after), summary `.codex-artifacts/validation/2026-10-15T18-36-31-997Z-48672-68ad63/summary.json`. Product Environment: Local, Astro dev with `BLACKBOX_PREORDER_PROJECTION=e2e/preorder-projection.json` and stubbed listing reads; no UAT or PRD claim.

## Measured at 390×844 (before → after)

- Home pre-order chapter (photo chapter): 1211 → 887px; media 358×201 inside x=16..374; Pre-order and Listen 171×44 each, 16px apart, under the price.
- Releases featured: lead 1042 → 795px, supporting 1093 → 820px, catalog 660 → 621px; pair 12px under the cover; desktop lead row 547 → 496px with the 464px cover.
- Footer: 417 → about 301px at 390px; the sitemap fills three fixed 44px rows down three columns, so no link sits alone on a row for any count from four up (eight links locally; seven on the production fixture, where Privacy information is gated on approved purchase information). DOM and reading order stay the sitemap order; the visual order runs down each column. Top rule at the gutters.
- Artist count: 106×82 box → 28px inline line. Swipe rows clipped at x=16..374, next News card peeks about 42px; dots 44×44.
- No horizontal overflow at 390 or 1440 on Home, Releases or Artists.

## Checks

- Unit: web-store, web-pages, web-editorial, web-layouts, web-artists, app-shell, ui-foundation, storefront-catalog and commerce-web-integration pass through `pnpm validate`; updated `_releases-page-layout`, `StorePreorderShowcase`, `homepage-hero-css`, `swipe-row-dots`, and added the inline-count test in `_artist-roster-layout`.
- e2e (each spec alone, all projects): release-merchandising 45/46 then the failing Firefox case 2/2 after a test fix (adds the phone summary disclosure case), home-preorders 16/16, home-swipe-rows 8/8, catalog-video-contact 14/14, shell-navigation 49/51 then the footer case 2/2 after a test fix (it covers 390, 320 and 125% text), player-continuity 12/12, routes 65/65, home-hero-film 4/4, public-image-fallback 3/3, availability-alerts 6/6, international-order-item 5/5.
- `pnpm openspec -- validate mobile-layout-rhythm --type change --strict`: valid. `pnpm format:check`: clean.

## Not established

- Film chapter on phones: Local content has no pre-order film, so the retained 44×44 pause/resume icon, Watch and film-tools layout were not rendered; the code path is unchanged and its unit/e2e cases pass.
- 3.3 stress (long content, data saving, refused media) and a visual comparison beyond the 390/1440 screenshots; the eager JavaScript budget (`pnpm performance:bundles`) needs the production build CI runs. The Home showcase gained one wrapper element.
- 3.4 Graphify refresh and the combined F1–F22 review; 3.6 UAT release belongs to the coordinator.
