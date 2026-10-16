# Tasks

All boxes track future implementation, not this documentation pass. C1 is the foundation for C2/C3. Claude owns the presentation, documentation and UI tests; no dedicated Codex implementation remains. Sequence shared files with one writer. This authoring pass does not stage, commit or push.

## 1. Claude (UI)

- [ ] 1.1 Round 2: verify Flint 400/850/900/950 neutral tokens, muted-foreground, edges/borders/input, Flint 700 Store search and Grid/Crate frames and Flint 400 inactive nav; preserve grounds, ink, Sea, amber, Staff colours and restriction-only error red.
- [x] 1.2 Update the shared button, chip, icon, input and text-action family to visible 44px targets, white labels and one ink focus ring; add focused ui-foundation tests for geometry, label exceptions and disabled/busy states.
- [x] 1.3 Apply Flint Buy/Add to cart and Sea-only Pre-order fills, retaining format marks, eligibility and in-place Adding/Added feedback; verify stocked, pre-order, depleted, pending and failed states in Store/cart/checkout UI tests.
- [ ] 1.4 Round 2: verify amber #e3b56c across Listen rest/hover edges, equalizer bars and every small mark (date/catalog lines, current swipe dots, hover underlines, input focus edges, newsletter success rule, footer meta, Est. 2026 and artist teaser meta); verify --listen-bars/--listen-edge are var(--amber-500), --listen-text is var(--amber-300) (#f0d7b0 In player label), and --amber-surface rgba(227, 181, 108, 0.16) supplies focus rings, Listen hover and In player surfaces; preserve white action labels and session lifecycle. The orchestrator records the UI agent's screenshots.
- [x] 1.5 Build the sole 52px Browse the Store hero exception with neutral rest, 240ms Flint sweep and 6px internal arrow motion; verify focus, touch, native destination and reduced-motion behavior.
- [x] 1.6 Apply the filled/outlined pair contract to existing action groups, with 16px phone gap and unchanged purchase/player behavior; verify narrow and long-label cases without clipping.
- [x] 1.7 Update news tags, kickers, artist/current nav/tab underlines, selected chips, Sold Out/Only N left Flint edges and surfaces, date/catalog lines and small marks; keep Coming Soon/Repressing dashed neutral boxes and omit the Store format-line mark while preserving Buy's icon; verify readable static information is not styled or exposed as an action.
- [x] 1.8 Apply Flint 300 #c1cbce form-error text beside visible Error labels, preserving aria-invalid, error associations, submitted values and consent semantics; add focused UI error-state coverage, keeping error red exclusive to international restriction notices and off control faces.
- [x] 1.9 Rewrite the twelve DESIGN.md rule groups listed in design.md, coordinating C2/C3's composition updates; verify no contradictory public amber, Store Blood, Services Rose, size or data-tone rule remains.
- [x] 1.10 Update and run focused browser cases in e2e/routes.spec.ts (controls/reflow), e2e/catalog-video-contact.spec.ts (Listen/forms), e2e/about-contact.spec.ts, e2e/availability-alerts.spec.ts and e2e/checkout-return.spec.ts for affected visual states.
- [x] 1.11 Update and run affected cases in e2e/home-hero-film.spec.ts, e2e/home-preorders.spec.ts, e2e/release-merchandising.spec.ts, e2e/store-formats.spec.ts and e2e/shell-navigation.spec.ts (navigation/footer controls); retain player-continuity.spec.ts coverage.

## 2. Codex (non-UI)

None. No data, projection, schema, tooling or module-boundary implementation is required by the revised scope. Existing contracts are covered by shared verification; UI tests and documentation belong to Claude.

## 3. Shared verification and UAT release

- [x] 3.1 Run pnpm test for each touched owner, including ui-foundation, player, app-shell, web-store, web-editorial, web-layouts, web-pages, store-cart and checkout-web; record exact commands/results and reuse only matching-source evidence.
- [x] 3.2 Run scoped pnpm test:e2e commands for the updated specs and player continuity, including chromium-mobile/webkit-mobile phone cases; verify direct/shell/cache entry, focus, 320/390/1440 widths, text zoom and reduced motion.
- [ ] 3.3 Compare real rendered controls with the approved values; inspect contrast and roles at rest/focus/hover/press/busy/In player, and record screenshots plus unresolved differences in this change's validation.md.
- [ ] 3.4 Run pnpm openspec -- validate accent-and-button-system --type change --strict, check combined C2/C3 consistency, refresh Graphify after the meaningful implementation batch, and record acceptance rows, source SHA/fingerprint and remaining hosted checks.
- [x] 3.5 Run final pnpm validate on the integrated implementation tree and record its passing source-bound summary; preserve unrelated dirty work and stop on unresolved failures.
- [x] 3.6 Coordinator performs the authorized scoped main commit/push to UAT after all three changes pass, then runs pnpm release:watch and verifies UAT identity, CI/smoke and affected public routes; record the shared release evidence here, with no PRD promotion or Content Publication.
