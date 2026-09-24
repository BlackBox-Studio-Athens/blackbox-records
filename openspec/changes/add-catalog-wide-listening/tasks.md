The source research is delivered in [research.md](research.md) and [listening-sources.csv](listening-sources.csv). These are implementation tasks only: do not move unresolved URL discovery into this checklist or invent links to complete a checkbox. Unresolved rows remain visible coverage gaps; the accepted 96/104 scope decision is recorded in `research.md`.

## 1. Editorial data

- [x] 1.1 Extend the shared Distro schema with the existing optional Bandcamp/Tidal fields and validators, and add the matching staff fields. Verify a Distro entry with zero, one, and two sources validates, an invalid source receives the existing field error, and staff save/reload preserves both values.
- [x] 1.2 Derive `embeddedPlayerData` in the existing frontend StoreItem constructors using the current builder, retaining Release IDs and prefixing Distro IDs with `distro:`. Extend the existing catalog/player tests to verify Release compatibility, a Distro source, same-ID cross-collection separation, and unchanged cart/checkout projections.

## 2. Public listening actions

- [x] 2.1 Add the current compact Listen button to DistroCard and StoreItemCard, with sibling native item links/buttons and preserved listing/search/coverflow hooks. Verify Store All, BlackBox Releases, Distro previews and expanded results render the correct source data without per-card iframes or provider requests. Home has no existing catalog-card surface; sold-out state is not present in the local browser fixture.
- [x] 2.2 Adapt only the existing coverflow click/focus handling needed by the new control. Verify mouse/touch Listen and Enter/Space open the player without item navigation, item links still navigate, inactive cards keep their selection behavior, and a drag does not open either a player or an item.
- [x] 2.3 Use the same derived player data on Store Item details while preserving existing release/artist links, galleries, and Add to Cart hierarchy. Verify a release-backed item reuses its existing identity, a Distro item opens the correct recording, and a source-less item remains usable without Listen.

## 3. Apply researched content

- [x] 3.1 Copy verified values from the planning register into the corresponding local editorial records and retained static/bootstrap fixtures, preserving all unrelated fields and IDs. Verify every baseline record is accounted for, published fixture markup uses the recorded provider IDs, duplicate physical editions retain separate sellable identities, and unresolved rows remain explicitly reported. Any changed/new catalog identity returns to planning for research.
- [x] 3.2 Exercise local Distro save, inert preview, reviewed publication, and accepted-snapshot rendering using the current content workflow. Verify drafts remain private, the published item receives its two optional fields, and neither preview nor publication creates a third-party player session or changes commerce state; retain the relevant local evidence required by the content-workspace/publication docs.

## 4. Acceptance

- [x] 4.1 Run `pnpm validate` and `pnpm validate:editor` against the final implementation tree, plus the relevant documented local publication/preview checks. Record the compact passed summaries and any remaining source-coverage gaps; do not treat static checks as browser or hosted evidence.
- [x] 4.2 Verify desktop and narrow mobile layouts in the native browser: Bandcamp-only, both-provider switching, keyboard/focus return, close before interaction, minimize after interaction, Stop, and player persistence through Store category navigation. Recheck existing Release/Artist listening and coverflow drag behavior. The current catalog has no Tidal-only or sold-out record; those exact browser states remain unexercised and are documented in `research.md`.

## 5. Approved Fluid five visual follow-up

- [x] 5.1 Apply the selected animated Fluid five equalizer to shared Listen controls, the modal header and minimized player, preserving player semantics and providing visible focus, touch targets and reduced-motion behavior.
- [x] 5.2 Verify the existing shell flow in Chrome on desktop/mobile, including provider switching, close/minimize/reopen/Stop, navigation continuity and finite motion; run full validation and record the selected design in the living library.

## 6. Selected Store placement and active-session status

- [x] 6.1 Move Store listening actions below artwork at 112 × 44px, retain aligned rows for source-less items, and preserve Coverflow access.
- [x] 6.2 Project the existing session identity into shared Listen controls as an inactive amber In player status; keep Open and Stop in the floating player and reset labels on Stop or source replacement, including cached navigation and overlays.
- [x] 6.3 Apply selected C: keep Grid actions on the card text gutter and center the active Coverflow action below its record. Verify both Store modes in the native browser.

Hosted release and editorial backfill are separate authorized operations using the current release/CMS workflow and Free-tier budget rule. This checklist does not authorize hosted mutations or substitute repository edits for publication.
