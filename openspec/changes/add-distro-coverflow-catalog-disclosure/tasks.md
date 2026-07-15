## 1. Predecessor gate

- [x] 1.1 Confirm `organize-distro-format-discovery`, `add-static-distro-search`, and `add-distro-format-jump-navigation` are implemented and archived; run `pnpm openspec:guard` and verify their final grouped-route, search, and format-navigation seams before editing Distro.

## 2. Distro browse state and markup

- [x] 2.1 Extend populated-group output with the smallest server-rendered hooks, source-derived totals, static `{title} — {artist_or_label}` link names, capability-gated server preview controls, and one active-record status; place disclosure before the wrappers it reveals and keep the complete catalog as fallback DOM.
- [x] 2.2 Extend the predecessor's single Distro portal/controller with the discriminated `preview | catalog | search-results` state, six bounded card positions, focus-promoted ordinary links, focusable `aria-disabled` end controls, and focus-preserving `View all`/`Show Coverflow` transitions that retain the selected preview record.
- [x] 2.3 Keep search as sole writer of card, wrapper, and group `hidden` state; make search enter `search-results` before filtering and clear return to `catalog`; keep browse state stable across responsive presentation changes; sanitize cached app-shell snapshots before controller cleanup so no mode, position, control, or transition state leaks across route restoration.
- [x] 2.4 Keep the server-derived format navigation sticky below the site header, add one native/app-shell `Top` target, keep narrow-width format links horizontally reachable, and offset group targets so their headings remain visible without adding an observer, scroll listener, active-section state, or duplicate navigation.

## 3. BlackBox 3D presentation

- [x] 3.1 Add responsive artwork-only mobile and desktop scenes with an outer perspective/clipping shell, inner `preserve-3d` stage, one shared set of six position rules, viewport-tuned CSS variables, mirrored transforms, per-cover opacity, a prominent high-contrast position/title/artist caption, and `display: none` for wrappers after the first; suppress the existing card-image zoom and leave short groups unchanged.
- [x] 3.2 Add a serialized component-local CSS disclosure with focusable `aria-disabled` state during flight, ignored repeated activation, and `try/finally` cleanup that yields to search and route cleanup; keep authored motion bounded with no autoplay, looping, drag, timers, animation-frame work, scroll listeners, dependencies, duplicate cards, or stagger.
- [x] 3.3 Keep the full server catalog when JavaScript, mounting, or required 3D CSS support is unavailable; add no asynchronous pre-hydration hiding; make reduced motion reach the same states without Coverflow, nested image zoom, or catalog reveal; treat a failed automatic-mount budget as incomplete work requiring simplification or separate respecification.

## 4. Focused regression coverage

- [x] 4.1 Add focused state and DOM tests for source-derived eligibility/counts, canonical first-six order, artwork-only accessible names, later-wrapper removal from preview rendering/focus/accessibility, six positions, responsive scene variables, `aria-disabled` controls, shared status, ordinary links, exact-once disclosure, serialized cleanup, search-to-clear sequencing and hidden ownership, responsive state stability, pre-cache sanitization, route cleanup, sticky format navigation, top return, reduced motion, unsupported fallback, and retained wrappers.

## 5. Browser and performance verification

- [x] 5.1 Use Browser Use at 320px, 390px, and desktop width to verify the 3D shell, visible-cover hit targets, keyboard focus promotion, ordinary link activation, disclosure, search/clear, format jumps, route restoration, 44px controls, 200% text, 400% zoom/reflow, focus with the mini-player open, reduced/no-JavaScript fallback, zero horizontal overflow, and console cleanliness.
- [x] 5.2 Measure fresh direct loads, app-shell entries, and five normal-speed disclosure runs at 320px, 390px, and desktop width; retain LCP ≤2.5s, CLS ≤0.1, interaction INP ≤200ms, and no enhancement task ≥50ms; fail completion and simplify rather than adding pre-hydration hiding or an unapproved catalog-first branch; record one 4x CPU trace as diagnostic-only evidence.
- [x] 5.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm openspec -- validate add-distro-coverflow-catalog-disclosure --strict`, and `git diff --check` against the final tree.

## 6. Coverflow interaction and reveal refinement

- [x] 6.1 Add bounded pointer-intent suppression so vertical scrolling cannot activate a card, make a side cover's first pointer click select it, and preserve ordinary keyboard and active-cover link activation.
- [x] 6.2 Keep the active record selected, focused, and visibly outlined when `View all` opens the catalog; return `Show Coverflow` to that record and keep search clear free of stale selection state.
- [x] 6.3 Server-render the deterministic first-record preview and gate it before paint on platform capability; restore that state in app-shell snapshots while retaining the full no-JavaScript and unsupported-browser catalog.
- [x] 6.4 Strengthen the active-record caption, document the existing authored `order` as the six-record curation source, remove Firefox's document-snapshot transition path, and replace the plain catalog swap with one reduced-motion-safe component-local hard reveal.
- [x] 6.5 Extend focused tests, verify direct and shell entry plus interaction at mobile and desktop sizes in the required browser path, rerun performance checks and final gates, and complete Brooks and Ponytail review loops without important findings.
