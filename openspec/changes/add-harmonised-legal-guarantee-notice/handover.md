# Claude Desktop handover: harmonised legal-guarantee notice

## Ownership and approval

Finding 8 only. The user's latest instruction assigns **all UI edits, including rendered text, to Claude Desktop**. Codex changed no UI, backend, contracts, content fixtures or live CMS record. This document proposes implementation; it does not approve the design. Prepare a concrete desktop/phone preview and obtain the user's explicit approval before non-text changes on main screens. Follow the current Impeccable setup and approval gates. Do not request approval through this Codex chat.

No new backend/data work is necessary. Do not push, deploy, publish, send real emails, alter provider settings, tax, checkout gates or launch state. Seller telephone/registration corrections are outside this finding. Parent owns the separate future company-transition/durable-order-confirmation change; do not duplicate it here.

## Proposed presentation and copy

- Put **Your legal guarantee rights** near the existing checkout review/purchase information, visibly available before **Continue to Payment**, and add a shop-level reminder on Store. A first click, keyboard activation or tap reveals the full official notice. Prefer native disclosure plus the existing terms document as a fallback; avoid another overlay or a hover-only action. Show this exact proposed placement in the preview before editing the site.
- The revealed content contains the unmodified official RGB English notice and an available official Greek version. Preserve its entire border, proportions, typography and QR code. The blue/yellow statutory artwork is a required exception to site monochrome; do not theme it.
- Accessible heading: **Your legal guarantee rights**. Greek language link: **Στα ελληνικά**. External information link: **EU legal guarantee information**. Supporting sentence, if needed: **Goods sold in the EU have a legal guarantee of at least two years. This is separate from any commercial guarantee.** This sentence complements the full notice; it is not a replacement.
- Provide a complete real-text equivalent checked against the official language file, with `lang="el"` for Greek. A short image alt such as **EU notice on your legal guarantee rights** names the asset but does not replace that transcript. Do not rely on the QR code or a tiny graphic for access to the information.
- If useful, place the full notice under a stable `legal-guarantee` anchor on `/terms/`. This is a renderer/code addition, independent of the accepted CMS terms. Keep existing statutory guarantee, remedies and seller-cost wording intact. Do not rewrite a real accepted paragraph from the pending fixture or add an unsupported commercial warranty.

These are proposed labels and edit locations, not a confirmed shape brief. [design.md](design.md) and [legal-research.md](legal-research.md) explain the rationale and legal distinction.

## Exact source edit points

All paths below are repository-relative to the current checkout; re-check source when implementing because sibling consent work also touches checkout.

| File                                                             | Relevant existing seam                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/pages/store/index.astro`                           | Store document for the proposed shop-level reminder; category documents under `store/merch`, `store/distro`, `store/blackbox-releases` need consistent discoverability if the chosen presentation is document-local.                               |
| `apps/web/src/components/store/checkout/CheckoutOfferStatus.tsx` | `CheckoutOfferStatus`, review/payment panel around the existing delivery summary and `.checkout-review__actions`; the payment button invokes `handleStartCheckout`. Add any local disclosure without changing that callback or newsletter state.   |
| `apps/web/src/pages/store/checkout/index.astro`                  | Current cart checkout document mounts `CheckoutOfferStatus`; preserve its summary/payment structure and noindex metadata.                                                                                                                          |
| `apps/web/src/pages/store/[slug]/checkout/index.astro`           | Compatibility checkout document also mounts `CheckoutOfferStatus`; shared placement must cover it.                                                                                                                                                 |
| `apps/web/src/pages/terms/index.astro`                           | Terms route renders `PurchaseDocument kind="terms"` or its fallback; possible full-notice anchor outside current accepted paragraphs.                                                                                                              |
| `apps/web/src/platform/components/PurchaseDocument.tsx`          | Existing accepted document sections and anchor navigation; avoid broad rewriting.                                                                                                                                                                  |
| `apps/web/src/platform/lib/purchase-information.ts`              | Local/static fixture reader; **not live accepted content**. Do not treat `DEV` draft visibility as a publication.                                                                                                                                  |
| `apps/backend/src/cms/published-purchase-information.ts`         | Hosted replacement reads accepted snapshot `purchase_information`, not repository fixture; no change required.                                                                                                                                     |
| `packages/content-model/src/purchase-information-schema.ts`      | Existing strict approved-content contract, including `terms.damaged_items`; no field addition required.                                                                                                                                            |
| `packages/content-model/src/emdash-content.ts`                   | `purchase_information` singleton mapping; no schema or migration needed.                                                                                                                                                                           |
| `apps/web/src/components/store/checkout/project.json`            | Closed checkout module exports/dependencies. Keep a local component local; if reuse crosses module ownership, update public API and boundary spec together. Prefer established web-platform ownership for genuinely shared statutory presentation. |

Serve downloaded official artwork locally using the project's existing public-static-asset conventions. Obtain the files from the [Commission download page](https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en), record exact original filenames, hashes and source, and inspect each selected asset. No artwork is downloaded into shipped source in this delivery.

## Contract, states and failure behaviour

No new HTTP payload, D1 field, consent, analytics event or persistence. Open/closed state is local presentation only. The Worker remains the authority for offers, shipping, stock and checkout.

- Closed: clearly named reminder, visible focus, comfortably tappable target.
- Open: complete notice, readable text, English/Greek information access. No forced scroll or focus loss; a nonmodal native disclosure avoids focus trapping and shell/history changes.
- Mobile: 320/390px, enlarged text and 200% zoom must remain readable without cropping. Preserve full artwork proportions; demonstrate its actual legibility and transcript in the preview. Do not hide part of the notice to make it fit.
- No JavaScript: disclosure or a direct deployment-aware terms anchor still works. Static image and transcript must not depend solely on React hydration. The existing terms document is server-rendered.
- Image failure: accessible text and official information link remain. Do not call a failed image accepted compliance presentation.
- Checkout loading, empty cart, sold-out/unavailable and payment error: existing state logic stays unchanged; the reminder never starts payment, resets a quote or toggles newsletter consent. Reconcile that file narrowly with the sibling consent change.
- Player/cart: a disclosure has no navigation side effect. Any terms navigation uses the existing shell route; do not replace the page body or invent a history entry.
- GARAN: absent. No verified qualifying producer guarantee was supplied. This does not assert that no such guarantee could exist; separately supplied evidence would require a product-specific follow-up.

## Verification to land with Claude's implementation

1. Preview approved by the user before dependent UI implementation; retain the exact preview and decision in this change.
2. Focused component tests cover first activation, keyboard/touch access, complete artwork/text, language/link correctness and no checkout/consent/cart effects. Use `pnpm test <affected-file-or-module>`; no implementation-mirroring tests for plain copy.
3. Extend an appropriate browser spec to exercise the approved placement and desktop/phone behaviour. Existing relevant suites are `e2e/international-order-checkout.spec.ts`, `e2e/routes.spec.ts`, `e2e/player-continuity.spec.ts` and `e2e/checkout-return.spec.ts`. Use only scoped `pnpm test:e2e e2e/<spec>.spec.ts` selections.
4. Inspect the actual English/Greek assets, desktop and 320/390px presentation, normal-size readability, enlarged text, no-JS path, image-failure text, focus and player continuity. A green local test alone does not establish visual or hosted acceptance.
5. Run `pnpm validate` and guarded strict OpenSpec validation; record source fingerprint, summary, selected acceptance rows and still-unverified hosted acceptance in `validation.md`.
6. Any editorial addition requires a narrow current-revision CMS draft through the existing review path described in `docs/content-publication.md`. Save/publication is outside current authorization. The orchestration reports the live legal record was updated 13 October 2026; preserve its real details and all sibling privacy edits.

## Official sources and remaining questions

[legal-research.md](legal-research.md) records Directive 2024/825, Regulation 2025/1960, Greek Law 5317/2026 articles 82/85 and the commencement correction in Law 5326/2026 article 106. The application date is 27 September 2026. Commission guidelines section 2.3 illustrate first-click catalogue/header/checkout reminders; no rule here invents a mandatory per-product badge or consent checkbox.

Still to establish: user-approved placement and reveal size; exact official English/Greek asset hashes and accessible transcript; reconciliation with the current accepted terms; browser acceptance. No seller/controller identity, retention period or commercial-warranty fact is requested or invented for this scope. The recommended confirmation-email inclusion remains a separately owned future item and is not website-only acceptance.
