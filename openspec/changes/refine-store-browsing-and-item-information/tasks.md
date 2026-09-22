# Tasks

## 1. Compact Store presentation

- [x] 1.1 Add the Store-scoped wider container, compact orientation, desktop Artists/format pane, and one mobile Browse disclosure. Retain the category routes and Top link; remove the old mobile format bar/disclosure. Verify four columns at 1280px and above at normal text size, responsive reflow, shared section H1 typography, and unchanged non-Store layouts.
- [x] 1.2 Compact shared cards to complete square artwork, title, artist, known physical option/format, price, and availability. Remove repeated prose/labels, allow continuous four-column Distro rows, and declare matching image slots with at most four leading eager images. Verify long titles, representative vinyl/CD/cassette/Merch images, existing price-request reuse, and photo-hover compatibility. Preserve any separately added Listen button outside the product link.
- [x] 1.3 Apply Veneer titles and Inter reading/control typography inside Store collections and details. Verify prices, metadata, and Distro introductions use the intended face while shared header/player/cart and other sections remain unchanged.

## 2. Grid default and local artist discovery

- [x] 2.1 Make server markup, the existing Coverflow controller, and snapshot cleanup start and restore in Grid; expose Grid then Coverflow only when ready and eligible. Remove preview-first hiding/intent replay without adding a recovery path. Update existing controller coverage for direct/shell entry, optional Coverflow, selected-card return, filtered Grid, and unchanged gestures.
- [x] 2.2 Derive alphabetical Artists choices and category counts from existing credits, using one native radio selection and the current Store browse component. Verify case/whitespace/Unicode-equivalent credits merge while distinct aliases and collaborations remain intact; add no CMS records, endpoint, or search index.
- [x] 2.3 Intersect text, artist, and Distro format selections through the existing visibility path. Verify matching and empty results, independent clear actions, All formats retaining other filters, canonical order, initial format fragments, and clean route re-entry. A format with zero matches must keep a visible results/focus target.

## 3. Existing item information and optional tracklists

- [x] 3.1 Add optional structured JSON `tracklist` fields with validated Tracklist/Track/Side/Disc value objects to shared Release/Distro schemas, seed definitions, and the existing supported explicit catalogue-schema setup. Verify fresh and populated Local schemas, repeat setup without duplicate fields, and preservation of existing records. Do not create a new migration runner or apply hosted changes.
- [x] 3.2 Add contained format-specific Tracklist controls using the existing staff form primitives and carry the optional value through existing snapshot/export, content-reader, and preview paths. Extend existing round-trip checks for a populated tracklist and an older snapshot without it; preserve normal draft/revision behavior and avoid publication/media refactors.
- [x] 3.3 Compact the shared item template and render Info from existing summaries, Release body/credits, and known facts; add the ordered Tracklist display and retain gallery/purchase/listening features. Verify vinyl/cassette side labels, CD/disc numbering, optional durations, missing/empty fields, format matching, long names, and current unavailable/sold-out states. Distro receives no additional body field or editor.

## 4. Proportionate integration acceptance

- [x] 4.1 Run one representative Local browser pass: All/Distro and one Release/Distro detail at 1366×768 and 390px; spot-check 320px/zoom reflow, keyboard, reduced motion, and no-JavaScript Grid. Check 1024px, BlackBox Releases, and a populated Merch fixture only for their distinct behavior. Confirm denser first-screen content without requiring every price above the fold, plus player continuity, separate Listen/product actions, and unchanged listing-price request count. Record concise evidence; do not multiply every route by every viewport or repeat checks already covered by existing tests.
- [x] 4.2 Use existing checks from `docs/content-publication.md` and `docs/content-workspace.md` with one Local Release and one Distro tracklist example. Verify private draft, shared preview, explicit Local publication, accepted runtime/static parity, and old-content compatibility. Reuse one content round-trip; catalogue-wide research and hosted population are not completion gates.
- [x] 4.3 Update Store-specific DESIGN.md guidance and editor field documentation. Reconcile the completed Store-wide-search delta when syncing these specs, then run `pnpm validate`, `pnpm validate:editor`, and strict OpenSpec validation against the final tree. Record results and any remaining limitation. Hosted schema/content operations and deployment use the existing separately authorized workflow.

## Verification record

The implementation passed full repository validation (1,557 unit tests, format, lint, types, boundaries and production builds). Native browser checks covered responsive Grid, the familiar format ledger, filters, Coverflow, keyboard focus, no-JavaScript content, persistent playback, optional tracklists and a populated Merch preview. The existing Local publication smoke passed with one vinyl Release and one CD Distro example, restoring its edits. Staff Chromium and Firefox checks cover structured entry, format changes, reordering, autosave and removal. Exact final gate summaries and local acceptance notes are retained in `.codex-artifacts/store-verification.md`.

Specs remain an active change; reconcile the completed Store-wide-search delta during the eventual sync/archive operation. Hosted schema setup, catalogue population and deployment were not performed.
