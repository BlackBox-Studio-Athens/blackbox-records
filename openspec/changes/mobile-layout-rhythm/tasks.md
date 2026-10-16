# Tasks

Apply C1 first; coordinate shared styles and frame work with C2. Claude owns rendering, interaction, copy and UI tests except for the owner's task-scoped Codex playback override in task 2.1. The owner subsequently authorized a local commit after checks; no push or deployment is authorized.

Round-2 release evidence is recorded in validation.md (16 October 2026). Tasks 1.4, 1.6 and 1.8 remain open: the supplied renders establish amber presentation, but do not directly verify the specified Releases height/gaps, Artists height/columns/reflow or footer height/layout/wrapping/player-clearance checks. Task 3.4 remains open because the supplied evidence does not establish the combined F1–F22 review, Graphify refresh or complete source/screenshots/acceptance-row record. The owner's UAT visual review remains open. Previously checked tasks retain their recorded evidence scope.

## 1. Claude (UI)

- [x] 1.1 Apply the 16/24/32px page frame, safe-area handling and header/hero-media bleed exceptions; remove chapter/section/footer/rule bleed and duplicate insets, with UI checks at 320/390/1440px.
- [ ] 1.2 Implement and verify the owner-chosen phone film strip below 48rem: opening 16:9 prepared film for video releases, only a corner 44px icon-only Watch control over video media, identity/format-price/status/equal-half 44px Sea Pre-order and amber Listen pair/international notice/terms underneath; verify poster, band-photo and 160px sleeve fallbacks with desktop composition unchanged. Final measured heights and new-layout verification remain outstanding.
- [ ] 1.3 Verify the owner's 16 October 2026 removal of manual chapter motion controls on every viewport (ee0c6239, PRD 601/602), with reduced motion as the opt-out; preserve automatic pause rules (at least 15% in view, visible tab, no shell music session or full video playing), preference posters, Watch/full-video behavior and shell continuity. Run the affected preference, failure and continuity cases and record evidence; none is supplied for this revised task.
- [ ] 1.4 Round 2: verify tighter featured/catalog Releases gaps and padding (390px page height 2748px to 2556px), retaining ink Veneer titles, nearby action pairs, formats/price, plain status and physical/digital state coverage.
- [x] 1.5 Add the accessible three-line phone summary disclosure with full-text no-JavaScript fallback, natural expansion and focus retention; verify short/absent summaries, Read more/Show less, policy links and desktop full text.
- [ ] 1.6 Round 2: verify inline source-derived counts and two roster columns from 360px, tighter padding and retained 3:4 photos; compare the supplied 390px page heights of 3065px and 1583px, including long metadata and natural reflow.
- [x] 1.7 Contain Home News/Artists swipe peeks and use 44×44 dots with amber #e3b56c current marks; update and run e2e/home-swipe-rows.spec.ts for swipe, keyboard, shell re-entry and reduced-motion behavior.
- [ ] 1.8 Round 2: verify the approximately 200px footer at 390px (measured 198px), logo/socials on one 44px row, tagline in two 12px lines, eight links in four column-first columns of two 44px rows and one 12px sentence-case meta line including Est. 2026; retain copy, destinations, wrapping and player clearance.
- [x] 1.9 Update DESIGN.md's page frame, Home chapter/motion, Releases hierarchy/price/summary, artist counter and footer rules; verify it agrees with C1/C2 and retains production copy/content ownership.
- [x] 1.10 Update and run e2e/release-merchandising.spec.ts and e2e/routes.spec.ts for the rebuilt cards, hidden headings, containment, control sizes and overflow; retain existing detail/purchase/artist navigation assertions.

## 2. Codex (task-scoped playback override)

- [x] 2.1 Under the owner's task-scoped 16 October 2026 override (Claude quota exhausted), repair preorder film startup/recovery without changing the approved layout. Preserve the selected source across ordinary pauses, retry interrupted startup when media becomes ready, retain genuine autoplay-refusal fallback and preference gates, and verify real advancing playback plus scroll/visibility/music/full-video recovery in Chromium and Firefox at phone width. Record the physical Firefox Android acceptance limit. Local evidence is in validation.md; physical Android and hosted acceptance remain unverified.

No data, projection, schema, tooling or module-boundary implementation is required. The owner explicitly assigned the playback repair and its UI tests to Codex for this task only; other UI ownership stays with Claude.

## 3. Shared verification and UAT release

- [x] 3.1 Run pnpm test for each touched owner, including web-editorial, web-artists, web-store, app-shell, web-layouts, web-pages and storefront-catalog; reuse only matching-source test evidence.
- [x] 3.2 Run the updated scoped Home/Releases/routes/shell e2e suites plus e2e/player-continuity.spec.ts and e2e/public-image-fallback.spec.ts; include chromium-mobile/webkit-mobile phone cases, Back/Forward, direct/shell/cache entry and existing purchase links.
- [x] 3.3 Compare rendered 390×844 and 1440×900 scenes with the approved composition; measure gutters, footer, action distance and summary expansion, then stress 320px, text zoom, long content, reduced motion, data saving and refused media without forced clipping.
- [ ] 3.4 Run pnpm openspec -- validate mobile-layout-rhythm --type change --strict, review combined F1–F22 coverage, refresh Graphify after the implementation batch and record source/environment, screenshots, acceptance rows and remaining hosted checks in validation.md.
- [x] 3.5 Run final pnpm validate on the integrated implementation tree and retain its passing exact-source summary without altering unrelated dirty work.
- [x] 3.6 Coordinator performs the authorized scoped main commit/push to UAT once all three changes pass, runs pnpm release:watch and verifies release identity, CI/smoke and Home/Releases/Artists/footer on UAT; record the same coordinated release evidence, with no PRD promotion or Content Publication.
