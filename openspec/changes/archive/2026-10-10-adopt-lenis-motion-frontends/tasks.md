# Tasks

## 1. Establish the libraries and scroll owners

- [x] 1.1 Add exact Lenis and Motion versions to both frontend package manifests and update the pnpm lockfile.
- [x] 1.2 Add a focused scroll-owner test covering root selection, nested input isolation, immediate positioning, reduced motion, and teardown.

## 2. Migrate public-site scrolling

- [x] 2.1 Initialize Lenis for the public document under the persistent app-shell lifecycle and route smooth navigation through it.
- [x] 2.2 Register owned overlay and cart scroll panes, excluding native controls, embeds, and Coverflow.
- [x] 2.3 Preserve shell route resets, history restoration, focus, anchors, player locks, and hero scroll-threshold behavior.

## 3. Migrate staff scrolling

- [x] 3.1 Initialize Lenis for staff document/workspace scrolling and explicitly register first-party nested scroll panes.
- [x] 3.2 Preserve saved positions, focused rows, editor validation, native EmDash editor internals, and immediate preview synchronization.
- [x] 3.3 Verify responsive pane changes, nested scrolling, modal isolation, and teardown.

## 4. Migrate coordinated animation

- [x] 4.1 Replace public section-transition timer/attribute choreography with cancellable Motion animations, preserving route cancellation and loading semantics.
- [x] 4.2 Migrate public overlay, cart, navigation, player surfaces, and Coverflow transitions where first-party code owns animation.
- [x] 4.3 Migrate first-party staff drawer, history, and disclosure transitions. Retain simple CSS feedback and third-party editor motion.
- [x] 4.4 Apply reduced-motion behavior to every Motion root and imperative animation; remove superseded animation-only CSS and timers.

## 5. Verify both applications

- [x] 5.1 Extend relevant existing unit tests for interruption, overlapping locks, player continuity, saved positions, and reduced motion.
- [x] 5.2 Run scoped validation after each slice and full `pnpm validate` plus `pnpm validate:editor` on the final source tree.
- [x] 5.3 Compare production output and confirm no unnecessary static-page hydration or lost lazy loading.
- [x] 5.4 Complete native Browser Use acceptance for public and staff at desktop and narrow mobile widths. Record limitations and retained CSS/native owners.

## 6. Store and artist refinements requested during implementation

- [x] 6.1 Preserve Coverflow selection on repeated format focus and keep view controls stable during animation and filtering.
- [x] 6.2 Remove stale static listing availability claims, retaining live availability on Store Item details.
- [x] 6.3 Replace generic Bandcamp and TIDAL artist icons with their brand marks.
- [x] 6.4 Refine alternate-image hover and show all product images in an inline thumbnail gallery with shadcn controls, Motion, keyboard, swipe, and reduced-motion support. Keep single-image items static.
- [x] 6.5 Verify the 2016 tape gallery, Coverflow, availability presentation, and artist icons in the BlackBox Chrome browser.
