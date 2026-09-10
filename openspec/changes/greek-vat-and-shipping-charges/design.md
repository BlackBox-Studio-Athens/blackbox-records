## Context

See `proposal.md` for motivation and `research.md` for dated primary sources and exact repository seams. The Worker already owns Price Authority, cart validation, Checkout Sessions, paid finalization, stock reservations, and delivery outbox processing. The static frontend is presentation only. This design extends those seams after `fix-paid-order-reconciliation`; it does not change module ownership or add a parallel commerce system.

On **2026-09-11**, the owner selected the current Stripe account as the seller/business source of truth, Stripe delegation wherever supported, a cart-based shipping algorithm and **VAT-inclusive consumer prices with no seller exemption**. Existing advertised amounts are the intended gross prices. Greece-only manual BOX NOW remains **€2.50 Small / €3.50 Medium (250/350 EUR cents)** once per eligible order. These decisions supersede the earlier open alternatives in `research.md`.

Read-only verification on this date used the owner's BlackBox Chrome profile through the GPT extension. The live account's Business / Tax details shows **Ατομική επιχείρηση**; existing seller/public details are present, but its business website currently differs from BlackBox's site. Stripe Tax settings show head office **Greece**, preset category **General - Tangible Goods**, shipping tax **Determine automatically**, and price inclusion **Automatic** (the screen says EUR prices include tax). These defaults do not prove individual Prices or Sessions are configured correctly. Both **Successful payments** and **Refunds** customer-email switches are off. No settings were changed; personal identifiers, addresses and contact details are intentionally omitted here.

The live Tax overview shows **4/5 setup steps completed**, with transaction tax configuration incomplete. Greece has separate **Small Seller (EU)** and **Standard VAT** registration entries, each with a start date and no displayed end date. The location summary says registrations exist but no integrations are configured to collect tax; automatic filing is not started. Review this overlap against the owner's explicit non-exempt decision before using the account for taxable acceptance; do not infer its calculation effect, silently select an exemption or delete either registration during planning. The Apps / Installed page says **No apps installed yet**. Fiscal/filing connectors, registration correctness and end-to-end collection therefore remain setup/evidence work.

The CLI is installed, but its existing sandbox profile key had expired. Reauthentication was initiated at the owner's request and requires Stripe's authenticator verification. Browser access succeeds independently; CLI readiness must be verified by a successful read after authorization, not inferred from installation.

## Goals / Non-Goals

**Goals:** one consistent consumer price contract from listing through Fiscal Document; complete delivery/VAT reconciliation; no duplicate tax, shipment, or document on webhook retries; reusable launch evidence.

**Non-Goals:** a custom tax rules engine, myDATA API client, accounting dashboard, general 3D packing engine, automatic BOX NOW booking, international delivery, new discounts, currency conversion, or a site redesign. External Stripe-connected fiscal/filing services are in scope for evaluation and configuration during implementation; building substitutes is not.

## Decisions

### 1. Use Stripe account facts and the selected taxable regime

Read seller identity, tax identifiers, business/public details, tax origin, registrations and receipt settings from the existing Stripe account when access is available. Record their effective date/account/environment in private operations evidence; publish only the legally required selling details. Reuse the same seller across public terms, Stripe and the fiscal connector. Keep UAT/test configuration distinct from live business evidence. Do not export account dumps or credentials into source control.

Do not reopen seller-form selection or build an exemption/unregistered-seller mode. The owner has selected normal taxable sales. Missing or conflicting Stripe Tax configuration is a setup failure to resolve in Stripe, not permission to collect zero VAT. Retain account facts as evidence while correcting setup to the selected treatment through the authorized implementation workflow. Only request information demonstrably absent from Stripe or the chosen provider, such as a dispatch origin that differs from the registered address. Account verification and an ΑΦΜ do not themselves prove every Greek fiscal obligation has been performed.

Scope is the current native Store's physical audio goods: vinyl, CDs and cassettes, including existing quantities and shopper-chosen amounts. Ordinary domestic taxable audio sales use 24% as the acceptance baseline, with actual results calculated by Stripe Tax from verified origin, registration and product codes. There is no hardcoded all-Greece rate engine. New product classes need classification before eligibility. Use B2C checkout initially; business-invoice requests go through the configured provider's supported process before payment, with no automatic tax-ID exemption or reverse charge.

Charge **€2.50 gross for Small or €3.50 gross for Medium once per eligible order**, including accepted island destinations; BlackBox absorbs carrier and packaging cost differences. Interpret “smallest” as the standard BOX NOW Small locker (8 × 45 × 60 cm), with Medium 17 × 45 × 60 cm; no Mini or Large rate is selected. No free-shipping threshold, per-item fee or island surcharge. Keep the two amounts in existing Worker configuration; no general rate engine or shipping dashboard.

Use the deterministic stacking algorithm in decision 2 below. It selects the smallest package that fits under a supported packing method, not the theoretical optimum across arbitrary arrangements. Unknown, overweight, oversized or split-parcel carts return an unavailable shipping quote and cannot pay under this policy. Local fixtures and owner-authorized UAT with a Stripe test key may use explicitly synthetic measurements; production eligibility requires measured profiles. UAT retains a synthetic policy reference and separate test tax configuration. This enables provider testing, not physical or fiscal acceptance. No invented Large/multi-parcel price or post-payment top-up.

A later owner tariff change applies to newly created Sessions after the new amount is disclosed; pending Sessions retain their accepted tier/charge or are explicitly expired, and finalized orders/refunds retain the original snapshot. Included delivery is not part of the initial implementation.

Stripe Tax is selected, with inclusive Prices and shipping. The delegation instruction settles the architectural choice; record actual account pricing during setup rather than asking the owner to choose the tax path again. Public Tax Basic Checkout pricing is 0.5% of taxable transaction volume; fiscal/filing partners and optional paid invoices can add separate fees. No subscription, app installation or provider setting is changed by this planning revision. See [Stripe pricing](https://stripe.com/en-gr/pricing).

Unresolved special territories, mixed-rate products or business-invoice treatment block affected sales. `GR` alone is not a territorial tax decision. Do not infer reduced island treatment or reverse charge from postcode/VAT ID alone. Do not reject a shopper merely because billing is foreign when Greek delivery is supported. If hosted Checkout cannot enforce a required destination restriction before payment, the limitation blocks acceptance and requires a revised collection/checkout design; a webhook review after payment is not preventive validation.

### 2. Calculate shipping from a protected flat stack

Keep a small backend-owned packing configuration keyed by existing `variantId`, plus two package profiles, Small then Medium. This is fulfillment data, not CMS editorial content, Stripe Price Authority or browser state. Reuse identical profiles only through explicit variant assignments; do not infer thickness or weight from an LP/CD label, product price or quantity alone. A gatefold, box set and single sleeve can differ. No database/dashboard for measurement entry is needed in this slice.

Each assigned item profile has positive integer millimetres for protected flat length, width and thickness, and positive integer grams for item plus its individual protection. Each package profile records usable internal length/width/height, sealed external dimensions, packaging tare weight, a verified gross-weight limit and a dated measurement reference. Outer dimensions must fit its carrier compartment, including closure clearance; the weight limit is the stricter of the actual merchant contract and tested packaging limit. Published BOX NOW dimensions are Small 80 × 450 × 600 mm and Medium 170 × 450 × 600 mm; these are external limits, not usable box capacity. Do not assume a generic 20 kg ceiling applies to every merchant tier. [BOX NOW partner dimensions](https://boxnow.gr/courier-partners/).

For a server-validated nonempty cart with bounded integer quantities:

```text
stackHeight = sum(quantity × protectedThickness)
itemWeight = sum(quantity × protectedItemWeight)

for package in [Small, Medium]:
    every item footprint must fit package.innerLength × package.innerWidth
        (a 90-degree rotation in the horizontal plane is allowed)
    stackHeight must be <= package.innerHeight
    itemWeight + package.tareWeight must be <= package.maxGrossWeight
    if all checks pass: return package tier and its current gross charge

otherwise: shipping unavailable; do not create a payable Session
```

Validate configuration and safe integer sums; missing/invalid/unmeasured production profiles fail closed. All units remain flat in one protected stack. No compression, upright records, side-by-side packing or volume-only fit claim. The physical rehearsal must verify support and protection for mixed footprints. This conservative O(number of CartLines) rule can reject a cart that a more elaborate arrangement would fit; use another measured packing method only if actual rejected demand warrants it. Aggregate repeated variants before calculations and make results independent of cart order. The same calculation supplies the cart quote and is repeated at Session creation; browser quotes or tier values never authorize money.

Synthetic algorithm example, **not real catalog measurements**: Small internal space 330 × 330 × 65 mm, tare 150 g and gross limit 2,000 g; Medium 330 × 330 × 155 mm, tare 250 g and limit 5,000 g. An individually protected example record is 315 × 315 × 8 mm and 220 g. Eight fit Small (64 mm, 1,910 g), nine require Medium (72 mm, 2,230 g), nineteen fit Medium (152 mm, 4,430 g), twenty do not fit. Seven such records plus a protected 142 × 125 × 12 mm / 110 g example CD require Medium (68 mm, 1,900 g). Real measurements replace these fixtures before production; these are not item-count shipping rules.

### 3. Reuse catalog promotion and hosted Checkout

Extend existing catalog Price reads, creation and eligibility checks to include explicit `tax_behavior`; retain existing Product Projection ownership of tax codes. Audit fixed and custom-amount Prices. The owner confirmed existing amounts as consumer gross prices: preserve them without adding 24% or repricing. Report incompatible/unspecified tax setup, then use the existing explicit Price-replacement procedure where needed; ordinary promotion must not silently replace live Price Authority. [Stripe inclusive pricing](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior).

Read and verify the actual seller origin, Greek tax registration and approved Product codes in each provider environment; correct missing setup through the existing provider configuration workflow. Set `automatic_tax.enabled=true` during Session creation. Verify successful calculation and expected tax; unexpected zero tax is a configuration/review failure, not a supported exemption. Do not combine automatic tax and manual line rates. Disable unapproved tax-ID collection, discounts and currency conversion; those change the accepted monetary contract.

Create one native shipping option for the server-selected parcel tier with `shipping_rate_data`: EUR, `fixed_amount.amount=250` for Small or `350` for Medium, approved BOX NOW locker display name/estimate and explicit inclusive tax behavior. Do not expose both as freely interchangeable choices when the cart needs Medium. Use the verified Shipping tax code for this delivery arrangement. Missing/zero configuration must not silently change this paid-delivery policy. Reusable provider Shipping Rate IDs are acceptable if already operated, but no rate-management service is needed. Any identifier stays backend-only.

Use shipping options, not a stock-bearing merchandise line. They preserve current line identity and the pay-what-you-want single-item restriction. Prove custom-amount plus shipping/tax against the actual pinned Stripe API before accepting it; do not replace an unsupported combination with a fake product or silently drop shipping/tax.

### 4. Present gross prices and delivery early

Expose only the public VAT disclosure and customer Delivery Charge policy through an existing shared Store response; keep internal tax configuration, provider IDs and policy keys private. Publish legally required seller identity/registration information through the approved selling-information surface. Extend existing listing projections as needed without adding a per-card request. Read authoritative Store Offers on existing detail/checkout paths and revalidate every cart line at checkout creation.

Use the existing components/styles. Store listing/detail prices say **“VAT included. Shipping calculated in your cart.”** and link to both delivery rates. Greek equivalent: **“Οι τιμές περιλαμβάνουν ΦΠΑ. Τα μεταφορικά υπολογίζονται στο καλάθι.”** Cart and checkout distinguish merchandise subtotal, Delivery Charge and gross total. A verified breakdown reads **“Including VAT: €5.28”** / **“Συμπεριλαμβανόμενος ΦΠΑ: 5,28 €”**, never an additional surcharge. Do not claim a universal 24% rate where the actual transaction differs. This is clear price disclosure, not a disclaimer transferring the seller's duties. The required result is an unambiguous tax-inclusive total before commitment, not a prescribed magic sentence. [Consumer Rights Directive, Articles 6 and 8](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32011L0083).

If an item amount is chosen in Stripe, state where the final amount will be shown; do not present a preset/minimum or stale localStorage subtotal as final. Before the shipping address/final amount is known, item/ship prices remain gross and exact where fixed; show an exact VAT amount only from an accepted calculation. Hosted Checkout supplies the final breakdown and payment obligation before commitment. This wording does not require translating the rest of the site.

Publish both rates in delivery terms. Before leaving BlackBox, show “Shipping — BOX NOW Small: €2.50” or “Shipping — BOX NOW Medium: €3.50” for the current cart (Greek amounts: 2,50 € / 3,50 €), with locker delivery clear. Use the validated cart quote and shared policy, not independent UI literals or an unconditional lowest-rate estimate. Loading/error states must not masquerade as €0 shipping or VAT exemption. Shopper-facing confirmation and existing email templates reuse persisted verified facts and accurately distinguish order confirmation, payment receipt and Fiscal Document.

### 5. Extend the paid-order snapshot, not the accounting system

Reuse `CheckoutOrder` and `CheckoutOrderLine` with additive nullable monetary fields. Capture merchandise gross, shipping gross, shipping VAT, accepted Small/Medium tier, total VAT, currency, treatment/packing/tariff version and per-line gross/VAT plus the applied rate needed for fiscal reconciliation. Net amounts can be derived by subtraction from these immutable integers; avoid redundant independently computed totals. Store multiple rate components only if the approved catalog actually needs them. No raw Stripe tax/address dumps or general ledger.

Read the completed verified Session, `shipping_cost`, `total_details` and all relevant finalized line tax data through the existing gateway. Verify actual SDK/API semantics against `2026-08-26.dahlia`, including inclusive amounts and tax rounding; do not assume Session `amount_subtotal` is a gross total. Preserve the originally selected policy on the pending order so a later tariff change cannot alter the Session's accepted treatment. Its private decision reference must resolve to the seller and regime effective at sale; a later seller/AFM change must not relabel historical sales, refunds or Fiscal Documents.

Before normal finalization, check safe integer cents, EUR, order/Session/Price identities, validated quantities, selected VAT Treatment, approved Delivery Charge and complete tax calculation. For the supported no-discount inclusive model:

```text
merchandiseGross = sum(finalized merchandise line gross)
orderGross = merchandiseGross + shippingGross
orderVAT = sum(finalized merchandise line VAT) + shippingVAT
orderNet = orderGross - orderVAT
```

VAT is not added again. Never derive tax by summing rounded unit taxes when the provider/fiscal issuer uses a different rounding level. For example, three €10.00 gross units at 24% can produce €5.81 VAT on the €30.00 line rather than three rounded €1.94 amounts. Line VAT/net need not divide evenly by quantity. Preserve authoritative gross unit pricing separately from allocated line tax.

Finalize the complete snapshot with existing atomic stock/order/outbox handling. Incomplete or contradictory monetary evidence uses durable operator review without normal fulfillment; failure to persist that review remains retryable. Replays preserve accepted amounts and create no duplicate stock, delivery or fiscal work. Unknown legacy breakdowns remain unknown, not zero or invented VAT backfills.

### 6. Delegate fiscal work through Stripe-connected services

Stripe is the selected payment, tax-calculation and refund platform. Enable and verify its payment/refund receipt behavior in the implementation setup. These receipts are payment evidence; lawful Greek retail receipts/invoices and myDATA transmission require a verified fiscal channel. Stripe's merchant-of-record product, Managed Payments, excludes physical goods, so BlackBox remains the seller for this catalog. [Managed Payments eligibility](https://docs.stripe.com/payments/managed-payments/how-it-works), [Stripe receipts](https://docs.stripe.com/receipts).

Select a Stripe-connected fiscal service instead of defaulting to manual re-entry or a custom myDATA adapter. Evaluate **DDD Invoices** first: its Stripe Marketplace listing advertises conversion of Stripe payments/invoices to fiscal documents and Greece myDATA coverage. That is a candidate capability claim, not proof of BlackBox-specific retail compliance. The listing says sandbox testing is unavailable. Require the provider to identify its lawful Greek issuance channel, underlying licensed software where applicable, B2C physical-goods support, inclusive shipping/quantity/custom-amount handling, document delivery, credits, retention and applicable dispatch support. Verify these against AADE and the seller's accountant. [DDD Invoices listing](https://marketplace.stripe.com/apps/ddd-invoices), [AADE licensed software](https://aade.gr/en/mydata/adeiodotimena-logismika-parohon-ilektronikis-timologisis), [AADE fiscal FAQ](https://aade.gr/en/mandatory-electronic-invoicing-digital-goods-movement-documents-frequently-asked-questions-answers).

Prefer its payment-driven integration with existing Stripe Checkout and order metadata. Determine its exact required source objects before enabling any additional Stripe feature. Add `invoice_creation.enabled=true` only if the proven connector needs paid Stripe invoices, with separate pricing and fixed/custom-amount compatibility checked. Do not create two fiscal sales or duplicate payment demands for one order. The fiscal service owns document identifiers, transmission acknowledgements, delivery and retries; expose no new public fiscal route and build no second accounting ledger. Use its dashboard plus the existing private operations register for order/payment/document matching and exceptions. Failed transmission, duplicate events and refunded payments must remain traceable even if BlackBox holds normal fulfillment.

VAT filing and payment to AADE are separate from collecting VAT and transmitting invoices. Evaluate a Stripe filing partner, **Marosa first**, for this seller's Greek domestic VAT returns and remittance; record engagement, frequency, deadlines, funding responsibility, and how non-Stripe sales, expenses and input VAT enter the return. A Stripe sales export alone is not a complete business VAT return. If the service cannot cover this business, document the precise gap and revise that part of the provider plan; do not claim Stripe pays AADE automatically or silently fall back to an owner-operated spreadsheet. [Stripe filing partners](https://docs.stripe.com/tax/filing).

Partner contracts/costs and provider demonstrations are setup and acceptance work, not a reason to postpone local monetary code. No real fiscal submission or customer email is authorized by this planning turn. If no sandbox is available, arrange provider-run non-production demonstration/draft evidence; do not invent test support or use a real sale as a rehearsal. Until actual issuance/transmission/credit coverage is proven, fiscal acceptance stays incomplete.

Publish truthful BOX NOW locker delivery, coverage, agreed delivery timing, locker-confirmation procedure and returns terms. Confirm supported cart quantities can be packed under the merchant agreement; reject unsupported carts before payment or revise the approved tariff. Never ask for an undisclosed delivery top-up after payment. Refund gross merchandise and applicable delivery consistently with the published/legal process, issue the required credit, and reconcile physical returned stock separately.

## Risks / Trade-offs

- **Account access or territorial configuration missing** → implement the selected contract locally; capture actual account evidence and accepted destination results before hosted acceptance. Do not infer tax status from payment capability alone.
- **Stripe delegation has coverage/cost limits** → test fiscal and filing partners for this seller; marketplace advertising is not legal acceptance. Do not replace the selected workflow with unsupported Stripe-only claims.
- **Mixed rates, historical orders and rounding** → retain actual line/shipping facts, test cent reconciliation, and never fabricate history.
- **Dashboard/catalog drift or cached cart amounts** → verify tax eligibility at promotion and checkout; show the provider's final accepted total before payment.
- **Packing measurements or connector delivery fail** → unmeasured carts cannot pay; rehearse mixed packing and fiscal exception recovery. Keep a named operator for failures and manual BOX NOW dispatch.

## Migration Plan

1. Record the selected account-authority, taxable inclusive, Stripe Tax and packing contracts. Local implementation may start with explicit synthetic fixtures; account inspection, physical measurement and partner proof proceed as separate acceptance tasks. Keep the parent's live gates closed.
2. Apply additive local migrations and extend existing mapping/reconciliation/projections. Keep the canonical stripe-mock stack functional; mock results prove contracts only.
3. Validate and configure the selected regime in the designated account's sandbox. Replace incompatible UAT Prices deliberately, refresh listing projections and expire/drain obsolete Sessions before changing monetary policy. Sandbox example business data is not the live seller authority.
4. Run full repository gates and one shared hosted UAT acceptance on the final tree with approved recipients. Separately demonstrate fiscal issuance/myDATA/credits/dispatch and filing responsibilities through the selected services. Identify provider demonstration versus actual submissions; DDD's listing is not evidence of a sandbox. Resolve unsupported provider requirements before affected integration work and launch acceptance.
5. Supply evidence to parent tasks 2.7–2.9 and 3.8. PRD catalog mutation still needs one-run confirmation; production preparation/deployment and final launch approval remain parent work.
6. On failure, close checkout through existing controls, expire affected open Sessions and retain orders/fiscal evidence. Restore only a previously accepted compatible configuration/Price mapping. Do not roll back fiscal history or reopen an unverified old monetary path.
