# VAT and delivery implementation evidence

Date: 2026-09-11. Scope: local implementation on `main`, based on `a312de36704571e5f2b2023a5c3ca9b2931c18dc`, with uncommitted changes. This is not hosted, fiscal-provider or production acceptance.

## Assumptions authorized by the owner

The owner has no measured goods/package data, BOX NOW contract evidence or accountant/provider proof yet and authorized assumptions for a complete local implementation with simple replacement points. The selected inclusive-tax and two-tier shipping design remains unchanged.

`packing-policy.ts` is the replacement point: every current local variant is explicitly assigned a synthetic 315 × 315 × 8 mm / 220 g protected item. Small inner capacity is 330 × 330 × 65 mm with 150 g tare / 2 kg maximum; Medium is 330 × 330 × 155 mm with 250 g tare / 5 kg maximum. Synthetic outer sizes are 340 × 340 × 75/165 mm. The separate mixed-cart test CD profile is 142 × 125 × 12 mm / 110 g. These are test assumptions, not shipping promises or measured capacities.

Measured production assignments/package profiles remain empty and the hosted monetary-policy reference remains null. PRD quote/Session creation fails closed until actual evidence is entered. The subsequent UAT rollout below permits explicitly synthetic test-mode packing. Existing launch and feature gates still apply. No dashboard, generic packing engine, custom tax calculator, fiscal connector stub or new dependency was added.

## Implemented contract

- Existing fixed/custom gross Price Authority is preserved. Creation requests explicitly use inclusive tax behavior. Checkout rejects exclusive/unspecified behavior and unapproved product tax codes. The current approved projection uses `txcd_99999999` for tangible goods; its actual tax applicability remains account acceptance work.
- A single protected flat stack determines Small €2.50 or Medium €3.50. Quotes validate variant identities, quantities, current provider prices, stock and packing. Session creation repeats validation. Browser-supplied delivery/tax overrides are rejected. Stripe receives one inclusive native shipping option, automatic tax, GR shipping collection and no promotion/adaptive-currency choices.
- Additive migration `0018_order_monetary_snapshot.sql` keeps old tax/delivery values null. Pending orders retain the accepted charge, tier and private seller/regime policy reference. Verified gross/VAT fields and line VAT/rates are written with paid status, stock and outbox in the existing D1 batch. Monetary mismatch uses the existing durable `line_mismatch` review reason, avoiding a table rebuild solely for another reason label.
- Reconciliation checks order/Session/Price identity, quantities, fixed or bounded custom amounts, EUR, tax completion, nonzero tax, absence of discounts, accepted tier/charge and cent-exact gross/VAT equations. Invalid data cannot trigger normal stock or delivery effects. Replay retains the original snapshot across changed tariffs/policies.
- Listing/detail disclose inclusive VAT and link to both current delivery rates. Cart/checkout show current merchandise, selected delivery charge and gross total. Loading/unavailable prices are not zero; custom amounts remain explicitly unset until hosted payment. Exact VAT is shown only from a finalized snapshot in confirmations and protected reads. Public return contracts gain no fiscal/personal fields.
- Existing confirmation emails reuse persisted amounts and retain the distinction from a tax invoice/VAT receipt. The new delivery-information page and footer link cover selected local pricing/locker behavior; approved legal identity, timing and return terms are still missing.

## Local checks

- Packing tests: synthetic 8/9/19/20-record boundaries, mixed CD stack, order independence, duplicate variants, footprint rotation, exact/over capacity, weight, invalid/unmeasured profiles, synthetic rejection outside local and overflow.
- Gateway/catalog tests: inclusive fixed/custom creation, unchanged gross amounts, exclusive/unspecified and unapproved tax-code rejection, pagination, complete finalized line data, custom Price bounds and malformed-line rejection. Signed webhook fixtures retain Session/shipping tax data without exposing the private policy reference in responses.
- Real local D1 tests: Small €27.30 / included VAT €5.28, Medium €28.30 / €5.48, three €10 units with line VAT €5.81, custom amounts, concurrent finalization, immutable replay and one stock/outbox effect. Currency/quantity/identity/price/shipping/tax/discount/missing-line failures enter review. Failed review writes retry before acknowledgment.
- Protected-read and email tests verify the persisted breakdown; legacy reads/emails retain unknown amounts without fabricated backfills. Public quote contract tests reject browser money/tier overrides. UI tests cover Small/Medium, custom, loading and unavailable summaries.
- Prisma and OpenAPI/client regeneration was run twice with identical file hashes. Catalog artifact check reports up to date.
- Canonical `pnpm dev:stack:stripe-mock` started successfully and applied the additive local migration. `d1:check:stripe-mock:local` passed for the three currently checkout-enabled mock items. The remaining catalog items retain their existing readiness policy.
- Native browser classification: `bootstrap_ok`. Initial compilation/navigation took longer than the first timeout; the tab loaded. Concurrent test/dev activity later produced Vite `Outdated Optimize Dep` responses; restarting the canonical stack after tests restored hydration. This was not counted as a successful UI result until retried.
- Browser verification at 1365 × 900 and 390 × 844: listing disclosure; item price/disclosure; cart Small €28.00 + €2.50 = €30.50; nine synthetic LPs Medium €252.00 + €3.50 = €255.50; loading after quantity changes; deliberate quote-network failure removed stale totals and disabled payment; restoring requests and changing quantity recovered the quote/CTA. Desktop/mobile checkout rows wrapped without horizontal clipping, and the delivery-information link showed both current rates and explicit locker-versus-home wording. Temporary network/viewport overrides were reset.
- Native network capture on a fresh Store activation showed exactly one `/api/store/listing-prices` request and no per-card offer requests. Quote traffic contains only app line identities/quantities and public amounts. The protected policy and tax fields remain outside the public schemas.
- Local API creation with official stripe-mock accepted one and nine LPs. Quote and Session equality: Small gross 3050, delivery 250, included VAT 590 cents; Medium gross 25550, delivery 350, included VAT 4945 cents. Both mock Sessions had complete automatic tax, EUR and the selected tier. A 27-item three-line cart returned `quote: null`. These tests created only local unpaid holds, which expire normally; no paid webhook or email was sent.
- Module boundaries now register monetary types under the existing domain and delivery components under checkout. The app shell injects the checkout summary into the cart's presentation slot; no cart-to-checkout dependency cycle or wider dependency permission was added.
- Final implementation gates passed: `pnpm test:unit` (1,345 tests in 209 files), `pnpm check` and `pnpm build`, all exit 0. Checks include formatting, lint, type/content validation, module boundaries (393 modules / 901 dependencies) and commerce boundaries (307 browser-facing files).
- Strict OpenSpec validation passed for this change, `production-go-live-readiness` and the affected `module-boundaries` spec. `git diff --check` passed. Parent tasks 2.7–2.9 and 3.8 reference this shared child evidence. Tasks are 12/21 complete; the remaining nine require the external acceptance below.

## External acceptance still open

During the original local implementation, no Stripe account setting, Price, tax registration, receipt switch, fiscal service, deployment or live catalog was changed. Subsequent test-mode changes are recorded below. No customer message, fiscal submission, refund or real shipment was sent.

Tasks 1.1–1.4, provider portions of 4.2–4.4 and 5.4–5.5 require real evidence: seller identity and registration reconciliation; measured packing/contract limits; supported Greek mainland/island/special-territory and foreign-billing behavior; Stripe Tax/custom-amount compatibility and actual costs; DDD Invoices lawful issuance channel, myDATA/credits/dispatch/delivery/retention proof and supported demonstration method; Marosa filing coverage and funding/accountant responsibility. Neither provider is represented as installed or operational. No sandbox support is assumed for DDD.

The runbook in `docs/commerce-operations.md` records the required payment/document/acknowledgement correlation, missing/duplicate-document checks, refund/credit and returned-stock handling, and named-owner/deadline gaps. It does not claim a completed provider rehearsal. This is shared evidence for launch-parent tasks 2.7–2.9 and 3.8; those tasks stay open until their external requirements are met. Do not sync/archive this change or use these synthetic results as launch approval.

## Sources consulted for implementation

- [Stripe tax behavior](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior): inclusive behavior and immutable Price treatment.
- [Stripe Tax with Checkout](https://docs.stripe.com/tax/checkout): automatic tax and shipping/address behavior.
- [Stripe custom amounts](https://docs.stripe.com/payments/checkout/pay-what-you-want): single-item/quantity-one and discount limitations. Account-specific tax/shipping compatibility still needs hosted proof.
- Installed Stripe SDK 22.6.0, pinned API `2026-08-26.dahlia`, was used for Session/LineItem types. No unsupported private fiscal payload was added to browser contracts.

## Owner-authorized UAT rollout

The owner requested pushing and enabling as much UAT testing as possible, retaining simple replaceable assumptions. UAT now uses the same explicit synthetic packing only when its provider key is test-mode, and records `synthetic-uat-inclusive-v1`. PRD remains ineligible under synthetic profiles. A regression covers Local/UAT/PRD with test and non-test providers.

The existing Stripe test account initially had pending Tax settings and no registrations. Test-only Tax settings now use GR origin, inclusive behavior and `txcd_99999999`; a standard GR registration uses the standard place-of-supply scheme. These assumptions are provider test configuration, not evidence of live registration or fiscal compliance. The UAT D1 migration `0018_order_monetary_snapshot.sql` applied successfully without rewriting historical data.

The updated implementation passed `pnpm test:unit` (1,346 tests), `pnpm check`, `pnpm build` and `pnpm audit:unused`. The latter remains the repository's advisory audit. Deployment and hosted results will be recorded after verification. Physical, fiscal-provider and production acceptance stay open.
