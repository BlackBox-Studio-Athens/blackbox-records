# Tasks

All boxes track future implementation. Apply C1 first. Use existing catalogue order, Distro links/counts and filter data; no Codex data prerequisite remains. Keep one writer per shared file. No staging, commit or push is performed by this planning pass.

## 1. Claude (UI)

- [x] 1.1 Remove the visible Store/category introduction and desktop pane, retaining one hidden H1 and metadata on every category; update identity/UI contracts and verify direct and shell entry.
- [x] 1.2 Build the one-row desktop toolbar and phone Search + Filter row with C1 controls; verify 320/390/1440 reflow without clipped categories, labels or undersized targets.
- [x] 1.3 Extend the existing Artists dialog into one Filter sheet in the approved section order, with live selections, applied-count badge and neutral Show N items; add UI tests for close, Escape, Back/Forward, focus/scroll restoration and breakpoint cleanup.
- [x] 1.4 Build desktop Formats/Artists popovers and relocate the existing Distro format links/counts plus artist controls; verify unchanged hrefs/counts, pinned artists, zero matches and existing clearing behavior, including reachable no-JavaScript and failed-enhancement fallbacks.
- [x] 1.5 Relocate the existing View choice into the shared controls without changing Crate eligibility or catalogue order; verify the same bin/filter rules, retained selections and no automatic Crate activation.
- [x] 1.6 Rebuild Store cards in artwork/format/title/artist/status/price-action order, using plain ink Inter 13px semibold caps without a format-line mark and retaining Buy's existing format icon; place accessible 44×44 phone Listen on the artwork corner and labelled desktop Listen; verify independent item/artist/Buy/Listen targets and long identities.
- [x] 1.7 Keep the existing purchase note above the grid/empty state as one compact line at the reference width; verify unchanged copy/links and natural wrapping at narrow widths or enlarged text.
- [x] 1.8 Update DESIGN.md's Store Listing Scale, toolbar/filter placement, grid, Listen and above-grid note rules, preserving C1/C3 contracts; correct its stale All paragraph to BlackBox releases first by catalog number, then Distro by artist, matching the existing comparator.
- [x] 1.9 Update UI tests in the actual affected web-store/web-layouts/web-pages owners and e2e/store-formats.spec.ts for relocated links/filters, identity and cards; run scoped tests including legacy fragments and no-JavaScript fallback.
- [x] 1.10 Update and run e2e/store-preorders.spec.ts, e2e/store-crate.spec.ts, e2e/store-cart.spec.ts, e2e/shell-navigation.spec.ts and e2e/routes.spec.ts for unified controls, history, preserved purchase behavior and early product visibility.

## 2. Codex (non-UI)

None. No data, projection, schema, tooling or module-boundary implementation is required by the revised scope. Existing contracts are covered by shared verification; UI tests and documentation belong to Claude.

## 3. Shared verification and UAT release

- [x] 3.1 Run pnpm test for every touched owner, including web-store, web-layouts, web-pages and app-shell, and reuse the existing storefront-catalog ordering regression; record source-bound results without rerunning unchanged evidence.
- [x] 3.2 Run scoped pnpm test:e2e for the updated Store/shell/routes suites and e2e/player-continuity.spec.ts, with chromium-mobile/webkit-mobile phone cases; verify cart, independent artist links, player, nested history and cache sanitation.
- [x] 3.3 Measure real first-card positions at 390×844 and 1440×900 with the compact purchase note above the grid; verify the first phone row is visible, two-up/five-up reference grids, long content, 320px, enlarged text, reduced motion and complete no-JavaScript catalogs.
- [x] 3.4 Verify the relocated format hrefs and Distro counts match today's output, All remains catalog-first then artist-ordered Distro, other categories retain their order and no request amplification appears; record fallback/history evidence and Local limits.
- [ ] 3.5 Run pnpm openspec -- validate store-mobile-first-browse --type change --strict, review C1/C3 and retained catalogue behavior, refresh Graphify after the implementation batch and record acceptance/source evidence in validation.md.
- [x] 3.6 Run final pnpm validate on the integrated implementation tree and retain its passing exact-source summary while preserving unrelated dirty work.
- [x] 3.7 Coordinator performs the authorized scoped main commit/push to UAT once all three changes pass, runs pnpm release:watch and verifies UAT release identity, CI/smoke and Store browsing; link the single shared release evidence, with no PRD promotion or Content Publication.

## Validation note (Claude, 15 October 2026)

- Source: main at 5b94b7a4 plus the uncommitted C2 tree (and the C1 bundle-budget trim). Final `pnpm validate` passed: `.codex-artifacts/validation/2026-10-15T17-22-26-701Z-47920-4f8994/summary.json` (mode local; repository gates only).
- Unit: web-store 144, web-layouts 24, web-pages 75, storefront-catalog 191, app-shell 294, checkout-web 136, ui-foundation 17, all passing.
- Scoped e2e on the Local dev server (BLACKBOX_E2E=1 with the pre-order projection fixture): store-formats 12 plus the new no-JavaScript Formats-menu case, store-preorders 12, store-crate 12 (1 skipped by design), shell-navigation Crate and Filter cases 7 (1 skipped), international-order-store 7, international-order-store-mobile 7, store-cart 72, routes 65, all passing.
- performance-acceptance: the Store listing-price and gallery cases passed; the responsive-image, eager-cart-parser and gallery-overlay console cases fail on the dev server for every route (they read built `dist/_image` output and see Local 404s for `/api/store/listing-prices` and `/cdn-cgi/trace`), so they need the CI preview run. Unverified locally.
- Measured with the compact purchase note above the grid: first card top 298px at 390×844 (whole first row on screen) and 270px at 1440×900; no horizontal overflow at 320, 390 or 1440.
- Deviation: the phone Listen's accessible name is “Listen, <title> by <artist>” (the shared trigger's context form, which reads “In player, …” during a session) rather than “Listen to …”.
- Not done here: 3.2 player-continuity, 3.3 enlarged-text and reduced-motion browser review, 3.4 request-amplification evidence, 3.5 OpenSpec strict validation and Graphify refresh, 3.7 UAT release.
