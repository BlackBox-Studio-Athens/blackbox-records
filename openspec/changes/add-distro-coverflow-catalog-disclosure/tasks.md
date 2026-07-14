## 1. Predecessor gate

- [ ] 1.1 Confirm `organize-distro-format-discovery`, `add-static-distro-search`, and `add-distro-format-jump-navigation` are implemented and archived; run `pnpm openspec:guard` and verify their final grouped-route, search, and format-navigation seams before editing Distro.

## 2. Distro browse state and markup

- [ ] 2.1 Extend the populated-group route output with the smallest server-rendered hooks, source-derived totals, hidden enhancement controls, and active-record status targets needed by groups with more than one six-item chunk; keep the complete catalog as the default DOM.
- [ ] 2.2 Extend the Distro-specific client controller with the discriminated `preview | catalog | search-results` group state, bounded active index, Previous/Next and card-focus selection, ordinary card-link behavior, and focus-preserving `View all`/`Show Coverflow` transitions that reset a restored preview to record one.
- [ ] 2.3 Make Coverflow write only a parent browse-mode attribute; keep search as the sole writer of card and wrapper `hidden` state; make active search force `search-results`, search clear return groups to `catalog`, a widened viewport promote groups to `catalog`, and app-shell snapshot and route cleanup remove client browse state.

## 3. BlackBox 3D presentation

- [ ] 3.1 Add the mobile-only perspective scene for the first existing six-card chunk using mirrored `rotateY`, depth translation, scale, opacity, current artwork/borders/type, and a compact active position/title/artist status; leave desktop and groups of six or fewer unchanged.
- [ ] 3.2 Add the active-image native View Transition with a unique name only on the toggled group's active image, disable root snapshot animation, clear the name after `transition.finished`, and keep Coverflow movement at most 300ms without autoplay, looping, drag, timers, animation-frame work, scroll listeners, dependencies, duplicate cards, or card-by-card catalog stagger.
- [ ] 3.3 Keep the full server catalog when JavaScript, mounting, or View Transitions are unavailable, and make `prefers-reduced-motion: reduce` reach the same states with all Coverflow and shared-element animation disabled.

## 4. Focused regression coverage

- [ ] 4.1 Add focused state and DOM tests for eligibility, canonical first-six order, bounded controls, active metadata and ordinary link behavior, exact-once disclosure, first-record collapse reset, search-to-clear-to-Coverflow sequencing and hidden-state ownership, viewport promotion, route cleanup, reduced motion, unsupported fallback, and retained six-item wrappers.

## 5. Browser and performance verification

- [ ] 5.1 Use Browser Use at 320px, 390px, and desktop width to verify the 3D preview, Previous/Next and card-focus selection, ordinary navigation from every card, `View all`/`Show Coverflow`, search/clear, format jumps, route exit/re-entry, keyboard order, 44px targets, unclipped focus, no-JavaScript fallback, zero horizontal overflow, and console cleanliness.
- [ ] 5.2 Run the fixed Distro load/mobile-stress profiles and five fresh normal-speed disclosure runs at 320px and 390px; retain LCP ≤2.5s, CLS ≤0.1, interaction INP ≤200ms, and no enhancement task ≥50ms, simplifying the transition rather than shipping it if a gate fails; record one 4x CPU trace as diagnostic-only evidence.
- [ ] 5.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm openspec -- validate add-distro-coverflow-catalog-disclosure --strict`, and `git diff --check` against the final tree.
