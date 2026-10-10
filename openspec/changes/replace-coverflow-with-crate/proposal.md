# Proposal

## Why

Store Coverflow is a looping 3D carousel over a whole page. It only works unfiltered: any search, artist, pre-order or format filter returns to the Grid. It mixes formats in one stack and never ends. Shoppers browse a record shop differently: by format, one bin at a time, flipping forward to a back board and standing records back up. The approved Crate design (canvas "Coverflow Crate Redesign", version 13) gives the Store that experience. It is finite, so shoppers can always get back to where they were and to the start, and it keeps every card action that works today.

## What Changes

- **BREAKING (shopper-visible):** remove Store Coverflow from Store home, BlackBox Releases, Merch and Distro, including its controller, controls, CSS and specs.
- **Grid | Crate.** Every Store collection offers Grid | Crate. Grid stays the initial view, and the only view for All formats and for search, artist or pre-order filters.
- **Bins.** A format gets a bin when a page holds at least 7 of it:
  - Vinyl 12-inch stands in a crate.
  - CDs stand in a CD bin.
  - Tapes stand spine-out in a rack.

  The switch is not shown while the Grid holds nothing with a bin. Today that hides it on Merch, on Tapes (4 items) and on 7-inch and 10-inch.

- **Opening.** Crate opens on the card the Grid is on, so Crate, Grid and Crate again returns to the same item. Covers on screen fly between card and bin; reduced motion makes the switch instant.
- **Flipping in a flip bin:**
  - Drag a sleeve past its tipping point and it drops onto the pile. One drag, flick or wheel notch turns at most one sleeve.
  - A back board ends the bin; Back to the start and a letters rail return through it.
  - Arrow keys, Home, End and letters work from the keyboard.
- **The tape rack.** Slide along the spines to pull a tape out; the page still scrolls vertically over it. It is built now and stays dormant until a page has 7 tapes.
- **Moving between bins.** In the Crate, format choices walk between bins and each bin remembers its place. All formats, or a format without a bin, returns to the Grid with that filter.
- **The record panel.** The panel beside the bin is the item's own Store card, so price, availability, Buy, Listen, In player and item navigation behave exactly as in the Grid.
- **Back.** Back from an item page reopens the Crate at the same sleeve. Cached shell pages never keep Crate state.

## Capabilities

### New Capabilities

- `store-crate-browsing`: the Grid | Crate view on Store collections. Covers bin eligibility, opening and returning, flipping and rack mechanics, moving between bins, the item in hand, history restore, input ownership, and bounded runtime work.

### Modified Capabilities

- `store-coverflow-interactions`: retired. Every requirement is removed and replaced by `store-crate-browsing`.
- `distro-coverflow-catalog-disclosure`: retired. Every requirement is removed and replaced by `store-crate-browsing`.
- `store-catalog-categories`: the All Store Coverflow requirement is removed; category, orientation, typography and ordering requirements name the Crate instead of Coverflow.
- `site-images`: the two Coverflow image requirements are replaced by Crate sleeve image candidates and an unchanged Grid image priority. The photo preview and two-width ladder requirements name the Crate.
- `frontend-runtime-performance`: the Coverflow paint-skipping exception is removed, and the bounded-restyle and prepared-layout scenarios describe the Crate.
- `app-shell-and-player`: the plaque Listen scenario becomes the item in hand's own Listen; scrolling and Store orientation requirements name the Crate stage.
- `catalog-listening`: Listen stays separate from Crate gestures and hidden cards.
- `store-listing-price-presentation`: the item in hand offers Buy at every width; the phone Coverflow exception is removed.
- `store-search`: search results, clearing and route isolation name the Crate.
- `distro-search`: no automatic Crate activation.
- `module-boundaries`: the Store Crate view replaces the Coverflow controller as the `web-store` behaviour the shell mounts.
- `project-language`: defines Store Crate, bin, sleeve, pile, back board, rack and item in hand.

## Impact

- **Code:**
  - `apps/web/src/components/store/`: new `crate/` modules and `StoreCrateControls.astro`. `StoreDistroSearch.tsx` and `StoreItemCard.astro` change; `StoreCoverflowController.ts` and `StoreCoverflowControls.astro` are removed.
  - `apps/web/src/layouts/StoreCollectionPage.astro`, `StoreDistroCatalog.astro`, `apps/web/src/styles/global.css` and `store-chrome.css`.
  - `shell-page-snapshot.ts` and `ShellPortalOutlets.tsx`.
- **Tests and scripts:** web-store, app-shell and layout tests, `e2e/store-formats.spec.ts` and a new `e2e/store-crate.spec.ts`, `scripts/check-store-category-output.ts`, `scripts/measure-runtime-performance.ts`, `scripts/runtime-performance-helpers.ts`.
- **No change to:** Worker, API, D1, StoreCart authority, listing-price projection, image widths, or dependencies. The Crate code loads lazily on the first Crate press, outside the eager bundle graphs.
- **Docs:** `DESIGN.md` Store section and `docs/runtime-performance.md` profiles.
