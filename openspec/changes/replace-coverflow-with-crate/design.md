# Design

## Context

See proposal.md for why.

**Where the Coverflow lives today.**

- `StoreCoverflowController.ts` (822 lines) positions real `StoreItemCard` nodes with `data-store-coverflow-position` attributes and plays Web Animations from computed styles.
- The lazy Store search island (`StoreDistroSearch.tsx`, mounted through `ShellPortalOutlets` on every Store collection, with `scope` set to `distro` or `all`) creates it and sends it filter changes through `setSearchActive(hasFilters)`.
- `shell-page-snapshot.ts` strips Coverflow state from cached pages.

**What the behaviour comes from.** The canvas engine `shop.js` from "Coverflow Crate Redesign" v13, a pure model with a DOM adapter. Read it with the Artifact tool, `path: project/shop.js`.

**Constraints:**

- Free-tier image transformations allow only the cards' existing 360w and 720w candidates.
- The eager bundle budgets are in `scripts/check-runtime-bundle-graphs.ts`.
- `[data-distro-search-hidden]` hides cards with `!important` in `@layer components`.
- Lenis is no longer imported. `scrollElementWithLenis` wraps native scrolling.
- `inert-shell-page-snapshots` clones `<main>` into an inert document but keeps the cleanup functions, so this change's snapshot cleanup must stay a pure function of the cloned markup.

## Goals / Non-Goals

**Goals**

- One pure Crate model that every Store collection shares, with illegal states unrepresentable in its types.
- A DOM view that costs nothing until the first Crate intent.
- Card actions (price, Buy, Listen, links) that work unchanged in the Crate.

**Non-Goals**

- A Crate for formats with fewer than 7 items, for Merch, or for item detail and editorial routes.
- New image widths, a motion library, a second card graph, or Crate state outside the history entry.
- A visible tape rack before a page holds 7 tapes.

## Decisions

**1. A pure model ported from the canvas engine, in `components/store/crate/`.**

- Files:
  - `crate-model.ts`: types, catalog, state, `reduce`, `followUp`, `crateTarget`
  - `crate-pose.ts`: poses, timings and the transform string
  - `crate-input.ts`: the one-finger tip gesture, horizontal-only wheel and keys
- Discriminated unions keep the Coverflow-era impossibilities unrepresentable:
  - `FlipHand` is on a sleeve or at the back board; `RackHand` is always on a tape.
  - `Focus` pairs a bin with its own motion type.
  - `Hands` holds only bins that exist.
  - `Tip` and `Reach` are made only by `tipOf` and `reachOf`.
- `reduce` returns the same object when nothing changes, so the view skips work by identity.
- The modules sit inside `web-store`, imported relatively by the island, so they need no `project.json` export.
- _Alternatives:_
  - Extending `StoreCoverflowController`: its state, `preview | catalog | search-results`, cannot express bins, hands or motions without flags that allow impossible combinations.
  - A state-machine library: adds a dependency for about 200 lines of reducer.

**2. The island is the seam, and the Crate view loads lazily.**

- The island already owns filters and a fresh lifecycle per page. It keeps an eager part of about 25 lines: switch visibility from the server-computed `data-store-crate-bins` and the active filters, plus a cached `import('./crate/crate-view')` prefetched on `pointerenter`/`focusin` of the Crate button.
- `mountStoreCrate(root, setFormat)` returns `{ open, choose, close, destroy, isOpen }`.
- A `disposed` flag drops a late import after navigation.
- _Alternative:_ an Astro `<script>` does not rerun after shell navigation and would duplicate filter ownership.

**3. The panel is the in-hand card itself.**

- In Crate mode, CSS hides every other card and lays out the card marked `data-store-crate-hand` as the panel beside or below the bin, with its image frame hidden. Price updates, Buy (with its Adding… and Added states and focus), Listen, In player and focus return all work without change.
- This departs from the canvas, which drew a separate panel. The card's typography stays the Store card's.
- _Alternative:_ a mirrored panel would need a MutationObserver, a Buy proxy and focus repair, which is three new sources of drift.

**4. Format equals bin on Distro.**

- While the Crate is open, the Distro format selection always equals the current bin. `setFormat` applies `applyDistroFormatSelection` and visibility to the page synchronously before anything is measured, and `returnTo` restores the previous filter when leaving.
- Pages without format links use the Crate's own bin row. Store home's format links keep linking to Distro.

**5. The Grid ↔ Crate switch uses viewport coordinates.**

- In one task:
  1. Read the rects of on-screen card image frames. Cards use `content-visibility: auto`, so binary search over card order finds the visible range in about 7 reads.
  2. Swap the views and scroll the stage into place instantly.
  3. Read the sleeve rests.
  4. Animate with `element.animate` from the viewport deltas.
- No inline style or attribute survives the animation, so cached pages stay clean. Every pose uses the same transform-function list, so interpolation never falls back to matrices.
- The scroll is `behavior: 'instant'`: the page's own `scroll-behavior: smooth` would leave the stage moving while it is measured.
- A switch press while covers still fly lands them at once (the animations have no fill) and then switches, so a press is never lost.
- _Alternative:_ page coordinates break because opening the Crate collapses the Grid and moves the scroll.

**5a. The Grid | Crate bar is sticky under the header.**

- "The card the Grid is on" only means something if the switch is reachable from where the shopper is looking. A bar at the top of a long Grid forces a scroll back to the top, which would always open on the first items. The sticky bar keeps the switch in reach; on-screen cards are measured below it, and cards brought back into view clear it with `scroll-margin-top`.
- _Alternative:_ remembering the held card however far the shopper scrolls would reopen a bin they had walked away from.

**6. Sleeves are created, not cloned, and load only within the drawn window.**

- Each bin builds its sleeves with `createElement` on its first visit. `cloneNode` on lazy images fetches every image.
- A sleeve's `srcset` comes from its card image. On-screen covers reuse `currentSrc`.
- Only sleeves from hand −2 to hand + peek + 1 get an image source and `will-change`. Style writes happen only when a sleeve's pose string changes.

**7. One drag turns one sleeve.**

- Past the bin's tipping point (`fall`: 0.16 of the full tip on desktop, 0.2 on phones) the gesture dispatches `drop` and is spent. A flick on release turns at most one sleeve.
- This applies to mouse, touch and pen alike.

**8. Back restores the Crate from the history entry.**

- The view merges `{ storeCrate: { bin, returnTo, hands } }` into `history.state` with `replaceState`, keeping the shell's own keys. Items are identified by Store Item slug.
- Browsers rate-limit history writes, so the record is written once digging pauses (400ms) and at once on any press inside the Crate, before an item link leaves the page. `destroy()` never writes: by then the shell has moved to the next entry.
- On mount, a recorded entry whose item is still in an open bin reopens the Crate instantly.
- Shell snapshots drop the Crate root attribute, the stage host's children and the hand marker in a few inline lines in `shell-page-snapshot.ts`, which never imports the Crate view.

**9. The tape rack is built and dormant.** Its mechanics are unit-tested now. Browser checks wait until a page holds 7 tapes.

## Risks / Trade-offs

- **The bin takes vertical touch input on phones** (`touch-action: pinch-zoom`), so a page scroll that starts on it is consumed. → Cap the bin height at 390 × 844 so the page and the panel's Buy stay reachable from outside it, and add an `@phone` e2e check.
- **Trackpads report wheel input on both axes.** → The wheel only reads horizontal input or Shift with vertical, so vertical scrolling over the bin stays the page's. A consumed horizontal gesture calls `preventDefault`, and the stage sets `overscroll-behavior-x: contain` so a horizontal swipe does not trigger browser Back.
- **BlackBox Releases is not sorted by artist.** → The letters rail lists letters in first-appearance order.
- **The panel can lose focus.** Focus inside the old hand card is lost when the hand changes. → The view moves focus to the stage when that happens.
- **Other in-flight changes:**
  - `add-coming-soon-availability` modifies "Store cards expose whole-item navigation and unobstructed availability"; its delta already uses neutral wording, so this change leaves that requirement alone.
  - `replace-sveltia-with-emdash-operations` still carries an outdated Coverflow scenario in a module-boundaries delta and cannot archive until it is refreshed.
  - `simplify-main-site-modules` sections 9 and 12 review `web-store` and `storefront-catalog` code this change deletes. Schedule them after it.

## Migration Plan

- The change ships as a normal Software Release: Local, then UAT on push, then PRD promotion. No data or content migration is needed.
- Rollback reverts the change's commits; the Coverflow returns with its specs from git history.
