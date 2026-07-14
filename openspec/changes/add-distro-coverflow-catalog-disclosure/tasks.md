## 1. Predecessor gate

- [ ] 1.1 Confirm `organize-distro-format-discovery`, `add-static-distro-search`, and `add-distro-format-jump-navigation` are implemented and archived; run `pnpm openspec:guard` and verify their final grouped-route, search, and format-navigation seams before editing Distro.

## 2. Distro browse state and markup

- [ ] 2.1 Extend populated-group output with the smallest server-rendered hooks, source-derived totals, static `{title} — {artist_or_label}` link names, hidden enhancement controls, and one active-record status; place disclosure before the wrappers it reveals and keep the complete catalog as default DOM.
- [ ] 2.2 Extend the predecessor's single Distro portal/controller with the discriminated `preview | catalog | search-results` state, six bounded card positions, focus-promoted ordinary links, focusable `aria-disabled` end controls, and focus-preserving `View all`/`Show Coverflow` transitions that reset preview to record one.
- [ ] 2.3 Keep search as sole writer of card, wrapper, and group `hidden` state; make search enter `search-results` before filtering, clear return to `catalog`, and viewport widening promote to `catalog` only without a query; sanitize cached app-shell snapshots before controller cleanup so no mode, position, control, or transition state leaks across route restoration.

## 3. BlackBox 3D presentation

- [ ] 3.1 Add the artwork-only mobile scene with an outer perspective/clipping shell, inner `preserve-3d` stage, six position rules, mirrored transforms, per-cover opacity, compact `position of 6 preview`/title/`artist_or_label` status, and `display: none` for wrappers after the first; suppress the existing card-image zoom and leave desktop and short groups unchanged.
- [ ] 3.2 Add the active-image native View Transition with one temporary unique name, disabled root animation, focusable `aria-disabled` disclosure during flight, ignored repeated activation, and `try/finally` cleanup that yields to search, viewport, and route cleanup; keep authored motion at most 300ms with no autoplay, looping, drag, timers, animation-frame work, scroll listeners, dependencies, duplicate cards, or stagger.
- [ ] 3.3 Keep the full server catalog when JavaScript, mounting, or View Transitions are unavailable; add no pre-hydration hiding; make reduced motion reach the same states without Coverflow, nested image zoom, or shared-element animation; treat a failed automatic-mount budget as incomplete work requiring simplification or separate respecification.

## 4. Focused regression coverage

- [ ] 4.1 Add focused state and DOM tests for source-derived eligibility/counts, canonical first-six order, artwork-only accessible names, later-wrapper removal from preview rendering/focus/accessibility, six positions, `aria-disabled` controls, shared status, ordinary links, exact-once disclosure, serialized cleanup, search-to-clear sequencing and hidden ownership, viewport promotion, pre-cache sanitization, route cleanup, reduced motion, unsupported fallback, and retained wrappers.

## 5. Browser and performance verification

- [ ] 5.1 Use Browser Use at 320px, 390px, and desktop width to verify the 3D shell, visible-cover hit targets, keyboard focus promotion, ordinary link activation, disclosure, search/clear, format jumps, route restoration, 44px controls, 200% text, 400% zoom/reflow, focus with the mini-player open, reduced/no-JavaScript fallback, zero horizontal overflow, and console cleanliness.
- [ ] 5.2 Measure fresh direct loads, app-shell entries, and five normal-speed disclosure runs at 320px and 390px; retain LCP ≤2.5s, CLS ≤0.1, interaction INP ≤200ms, and no enhancement task ≥50ms; fail completion and simplify rather than adding pre-hydration hiding or an unapproved catalog-first branch; record one 4x CPU trace as diagnostic-only evidence.
- [ ] 5.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm openspec -- validate add-distro-coverflow-catalog-disclosure --strict`, and `git diff --check` against the final tree.
