# Design

## Context

See [proposal.md](proposal.md) for the approved implementation scope. Hosted content publication remains separate.

Reference research on 2026-09-22 inspected both sites in the native browser at approximately 1265 × 711:

| Observed surface                                                                    | Useful evidence                                                                                                                                   | BlackBox decision                                                                                                                                |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Dunk catalogue](https://dunkrecords.com/collections/all)                           | Left artist disclosure with counts; four modest product columns; short titles and prices below artwork                                            | Use a browse pane and compact grid. Keep BlackBox's dark identity and left-aligned product text.                                                 |
| [Dunk: Brutus, Unison Life](https://dunkrecords.com/products/brutus-unison-life-lp) | Image beside purchase information; distinguishable Tracklist, Listen, and Pressing info sections                                                  | Keep purchase decisions near the image and give supporting information explicit headings. Avoid burying the tracklist after a large prose block. |
| [BlackBox UAT Store](https://blackbox-records-web-uat.pages.dev/store/)             | 104 items at inspection; Coverflow default; first artwork starts near the bottom of the initial screen; expanded view has three large, tall cards | Gain density through layout, square image frames, shorter cards, and less orientation space. Catalogue counts remain derived, never hard-coded.  |

The current implementation already provides the needed foundation:

- `StoreCollectionPage.astro`, `StoreDistroCatalog.astro`, `StoreItemCard.astro`, and `StoreDistroSearch.tsx` own catalogue presentation and local search; `StoreCoverflowController.ts` owns the optional rack. `AppShellRoot.tsx` and shell snapshot sanitation own activation and cleanup.
- `global.css` uses a `max-w-6xl` general container and multiple Store grid/chunk rules. Most Store artwork has a 4:5 frame; CDs already have complete-photo square framing. Distro's six-card wrappers must not accidentally produce repeating 4+2 rows.
- The loaded font system includes local Veneer plus Bebas Neue, Inter, and Geist Mono. Store card titles currently have a Bebas override, despite the design document's public-title rule.
- Releases already reference Artists and have summary, formats, credits, rich text, and supported listening data. Distro has `artist_or_label`, summary, format, date, and gallery, but no long body or tracklist. Store item pages currently render summary/metadata below the image and purchase section, with release listening links and a static gallery.
- The backend pins EmDash `0.38.0`; staff already has structured form primitives. Its native JSON field stores the validated tracklist values. The existing `prepareCatalogSchema` operation uses supported SchemaRegistry APIs for explicit collection setup.

## Goals / Non-Goals

**Goals:** Make the existing small catalogue easy to scan on ordinary laptops, expose artist choice, improve information on the item page, and keep editorial work inside the existing CMS path. Preserve mobile reading, keyboard access, the persistent shell/player, and commerce authority.

**Non-Goals:** A site-wide redesign, global font replacement, checkout/cart redesign, a new Artist database for distributed bands, multi-select facets, saved filters, recommendation engine, sorting project, pagination, virtualization, catalogue-wide research, or a CMS upgrade. Do not introduce new network/cache/retry layers for this low-traffic use case.

## Decisions

### 1. Keep BlackBox's identity and spend space on records

The register remains **brand**, with the restrained existing monochrome palette and Store accent. Scene: a listener browses records on a laptop at home in evening light, comparing artwork and release information before choosing an item. The anchors are BlackBox's existing record-shelf identity, Dunk's catalogue, and Dunk's item information hierarchy.

This is a concrete refinement of an existing surface, so image-generation probes are unnecessary. The scope is Store collections and item details, with enough layout detail for implementation; it is not a pixel-perfect prototype. Any later Impeccable craft run must satisfy its normal brief approval gate.

Introduce one Store-scoped container, up to **90rem**, with **24–32px desktop gutters** and **16px mobile gutters**. Keep comfortable margins rather than stretching cards indefinitely on large monitors. Do not widen the homepage or editorial sections.

Desktop composition:

```text
existing site header
Store / category H1                 compact vertical padding
All | BlackBox Releases | Distro    existing category destinations
VAT / delivery note                one concise line
┌ Artists pane: 13rem ──┬─────────────────────────────────────────┐
│ All artists           │ Search Store       104 items  Grid | Coverflow
│ Afterwise (1)         │ [art]     [art]     [art]     [art]     │
│ Allochiria (3)        │ title     title     title     title     │
│ …                     │ artist    artist    artist    artist    │
│ Formats / links       │ format    format    format    format    │
│                       │ price     price     price     price     │
└───────────────────────┴─────────────────────────────────────────┘
```

The example counts are illustrative. Keep the exact category labels/routes and shared H1 scale. Remove the extra shelf-purpose headline from the repeated orientation box; the H1, active category link, and one result total already orient the shopper. The category rail stays a concise horizontal row on desktop, independent of the artist filter.

| Viewport                           | Browse tools                           | Product columns |
| ---------------------------------- | -------------------------------------- | --------------- |
| 1280px and wider                   | 13rem left pane, about 24px gap        | 4               |
| 1024–1279px                        | Same left pane                         | 3               |
| 640–1023px                         | Native Browse disclosure above results | 3               |
| 360–639px                          | Same disclosure                        | 2               |
| Below 360px / equivalent high zoom | Same disclosure                        | 1               |

These are CSS targets at default text size, with reflow taking precedence for enlarged text. At **1366 × 768**, bring the first artwork row into the initial viewport and show substantially more catalogue information than the reference. Fitting every first-row price above the fold is a visual aim, not a fixed-height acceptance rule: long titles must still wrap. Keep controls at least 44px high. Use a CSS-sticky desktop pane with a bounded artist-list height and one native **Browse** disclosure in normal flow on mobile. That disclosure contains Artists and format links, with the existing Top utility outside it; do not retain a second format disclosure or mobile sticky format bar.

### 2. Make each card answer the browsing question quickly

Use one square frame across Store cards. Preserve the full cover or physical product with `object-fit: contain`; keep native aspect-ratio sizing and existing responsive image handling. Do not crop or rewrite originals. The pending product-photo-hover feature uses exactly this same frame for its alternate photo.

Card order: **artwork → title → artist/label → selected physical option/format → price and availability**. Omit card paragraphs, the redundant Price label, and repeated Release/Distro labels when the category already conveys that context. Item information retains the omitted prose. Use the selected offer's option label where available; do not suggest a Release's other editorial formats are purchasable options.

Target about 12px internal padding, 16–20px inter-card gaps, 20–24px compact title type, 14–16px artist/price text, and 13–14px secondary metadata. Permit wrapping and content-driven height. Do not truncate the identity to obtain a row-height target. Keep the canonical product link and established accessible title/artist name. If `add-catalog-wide-listening` has landed, retain its Listen button as a sibling of that link, never nested inside it. This change adds no quick-buy action.

Replace or flatten the six-item Distro layout wrappers only as needed for continuous four-column rows. Preserve canonical item/group order, chunk visibility handling, and bounded Coverflow work. Changing one `grid-template-columns` rule while leaving six-card row boundaries is insufficient.

### 3. Use two deliberate Store font roles

Multiple fonts are useful when each has a clear job; four voices across a dense shop create avoidable noise. Use existing **Veneer** for public titles, including the shared H1, compact item titles, and group headings. Use existing **Inter** for everything read repeatedly: artist names, search/filter controls, metadata, prices, availability, descriptions, tracklists, and purchase information. Prices can use tabular numerals without switching to monospace.

Apply these rules inside Store collection/detail content only. Remove the Store card Bebas override and Distro introductory mono treatment; reduce excessive letter spacing. Keep shared header, other sections, player, and cart typography outside this slice. Do not remove globally loaded fonts while other routes use them. Update DESIGN.md's Store guidance when implementation is accepted.

### 4. Add one artist selection to the existing local filtering path

Build choices from the category's existing canonical Store items: resolved Release artist display name for release-backed items and the existing complete `artist_or_label` string for Distro. Normalize trim, repeated whitespace, Unicode normalization, and case for equality; preserve the first canonical display spelling. Do not fuzzy-merge identities, strip accents, split collaborations, or require a label-roster entry. A label-valued Distro credit remains an honest existing credit, with brief help text that Artists includes the catalogue's artist or label credits.

Sort choices alphabetically, deduplicate by that key, show category-level item counts, and provide **All artists**. Use a native radio group with All artists plus the derived choices, one selected value, and visible keyboard focus. Counts are catalogue counts, not stock quantities or dynamic cross-facet counts. No second artist-search field is needed for the current catalogue.

Extend the current Store search component and DOM data rather than introducing another catalogue copy or a generic filter framework. Compute query matching once using the existing exact-first/Fuse fallback; intersect those matches with the selected artist and, on Distro, selected format. Apply visibility once to the existing cards/groups. Query matching uses the category's existing index; then intersect artist and format selections and retain canonical DOM order. No derived search index, memoization layer, or generic filter engine is needed for roughly 100 items.

- **Clear search** clears only text. **All artists** clears only artist. **All formats** clears only format. **Clear filters** clears all three, showing the original grid.
- Keep one accessible result count for Grid/filtered results and one useful empty message with Clear filters. Counts beside artists/formats stay category totals. Do not hide the controls that created an empty result. If a format has no matches under the remaining filters, keep its choice selected and focus the visible results summary instead of a hidden heading.
- All's format links retain their existing destination, `/store/distro/#distro-group-*`; only Distro owns local format selection.
- Category navigation, a full reload, and shell re-entry start with empty text, All artists, and Grid. Distro can still initialize its format from a valid existing fragment. Do not add localStorage, new query parameters, history listeners, or filter restoration machinery.
- No JavaScript: show the full grid and working category/format links; do not display inert artist/search controls.

This deliberately improves the old Distro rule that discarded the selected format and hid format navigation during search. Compose the three simple predicates instead.

### 5. Grid is the baseline; Coverflow starts on request

Use the current modes and controller: `catalog` is the initial Grid, `preview` is Coverflow, and active text/artist filtering uses the existing grid-result path. A format change resets the affected view to Grid; if a query or artist remains selected, it stays in filtered Grid rather than resetting those filters. Show native view buttons in **Grid, Coverflow** order, with `aria-pressed`. Flat categories have one pair; Distro retains one pair per eligible group. Keep the existing eligibility and gesture behavior, adding no category-wide mode synchronizer. Only expose functional Coverflow controls after mounting.

Keep existing eligibility: flat collections and unfocused Distro groups need more than six items; an explicitly selected Distro format can offer Coverflow with two or more. A small ineligible collection simply remains Grid. Selecting a format offers Coverflow when eligible but never enters it automatically.

An active query or artist filter returns to Grid and removes Coverflow from the available actions. Clearing filters stays in Grid. Do not implement a filtered Coverflow, remembered preference, or automatic return to the rack. Existing swipe, wheel, arrow, focus, wrap, and reduced-motion behavior remains when the visitor chooses Coverflow. Returning to Grid restores the selected card and focus.

Update server markup, controller initialization, search reset, and shell snapshot sanitation together. Remove the early preview-hiding/pending-disclosure machinery that exists only to rescue an initially hidden catalogue. Rendering a usable grid until controls are ready removes that failure condition without adding a new recovery mechanism. Preserve cleanup still used for real user-triggered transitions.

Image `sizes` must match the **current** presentation, not just eligibility. Initial HTML describes grid slots, eagerly loads a fixed leading set of at most four cards (from the first group on Distro), and gives at most one expected LCP image high priority. Keep remaining images lazy. Four eager images can span two rows on mobile; do not add viewport detection or a per-device loading controller to avoid that small cost. A view switch may update the existing slot hint; it must not duplicate image nodes or add a preload manager.

### 6. Put item information beside the decision

At desktop widths use a bounded **40% image / 60% information** composition, with main artwork capped around **26rem** and shown in full. On mobile show identity, artwork, then price/actions and supporting content in a single logical sequence. Avoid duplicated heading or purchase blocks for breakpoint changes.

The purchase column contains title, artist/label, exact selected option, existing Listen/editorial links when supplied, authoritative price, primary Add to cart action, and existing purchase information. Compact the gaps and the item H1 (about 28–36px); the separate shared collection H1 contract remains intact.

Below this summary, use **Info** and **Tracklist** side by side when both exist and width permits; stack them on mobile. This lets the tracklist appear alongside long copy instead of after it. Use headings and normal flow, not tabs or a new accordion component. Keep prose at roughly 65–70 characters per line. Format/date and release credits become a short labelled facts list, rendered once. Keep the existing static More views gallery afterwards.

Use existing Release summary/body/credits and Distro summary/format/date for Info, rendering each fact once. Keep Distro's existing summary as its description; a separate long-body field is unnecessary for this presentation change. Omit empty optional sections. Preserve existing supported listening actions, including Distro listening if the separate catalogue-listening change lands first. Provider fields, player expansion, and content research remain owned by that change.

### 7. Structured, format-specific editorial tracklists

User refinement on 2026-09-22 replaces the original multiline-text proposal. An optional native EmDash JSON `tracklist` contains validated embedded value objects, never independently identified track records. `Tracklist` has a declared format. Vinyl and cassette use ordered `Side` groups (controlled A–Z labels); CDs use ordered `Disc` groups. Each group contains ordered `Track` values with a required title and optional validated m:ss duration. Position labels derive from side/disc and list order. The form supplies add/remove/reorder controls, a format selector, side selectors, title inputs and optional duration inputs; editors never paste JSON or a whole free-text tracklist.

Use the existing staff Field, Input, NativeSelect and Button primitives. Tracklist format describes this item's physical edition, not every format named by a Release. Public rendering selects only a matching physical format; unknown or mismatched formats do not acquire guessed tracks. Keep optional data absent/null or empty-safe. An empty tracklist renders no section, heading or placeholder. Private incomplete rows remain drafts; publication validates complete entered rows, unique side labels, duration syntax and bounded list sizes. Changing format must not silently discard existing tracks.

The shared content-model schemas own Tracklist/Track/Side/Disc value validation. EmDash seed definitions and explicit `prepareCatalogSchema` install a native JSON field using SchemaRegistry. Snapshot export, preview, accepted runtime and retained static readers preserve the structure. Existing entries/snapshots without the field remain valid. No hosted field has been installed by this change, so the abandoned text-field design needs no deployed-data migration.

Terminology follows [Discogs tracklisting guidance](https://support.discogs.com/hc/en-us/articles/360005055373-Database-Guidelines-12-Tracklisting) for sided and numbered positions and [MusicBrainz Medium](https://musicbrainz.org/doc/Medium) for the distinction between a physical disc and its sides. These are terminology references, not external catalogue dependencies. The repo glossary defines the narrower BlackBox scope.

## Risks / Trade-offs

- **Artist credits are text for Distro.** Minor case/spacing differences can normalize; different aliases remain separate until ordinary editorial correction. This is preferable to an unnecessary identity migration.
- **Four columns can make long names crowded.** Verify the actual long titles and Greek text; wrap, reduce columns at narrow widths, and keep functional targets large. Do not force equal-height cropped text.
- **Old specs assume preview-first and six-item wrappers.** The deltas explicitly change those assumptions, including pre-ready disclosure. Preserve the rest of the existing gesture and authority contracts. Reconcile the completed Store-wide search delta before eventual archival; the current source is newer than parts of the baseline spec.
- **Optional fields need adoption.** Deliver empty-safe rendering and a representative Local Release and Distro example. Catalogue-wide tracklist research or hosted content population is not an implementation gate.
- **Shared files have other planned changes.** Preserve photo-hover, catalogue-listening, and preview-parity work if they land first. Each plan keeps ownership of its feature; none creates a dependency on catalogue-wide content completion.

## Migration Plan

1. Review this proposal, then implement the presentation/filter changes and optional content fields locally. Use existing components and helpers; add no dependency.
2. Prepare and verify additive field setup against existing Local records as well as a fresh Local schema. Verify old accepted snapshots still render. Use representative private draft/publish examples through the documented Local publication flow.
3. Verify representative paths in existing tests and one Local browser pass: All/Distro plus one Release and one Distro detail at 1366×768 and 390px, with 320px/zoom and keyboard/reduced-motion spot checks. Check 1024px and a populated Merch fixture only for their distinct layout behavior. Reuse existing Local content smoke checks; no full route-by-viewport matrix, new benchmark harness, fault-injection campaign, or repeated unrelated checks. Run required `pnpm validate`, `pnpm validate:editor`, and applicable documented Local publication checks; update Store/editor guidance.
4. Hosted execution is a separate authorized release: use the existing Free-tier preflight, supported additive schema setup, normal UAT release, and existing PRD confirmation gates. No seed overwrite, bulk hosted browse, content backfill, or auto-publication is part of this plan.
5. Before hosted rollout, retain the accepted snapshot and release pair under the existing recovery procedure. Optional columns can remain on rollback. Because older strict validators may reject newly populated fields, use the matching prior content snapshot with prior code or a forward fix; do not assume code-only rollback after new content has been published. No new rollback service is needed.

### Follow-up: familiar format browsing

Preserve the recognizable Browse Distro formats ledger: ruled uppercase rows, right-aligned counts and existing accent feedback. Place formats before Artists in the compact pane so they remain easy to find. Adapt it to the single mobile Browse disclosure rather than nesting another disclosure.
