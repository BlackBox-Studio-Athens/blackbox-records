## 1. Prerequisite and scope lock

- [x] 1.1 Confirm `deduplicate-release-page-highlights` is accepted and archived so `release-catalog-presentation` is baseline before applying this change.
- [x] 1.2 Reconfirm the concurrent `refine-store-catalog-discovery` boundary: Releases continues to render `getReleaseCommerceLink()` output as-is, and this change touches no Store route, card, schema, price, availability, checkout, or commerce-ownership code.

## 2. Releases page hierarchy

- [x] 2.1 Restructure `apps/web/src/pages/releases/index.astro` around the selected Option 1 composition: the latest Feature Wall and a smaller sibling `Upcoming` section form an asymmetric desktop row, then the existing remainder grid gains an `Our Releases` heading below, without changing `selectReleasePageEntries`.
- [x] 2.2 Render remaining entries with the existing `ReleaseCard` framed-artwork treatment, preserving whole-card detail navigation, player triggers, overlays, semantic dates, image loading order, and one occurrence per Release entry.
- [x] 2.3 Refactor only the release-scoped rules in `apps/web/src/styles/global.css` to establish the asymmetric wide layout and one-column reflow at 320 CSS pixels; keep Upcoming subordinate and preserve the existing `.releases-latest-feature__actions`, action-link, standalone Listen-control, focus, target-size, and wrapping treatment.

## 3. Verification

- [x] 3.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final tree.
- [x] 3.2 Use Browser Use on direct and shell-managed `/releases/` at desktop and 320 to 390 CSS pixel widths; confirm the selected asymmetric desktop layout and stacked narrow order, Caregivers is the Feature Wall, Disintegration is under Upcoming, Anarchotribal is under Our Releases, and each appears once. Confirm headings and focus order are semantic; Listen retains its indicator and player behavior; View Release retains detail/overlay behavior; the resolved commerce action retains the helper-owned label and destination; featured art is the only priority image; no horizontal overflow appears; and the console is clean.
- [x] 3.3 Run `pnpm openspec -- validate clarify-releases-page-hierarchy --strict` after the prerequisite capability is baseline and resolve every validation finding.

## 4. Review refinement

- [x] 4.1 Update the wide desktop grid so `Our Releases` follows the Feature Wall in the main column while Upcoming can span the right-hand rail; preserve Feature Wall, Upcoming, then Our Releases source order and empty-section behavior.
- [x] 4.2 Simplify release dividers, strengthen `Latest out now` and `Upcoming`, normalize the `Our Releases` heading scale, and extend the existing artwork hover/focus motion to all tiers with reduced-motion support.
- [x] 4.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict OpenSpec validation against the final tree.
- [x] 4.4 Use Browser Use at desktop and 320 to 390 CSS pixel widths for direct and shell-managed `/releases/`; verify the compact hierarchy, semantic/source order, shared artwork motion, reduced-motion behavior, actions, player and overlay continuity, no horizontal overflow, and a clean console.
