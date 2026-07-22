## 1. Baseline Prerequisite

- [x] 1.1 Confirm the completed `extend-store-coverflow-interactions` change has been archived through the separate OpenSpec archive workflow and `openspec/specs/store-coverflow-interactions/spec.md` exists before implementation starts.
- [x] 1.2 Run `pnpm openspec:guard` and strict OpenSpec validation after the prerequisite archive; resolve any delta mismatch before editing runtime code.

## 2. Repeated Wheel Traversal

- [x] 2.1 Extend `StoreCoverflowController.test.ts` with failing cases for unmodified vertical wheel input, horizontal and `Shift` compatibility, `Ctrl` bypass, pixel/line/page normalization, residual accumulation, 120ms repeat gating, 160ms gap reset, direction reversal, and more than one move during sustained input.
- [x] 2.2 Update the shared wheel helper and state to remove the gesture-wide one-move lock, preserve one threshold of residual input per emitted step, and emit at most one move per wheel event.
- [x] 2.3 Update the existing stage-local wheel listener so handled preview input prevents native scrolling only over the stage, while pointer departure, `catalog`, `search-results`, and `Ctrl` + wheel remain browser-owned.

## 3. Focus-Scoped Arrow Navigation

- [x] 3.1 Extend the controller harness with keydown coverage for Left Arrow, Right Arrow, wrapping, repeated keydown, modifiers, non-preview modes, card-focus following, native-control focus retention, and cleanup.
- [x] 3.2 Add one group-local keydown listener that reuses the existing reducer and renderer, moves only for unmodified arrows in `preview`, and adds no document listener, roving tabindex, application role, or stage focus stop.

## 4. Shared Coverflow Presentation

- [x] 4.1 Generalize Store Coverflow eligibility and app-shell mounting so every flat `StoreCollectionPage` route (All, BlackBox Releases, populated Merch, and future non-Distro flat categories) uses the shared Coverflow above six canonical items, six or fewer remains the complete grid, and Distro remains grouped with search-owned lifecycle and no double-mount.
- [x] 4.2 Add stable hooks to existing Store Item availability labels/badges and hide them only inside any Store Coverflow `preview` presentation; prove expanded catalog, unsupported, no-JavaScript, and Store Item detail availability remains unchanged.
- [x] 4.3 Replace card-type-specific Coverflow hover suppression with one shared inner-surface and child-artwork hover/focus-visible cue for every flat Store card and `DistroCard`, leaving outer 3D transforms untouched.
- [x] 4.4 Update reduced-motion rules so artwork scaling and transition are absent while static surface change and visible focus remain perceivable.
- [x] 4.5 Extend flat Store collection, Distro Coverflow, shell, and style tests for universal eligibility, no double-mount, preview-only availability removal, hover parity, focus-visible behavior, and reduced-motion overrides.

## 5. Verification

- [x] 5.1 Run focused Store Coverflow controller, flat Store category, Distro Coverflow, style, and shell snapshot tests; resolve every regression before broad validation.
- [x] 5.2 Use Browser Use on direct loads and app-shell entries for `/store/`, `/store/blackbox-releases/`, populated `/store/merch/`, and `/store/distro/` to verify several consecutive vertical-wheel steps, horizontal and `Shift` wheel compatibility, pointer departure restoring page scroll, repeated arrows from cards and controls, focus behavior, hover parity, and console cleanliness.
- [x] 5.3 Use Browser Use at desktop, 320px, and 390px widths to verify flat-category and Distro catalog/search mode bypass, disclosure transitions, touch behavior remains unchanged, reduced motion remains complete, and no overflow or visible layout instability appears.
- [x] 5.4 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final tree.
- [x] 5.5 Run strict OpenSpec validation and review the final diff to confirm no backend, commerce-authority, dependency, per-category branch, double-mount, duplicate-card, or request-cardinality change entered the slice.
