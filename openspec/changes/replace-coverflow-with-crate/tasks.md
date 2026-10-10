# Tasks

## 1. Baseline

- [x] 1.1 Archive the thirteen completed changes that carried Coverflow or Store deltas, and reword the Coverflow phrases in the three unreleased Store deltas; verify `pnpm openspec -- validate --specs` passes (commit 146ee528).

## 2. Specs

- [x] 2.1 Write the proposal, design and delta specs; verify `pnpm openspec -- validate replace-coverflow-with-crate --type change --strict` passes.

## 3. Crate model, pose and input

- [x] 3.1 Port the canvas model to `apps/web/src/components/store/crate/crate-model.ts`.
  - Contents: format-to-bin mapping from `getStoreDistroFormatGroup`, bins from 7 items, hands only for open bins, `initial`, `reduce` returning the same object when nothing changes, `followUp`, `crateTarget`.
  - Verify `crate-model.test.ts` covers:
    - the round trip
    - closed bins and the hidden switch
    - walking between bins
    - the back board
    - rack clamps
    - one sleeve per drop
- [x] 3.2 Port poses and timings to `crate-pose.ts`; verify `crate-pose.test.ts` covers:
  - one transform-function list for the Grid, flip, pile and rack poses
  - the `tipForDrag` inverse
  - no timings under reduced motion
  - drop timings inside the drop window
- [x] 3.3 Port the tip gesture and keys to `crate-input.ts`, and move the wheel helpers there as horizontal-only. Verify `crate-input.test.ts`:
  - one drag turns one sleeve
  - a flick turns at most one
  - vertical wheel is ignored
  - the moved wheel cadence cases pass

## 4. Markup and styles

- [x] 4.1 `StoreItemCard` derives its format key and drops `coverflowEnrolled` and `data-store-grid-sizes`; verify the card markup assertions in `StoreCollectionPage.test.ts`.
- [x] 4.2 Replace the controls and swap the export:
  - Add `StoreCrateControls.astro`: Grid | Crate switch, bin row, stage host, letters rail, Previous/Next, Back to the start, status.
  - Render it from `StoreCollectionPage.astro` and `StoreDistroCatalog.astro` only when the server counts a bin.
  - Swap the export in `components/store/project.json`.
  - Verify the layout tests (Merch renders no controls, Distro lists the crate and the CD bin) and `pnpm check:boundaries`.
- [x] 4.3 Add `crate.css`, ported from the canvas:
  - `touch-action` per mechanic
  - the hand-card panel
  - shade layers
  - the phone bin cap
  - reduced motion
  - the site curve

  Verify the rewritten `touch-ergonomics-css.test.ts` assertions.

## 5. Behaviour

- [x] 5.1 Island glue in `StoreDistroSearch.tsx`:
  - switch visibility
  - a cached lazy import with a `disposed` guard
  - filters close the Crate
  - format links call `choose`

  Verify island tests for switch visibility and cleanup.

- [x] 5.2 `crate-view.ts`:
  - stages built per bin on first visit
  - the sleeve window and its image sources
  - pose-diff writes
  - the hand marker and panel
  - rail, status and focus moves

  Verify `pnpm test web-store` and the desktop `store-crate` e2e cases for opening, flipping, keys and the back board.

- [x] 5.3 Grid ↔ Crate animation in viewport coordinates, with a `data-store-crate-settled` marker and an instant path under reduced motion; verify the e2e checks that covers land within 750ms and that reduced motion leaves no running animations.
- [x] 5.4 Back restore through `history.state`; verify the e2e check that item page then Back reopens the Crate at the same sleeve.
- [x] 5.5 Replace `sanitizeStoreCoverflowSnapshot` in `shell-page-snapshot.ts` with an inline Crate cleanup that never imports the Crate view, drop the Coverflow `onError` from `ShellPortalOutlets.tsx` and the Coverflow block from `sanitizeStoreSearchChrome` (its other resets stay); verify `shell-page-snapshot.test.ts` asserts a cached copy holds no Crate state.

## 6. Remove the Coverflow

- [x] 6.1 Delete `StoreCoverflowController.ts`, `StoreCoverflowControls.astro`, the coverflow CSS in `global.css` and the `@supports` block in `store-chrome.css`, with their tests.
  - Rewrite the remaining assertions in:
    - `StoreCollectionPage.test.ts`
    - `catalog-containment.test.ts`
    - `StoreListingPricePresentation.test.ts`
    - `_store-item-detail-gallery.test.ts`
    - `check-image-markup.test.ts`
  - Verify `pnpm test web-store`, `pnpm test web-layouts` and `pnpm test:app-shell` pass, and `rg -i coverflow apps/web/src` finds nothing.

## 7. Scripts, end-to-end checks and docs

- [ ] 7.1 Update `scripts/check-store-category-output.ts`: the switch is disabled on the server, there is no Crate state, and Merch has no controls. Verify `pnpm store:categories:check`.
- [x] 7.2 Update the performance script:
  - In `scripts/measure-runtime-performance.ts`, make `prepareTraversal` a Grid no-op, delete the disclosure run and its traversal flags, and add `crate-wheel` and `crate-touch` profiles on Distro.
  - In `scripts/runtime-performance-helpers.ts`, delete `assertTraversalSetup` and its test.
  - Verify the Store scroll profiles and the new profiles run.
- [x] 7.3 End-to-end specs:
  - Add `e2e/store-crate.spec.ts`, including the `@phone` cases, and add it to the `webkit-mobile` list.
  - Move the Coverflow wheel, swipe and front-card Buy cases out of `e2e/store-formats.spec.ts`.
  - Verify `pnpm test:e2e e2e/store-crate.spec.ts` and `pnpm test:e2e e2e/store-formats.spec.ts`.
- [ ] 7.4 Update the `DESIGN.md` Store section and `docs/runtime-performance.md` (profiles); verify neither mentions the Coverflow.

## 8. Integration

- [x] 8.1 Verify `pnpm build:web` keeps every eager bundle graph within budget, and record the Crate chunk size.
- [x] 8.2 Run the regression specs: `store-preorders`, `store-cart`, `player-continuity`, `shell-navigation`, `routes` and `performance-acceptance`.
- [ ] 8.3 Compare Store and Distro before and after with the `desktop-load`, `mobile-load`, `wide-scroll` and `mobile-scroll` profiles, and run the Crate profiles at 4× CPU slowdown with no long task of 50ms or more. Record the results in `validation.md`.
- [ ] 8.4 Run `pnpm validate` on the final tree and record the summary path, source SHA, acceptance rows and remaining gaps (the dormant tape rack) in `validation.md`.

## Workflow follow-up

- Check the Crate on UAT after the push, then archive this change once PRD acceptance is recorded.
