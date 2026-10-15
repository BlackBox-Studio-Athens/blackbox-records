# Tasks

All boxes track future implementation. Apply C1 first. Use existing catalogue order, Distro links/counts and filter data; no Codex data prerequisite remains. Keep one writer per shared file. No staging, commit or push is performed by this planning pass.

## 1. Claude (UI)

- [ ] 1.1 Remove the visible Store/category introduction and desktop pane, retaining one hidden H1 and metadata on every category; update identity/UI contracts and verify direct and shell entry.
- [ ] 1.2 Build the one-row desktop toolbar and phone Search + Filter row with C1 controls; verify 320/390/1440 reflow without clipped categories, labels or undersized targets.
- [ ] 1.3 Extend the existing Artists dialog into one Filter sheet in the approved section order, with live selections, applied-count badge and neutral Show N items; add UI tests for close, Escape, Back/Forward, focus/scroll restoration and breakpoint cleanup.
- [ ] 1.4 Build desktop Formats/Artists popovers and relocate the existing Distro format links/counts plus artist controls; verify unchanged hrefs/counts, pinned artists, zero matches and existing clearing behavior, including reachable no-JavaScript and failed-enhancement fallbacks.
- [ ] 1.5 Relocate the existing View choice into the shared controls without changing Crate eligibility or catalogue order; verify the same bin/filter rules, retained selections and no automatic Crate activation.
- [ ] 1.6 Rebuild Store cards in artwork/format/title/artist/status/price-action order, using plain ink Inter 13px semibold caps without a format-line mark and retaining Buy's existing format icon; place accessible 44×44 phone Listen on the artwork corner and labelled desktop Listen; verify independent item/artist/Buy/Listen targets and long identities.
- [ ] 1.7 Keep the existing purchase note above the grid/empty state as one compact line at the reference width; verify unchanged copy/links and natural wrapping at narrow widths or enlarged text.
- [ ] 1.8 Update DESIGN.md's Store Listing Scale, toolbar/filter placement, grid, Listen and above-grid note rules, preserving C1/C3 contracts; correct its stale All paragraph to BlackBox releases first by catalog number, then Distro by artist, matching the existing comparator.
- [ ] 1.9 Update UI tests in the actual affected web-store/web-layouts/web-pages owners and e2e/store-formats.spec.ts for relocated links/filters, identity and cards; run scoped tests including legacy fragments and no-JavaScript fallback.
- [ ] 1.10 Update and run e2e/store-preorders.spec.ts, e2e/store-crate.spec.ts, e2e/store-cart.spec.ts, e2e/shell-navigation.spec.ts and e2e/routes.spec.ts for unified controls, history, preserved purchase behavior and early product visibility.

## 2. Codex (non-UI)

None. No data, projection, schema, tooling or module-boundary implementation is required by the revised scope. Existing contracts are covered by shared verification; UI tests and documentation belong to Claude.

## 3. Shared verification and UAT release

- [ ] 3.1 Run pnpm test for every touched owner, including web-store, web-layouts, web-pages and app-shell, and reuse the existing storefront-catalog ordering regression; record source-bound results without rerunning unchanged evidence.
- [ ] 3.2 Run scoped pnpm test:e2e for the updated Store/shell/routes suites and e2e/player-continuity.spec.ts, with chromium-mobile/webkit-mobile phone cases; verify cart, independent artist links, player, nested history and cache sanitation.
- [ ] 3.3 Measure real first-card positions at 390×844 and 1440×900 with the compact purchase note above the grid; verify the first phone row is visible, two-up/five-up reference grids, long content, 320px, enlarged text, reduced motion and complete no-JavaScript catalogs.
- [ ] 3.4 Verify the relocated format hrefs and Distro counts match today's output, All remains catalog-first then artist-ordered Distro, other categories retain their order and no request amplification appears; record fallback/history evidence and Local limits.
- [ ] 3.5 Run pnpm openspec -- validate store-mobile-first-browse --type change --strict, review C1/C3 and retained catalogue behavior, refresh Graphify after the implementation batch and record acceptance/source evidence in validation.md.
- [ ] 3.6 Run final pnpm validate on the integrated implementation tree and retain its passing exact-source summary while preserving unrelated dirty work.
- [ ] 3.7 Coordinator performs the authorized scoped main commit/push to UAT once all three changes pass, runs pnpm release:watch and verifies UAT release identity, CI/smoke and Store browsing; link the single shared release evidence, with no PRD promotion or Content Publication.
