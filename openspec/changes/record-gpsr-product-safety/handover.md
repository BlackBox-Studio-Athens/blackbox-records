# Claude Desktop handover: GPSR product information

All UI implementation belongs to Claude Desktop, including rendered text. Codex has changed no UI component. Prepare a concrete preview and obtain the owner's approval before non-text changes on main product/shop screens. Use the existing Impeccable gates. No approval is pending in this chat. This backend work alone does not complete finding 9.

## Exact edit points

- `apps/staff/src/components/content/ContentFields.tsx`: shared Release/Distro editor fields; preserve unknown/untouched values and autosave. `ItemSetupApp.tsx` uses these fields for new items, so support private incomplete drafts there too.
- `apps/staff/src/components/publication/content-validation.ts` and existing publication review components: use existing field-path errors and focus/open-group behavior; do not invent a separate writer or publication action.
- `apps/web/src/pages/store/[slug]/index.astro`: already resolves `sourceRelease` or `distroSource`. Read its `data.product_safety` projection and place visible product identification, manufacturer contacts, required responsible-person contacts and applicable warnings near the offer in the approved layout. A JSON-LD-only or footer-only implementation does not provide the intended visible disclosure.
- Review Release buying surfaces, Store cards/quick-buy and direct `store/[slug]/checkout/` flows before choosing the final display/enforcement plan. The product page alone must not be assumed to cover an offer that can be bought without visiting it. Do not change navigation/player state unnecessarily.
- Tests: existing `ContentFields.test.tsx`, applicable publication tests, and a focused e2e specification for product and direct-buy flows. Use local fixtures, no real suppliers, orders or emails.

## Data contract

Existing APIs and draft/review/publication actions remain unchanged. Backend setup adds optional JSON `product_safety` to `releases` and `distro`; it does not populate records. `@blackbox/content-model` exports `productSafetyContentSchema`, `productSafetyOfferSchema`, `getProductSafetyIssues` and `productSafetyOfferInformation`.

Private JSON fields:

- `review_status`: `incomplete` or `verified`; never preselect verification or save it on opening a record.
- `operator_role`: `manufacturer`, `importer`, or `distributor`, established from actual evidence.
- `product_type`, `product_identifier`: exact edition/batch/physical product, separate from commerce/provider identities.
- `manufacturer`: `name`, `postal_address`, `electronic_address` (email or HTTPS direct-contact page), `establishment` (`eu` or `non_eu`). Missing means unknown; no automatic dunk or BlackBox value.
- `responsible_person`: `name`, `postal_address`, `electronic_address`, `eu_country` (EU member-state ISO code). Required for verification when manufacturer is `non_eu`.
- `safety_information`: `status` (`provided` or `not_required`), plus `text_el` for applicable Greek warnings/instructions when provided. An empty assessment is not “none required”.
- `evidence`: `reference`, `checked_on` (`YYYY-MM-DD`), `notes`. Reference operator-held evidence, not a public upload or sensitive document. Notes must establish role, contacts and safety assessment for the edition.
- Optional `first_placed_on_eu_market` (`YYYY-MM-DD`) records evidence context only; no automatic transition bypass.

CMS drafts accept partial safe values. A `verified` claim must pass complete content validation and evidence checks before publication. `getProductSafetyIssues(rawPrivateValue)` returns `{ path: (string|number)[], message: string }[]`, with `product_safety` as the first path segment. Use these paths for readiness feedback. Readiness reports are not wired to sales controls in this patch.

The accepted/private-preview collection mapper removes internal metadata and evidence and emits only verified `product_type`, `product_identifier`, `manufacturer`, optional `responsible_person`, and `safety_information`. Public collection input is already that projection; do not run the private verification helper on it, because it intentionally has no evidence. Do not serialize raw private safety JSON into HTML or props. Old/incomplete records have no public `product_safety` projection. Repository fixtures remain fixtures, not live CMS content.

## Suggested copy for preview

Staff labels: “Product safety”, “Legal manufacturer”, “Postal address”, “Email or direct-contact page”, “Manufacturer established in”, “EU responsible person”, “Product type”, “Edition or batch identifier”, “Safety information in Greek”, “Evidence reference”, “Checked on”, “Evidence notes”.

Staff helper: “Use verified details for this edition. The pressing plant may differ from the legal manufacturer.” Status: “Required product safety details are missing.” Verification action: “Mark details verified”. No public “GPSR certified/compliant” badge.

Public labels: “Product information and safety”, “Manufacturer”, “EU responsible person”, “Product type”, “Product identifier”, “Safety information”. Show supplier-verified values only; use `mailto:` for validated email or a normal safe link to the verified direct-contact page. No guessed “No hazards”, “Safe for all ages” or generic warning.

## States, accessibility and acceptance

Draft saves, errors and revision conflicts use existing controls. Saving/previewing does not publish or modify stock. Missing facts remain visible to staff; absent data must not be presented to shoppers as an exemption or a safety assurance. Changing a verified identity or warning should require a new documented review before re-verification; account for this in editor state without mutating an unrelated draft. Do not silently connect readiness to a catalogue-wide sale gate.

Use explicit field labels, grouped economic-operator contacts, associated error text, keyboard focus to the first invalid field and normal reading order. Keep warnings visible and legible before purchase; the preview must demonstrate placement on desktop/mobile, long postal addresses, Greek text and direct-buy paths. Do not hide mandatory information only in a collapsed section or behind an image. Respect reduced motion and existing player/cart continuity if those surfaces change.

Verify: old records, incomplete new draft, EU manufacturer, non-EU manufacturer with/without responsible person, missing/invalid contacts, safe contact links, provided Greek warnings, evidenced `not_required`, unknown transition facts, long text, private-draft isolation, selected revision publication, all affected buy surfaces, and no evidence leakage. Unit tests here cover data/projection only; no browser/publication/hosted acceptance has been established.

Official sources and exact outstanding supplier questions are in [legal-research.md](legal-research.md). Owner risk acceptance and absence of business commencement must not be turned into fabricated legal facts or a GPSR exemption. Tax/VAT/launch controls and future-company work are outside this handover. Parent/owner must review the actual incomplete-offer list and authorize its treatment separately. Keep tasks 2.1–2.4 open until their evidence exists.
