# Tasks

All boxes track future implementation. Apply C1 first; coordinate shared styles and frame work with C2. Claude owns rendering, interaction, copy and UI tests; no dedicated Codex implementation is needed. This planning pass does not stage, commit or push.

## 1. Claude (UI)

- [ ] 1.1 Apply the 16/24/32px page frame, safe-area handling and header/hero-media bleed exceptions; remove chapter/section/footer/rule bleed and duplicate insets, with UI checks at 320/390/1440px.
- [ ] 1.2 Rebuild Home phone chapters with contained 16:9 media, complete sleeve, clear identity/status/format-price and the 44px Pre-order/Listen pair; verify missing-media/no-source/no-preorder and long-copy layouts.
- [ ] 1.3 Retain the neutral 44×44 chapter pause/resume icon on phones and desktop, with a stateful accessible name and persistent manual pause; preserve automatic motion/poster/Watch/player rules; update and run e2e/home-preorders.spec.ts and e2e/home-hero-film.spec.ts preference, failure and continuity cases.
- [ ] 1.4 Rebuild featured and catalog Releases card placement, approved ink Veneer title sizes, nearby action pairs, formats/price and plain status; verify all physical/digital states and add focused web-editorial UI tests.
- [ ] 1.5 Add the accessible three-line phone summary disclosure with full-text no-JavaScript fallback, natural expansion and focus retention; verify short/absent summaries, Read more/Show less, policy links and desktop full text.
- [ ] 1.6 Replace the artist statistic block with the inline source-derived count beside Latest; add web-artists UI coverage for long metadata, zero/multiple counts and unchanged current wording.
- [ ] 1.7 Contain Home News/Artists swipe peeks and use 44×44 dots with Slate current marks; update and run e2e/home-swipe-rows.spec.ts for swipe, keyboard, shell re-entry and reduced-motion behavior.
- [ ] 1.8 Compact the phone footer toward 290px at 390px with icons beside the logo, visually hidden Sitemap label, inline wrapping links in 44px tap rows and two-line meta beside Est. 2026; retain all copy and destinations; update e2e/shell-navigation.spec.ts footer wrapping/player-obstruction cases, including growth at enlarged text.
- [ ] 1.9 Update DESIGN.md's page frame, Home chapter/motion, Releases hierarchy/price/summary, artist counter and footer rules; verify it agrees with C1/C2 and retains production copy/content ownership.
- [ ] 1.10 Update and run e2e/release-merchandising.spec.ts and e2e/routes.spec.ts for the rebuilt cards, hidden headings, containment, control sizes and overflow; retain existing detail/purchase/artist navigation assertions.

## 2. Codex (non-UI)

None. No data, projection, schema, tooling or module-boundary implementation is required by the revised scope. Existing contracts are covered by shared verification; UI tests and documentation belong to Claude.

## 3. Shared verification and UAT release

- [ ] 3.1 Run pnpm test for each touched owner, including web-editorial, web-artists, web-store, app-shell, web-layouts, web-pages and storefront-catalog; reuse only matching-source test evidence.
- [ ] 3.2 Run the updated scoped Home/Releases/routes/shell e2e suites plus e2e/player-continuity.spec.ts and e2e/public-image-fallback.spec.ts; include chromium-mobile/webkit-mobile phone cases, Back/Forward, direct/shell/cache entry and existing purchase links.
- [ ] 3.3 Compare rendered 390×844 and 1440×900 scenes with the approved composition; measure gutters, footer, action distance and summary expansion, then stress 320px, text zoom, long content, reduced motion, data saving and refused media without forced clipping.
- [ ] 3.4 Run pnpm openspec -- validate mobile-layout-rhythm --type change --strict, review combined F1–F22 coverage, refresh Graphify after the implementation batch and record source/environment, screenshots, acceptance rows and remaining hosted checks in validation.md.
- [ ] 3.5 Run final pnpm validate on the integrated implementation tree and retain its passing exact-source summary without altering unrelated dirty work.
- [ ] 3.6 Coordinator performs the authorized scoped main commit/push to UAT once all three changes pass, runs pnpm release:watch and verifies release identity, CI/smoke and Home/Releases/Artists/footer on UAT; record the same coordinated release evidence, with no PRD promotion or Content Publication.
