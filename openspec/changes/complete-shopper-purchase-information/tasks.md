## 1. Establish approved content inputs

- [x] 1.1 Run `pnpm openspec:guard` and inventory the current terms, footer, item/cart/checkout, and personal-data form surfaces; deliver a coverage checklist linked to `production-go-live-readiness` task 2.7 and the VAT child's existing policy components.
- [x] 1.2 Inventory actual data flows and approved public seller details, request only missing business/privacy wording, and record approval or a concrete publication blocker for every required section; keep private account evidence outside Git. This task gates publication, while synthetic-fixture implementation may proceed.
- [x] 1.3 Complete the applicable Impeccable review for the accepted Store Item purchase hierarchy, brief summaries, and full static documents; review identity/exact option/price/Add to Cart grouping before long copy, mobile placement before large artwork, a quieter Back to Store link, and integration with the listening change.

## 2. Implement shared information and links

- [x] 2.1 Add the structured purchase-information collection entry/schema and shared query using current content conventions; verify schema checks reject incomplete publishable entries, preserve one source for summaries/full copy, and contain no editorial price/tax authority. Keep any CMS exposure aligned with existing generated editorial schemas.
- [x] 2.2 Extend `/terms/` and add `/privacy/` with full static content, descriptive anchors, metadata, and sitemap entries; verify rendered documents and links under both the UAT base path and PRD root, including a no-JavaScript view.
- [x] 2.3 Add summaries and terms/help/privacy links at Store Item purchase actions, cart/checkout review, footer and relevant personal-data forms; verify selected item-option clarity, locker-versus-home-delivery wording, and unchanged newsletter consent behavior.
- [x] 2.4 Reuse existing VAT/delivery components alongside the new information; verify available/unavailable policy fixtures, unchanged charge/tax authority, and no added per-card offer reads or unsupported receipt/fiscal promises.
- [x] 2.5 Reorder the Store Item template into one identity/exact option/price/Add to Cart group, remove the duplicated release title, and demote Back to Store to a text link; place the group before large artwork and long description on mobile, preserve the Distro gallery and any listening actions, and verify loading/unavailable states never imply an enabled purchase.

## 3. Validate publication readiness

- [ ] 3.1 Replace synthetic fixtures with the approved public wording only after task 1.2 is complete; compare every published section and summary to its approved source and verify no placeholder or private evidence enters the static artifact.
- [x] 3.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` on the final tree; use native Browser Use for desktop/mobile, keyboard, link anchors, consent adjacency, and item/cart/checkout information coverage, recording redacted evidence.
- [x] 3.3 Supply this child's coverage and acceptance evidence to launch task 2.7 and VAT task 4.4, without repeating implementation or publication checks for each checklist; reference accepted VAT inputs without requiring VAT archival first. Verify launch approval and pending owner/provider decisions remain with the existing parent and VAT child.
- [x] 3.4 Run `pnpm openspec -- validate complete-shopper-purchase-information --type change --strict` and `git diff --check`; leave publication/hosted acceptance pending until approved text and authorized deployment evidence exist.
- [x] 3.5 Capture the Store Item at 390x844 and 1280x800 CSS pixels; verify Disintegration clearly sells Black Vinyl LP despite release-wide CD/digital metadata, title appears once in the purchase group, long copy follows the action, mobile artwork does not precede that group, and keyboard/zoom order matches the visual hierarchy. Include a Distro item, long-title fixture, and unavailable offer without adding a second purchase group.
