# Greek VAT and μεταφορικά research

Checked on **2026-09-10** against the main worktree and the primary sources linked below. No authenticated Stripe account or tax registration was inspected. This establishes a technical plan and the evidence needed for launch; it does not certify BlackBox as legally compliant. The selling entity's Greek accountant must confirm its actual obligations.

## Owner clarification and selected baseline

On 2026-09-10 the owner confirmed selling the current site's goods and manual BOX NOW fulfillment only within Greece, then selected **€2.50 gross postage for Small and €3.50 for Medium (250/350 EUR cents), including any applicable VAT**. The complete packed cart determines the applicable tier, charged once per eligible order, with no island/per-item surcharge or free-shipping threshold. BlackBox absorbs carrier/packaging differences for accepted orders; later changes apply to new checkout agreements and preserve accepted orders.

The seller will be either a registered ατομική επιχείρηση or, initially, an individual whose ΑΦΜ is used without the required business setup; the owner explicitly acknowledges the latter as παράτυπα. This records the owner's contemplated alternative, not a legal approval or a VAT exemption. The compliant launch path still requires an actual registered seller, its verified VAT treatment and fiscal-document process. Planning and test preparation do not certify unregistered sales.

## Finding: a bounded implementation plan is needed

The existing launch parent already owns approval of selling terms, fiscal operations, and delivery charges. This child supplies the missing monetary contract; it does not create another launch process.

| Existing seam                                                                                                           | Observed evidence                                                                                                              | Gap                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts`                                                     | Session creation uses mapped Prices, `mode=payment`, Greek address collection, and phone collection.                           | No `automatic_tax`, line `tax_rates`, or `shipping_options` is sent. Collecting an address does not configure a Delivery Charge or calculate VAT.            |
| `scripts/stripe-catalog-contract.ts` and generated catalog projections                                                  | Product projections already carry a tax code; current physical goods use `txcd_99999999`.                                      | Product classification needs review; having a code alone does not activate tax calculation.                                                                  |
| `stripe-catalog-gateway.ts`                                                                                             | Price creation and same-price matching cover money/custom-amount bounds but do not explicitly carry or compare `tax_behavior`. | Dashboard defaults or an incompatible existing Price could silently determine behavior.                                                                      |
| `CheckoutOrderSummary.tsx`, `StoreCartDrawer.tsx`, `checkout-shipping-step-state.ts`                                    | The UI shows a merchandise subtotal and says Greek shipping details are collected at checkout.                                 | No explicit VAT treatment or customer shipping tariff appears in those summaries. This is a source review, not a rendered-site audit.                        |
| `stripe-checkout-session-state.ts`, `apply-paid-checkout-reconciliation.ts`, Prisma `CheckoutOrder`/`CheckoutOrderLine` | Paid persistence retains a total, EUR currency, line gross amounts, and collected fulfillment details.                         | No separate merchandise/delivery/VAT breakdown or corresponding total-equality check. Reconciliation currently derives unit amounts by dividing line totals. |
| `docs/commerce-operations.md`                                                                                           | Protected orders, manual dispatch, exception handling, Dashboard refunds, and returned-stock reconciliation exist.             | Fiscal issuance, myDATA status, and delivery/VAT adjustments need an approved owner and reconciliation procedure.                                            |

The implementation already has multi-line carts and quantities, despite older milestone notes. It also supports a restricted pay-what-you-want path. Both must be covered; planning only a single fixed-price record would miss current behavior.

## 1. VAT: legal facts and their implications

### Applicable treatment

**ΑΦΜ, business commencement and VAT treatment are separate facts.** A sole proprietorship is a natural person's registered business activity. The government startup service requires an existing active Greek ΑΦΜ; AADE separately requires business commencement before transactions within the activity and identification of the relevant business activities. Merely possessing an ΑΦΜ or selecting an individual account in Stripe does not establish a lawful exemption. The actual seller must be consistently identified in the storefront, payment account and fiscal records; an AFM cannot be treated as an interchangeable payment setting. [Government sole-proprietorship service](https://eugo.gov.gr/page/starting-sole-proprietorship), [AADE commencement guidance](https://www.aade.gr/en/node/11660).

Greece's standard VAT rate is 24%; reduced rates require a qualifying category. Supplier-charged transport is included in the taxable value, even when separately agreed. The domestic small-business exemption in Article 44a has a EUR 10,000 turnover condition and other requirements; crossing it affects the triggering transaction. Eligibility is not established by the website's sales alone. Use the current exemption basis, not an old copied Article 39 label. [AADE VAT Code, Articles 24, 26 and 44a](https://www.aade.gr/sites/default/files/2026-04/n.5144_2024.pdf).

**Current catalog evidence and planning inference:** the 101 Distro JSON entries contain only vinyl/LP, CD and cassette formats; `store-tax-category.ts` and the Store projections currently support physical goods only. Editorial Digital availability is not evidence of a native digital sale. Plan for the existing physical audio catalog at the ordinary 24% rate when the seller/transaction is taxable, subject to accountant verification of origin and whether stock is ordinary new-goods resale or has a special arrangement. Do not add clothing, publications, downloads or mixed-rate machinery for hypothetical stock. A price chosen by the shopper for a physical product is not automatically a tax-exempt donation.

The 30% island-rate reduction expanded from 1 January 2026. AADE's signed circular conditions domestic goods sent to qualifying islands on the seller/buyer and transaction circumstances; a mainland seller cannot infer a reduced rate merely from a private consumer's island postcode. Obtain a written ruling for BlackBox's dispatch origin, B2C scope, and any B2B sales. [AADE E.2113/2025, especially sections I–II](https://www.aade.gr/sites/default/files/2026-01/e2113_2025.pdf).

Do not treat `GR` as proof of uniform VAT territory. Stripe explicitly cautions that it calculates Greek VAT for Mount Athos and specified islands despite special local rules. Its list is not a confirmation of every 2026 island case. Test accepted destinations against accountant-approved expected results; resolve unsupported territory handling before payment. [Stripe's Greece calculation coverage](https://docs.stripe.com/tax/supported-countries/european-union/collect-tax?tax-jurisdiction-european-union=greece).

The current product contract permits delivery only in Greece. OSS and export expansion are therefore outside this change. A foreign billing address with a valid Greek delivery address is not itself an export or a reason to reject the shopper. Reassess cross-border rules before expanding delivery. [EU cross-border VAT guidance](https://europa.eu/youreurope/business/finance-and-tax/vat/cross-border-vat/index_en.htm).

### Presentation

Consumers must receive clear total pricing, including taxes and extra charges, before purchase; optional extras require affirmative selection. The proposed UI therefore shows gross item prices, an accurate VAT disclosure, Delivery Charge, and a gross payable total. Included VAT is informational, not another addition. [EU pricing and payments guidance](https://europa.eu/youreurope/citizens/consumers/shopping/pricing-payments/index_en.htm).

Illustrative copy, subject to the approved regime and the site's language:

| Situation                        | English                            | Greek equivalent                    |
| -------------------------------- | ---------------------------------- | ----------------------------------- |
| Registered seller, taxable price | VAT included                       | Περιλαμβάνεται ΦΠΑ                  |
| Final breakdown                  | Including VAT: €5.28               | Συμπεριλαμβανόμενος ΦΠΑ: 5,28 €     |
| Exempt seller                    | VAT exempt — small-business scheme | Απαλλαγή ΦΠΑ μικρών επιχειρήσεων    |
| Small delivery line              | Shipping — BOX NOW Small: €2.50    | Μεταφορικά — BOX NOW μικρό: 2,50 €  |
| Medium delivery line             | Shipping — BOX NOW Medium: €3.50   | Μεταφορικά — BOX NOW μεσαίο: 3,50 € |

These are wording options, not a request to translate the site. Do not display “VAT included” for a seller that does not charge VAT, or claim “free shipping” while collecting a delivery charge later.

### Stripe and fiscal records have different jobs

Explicit inclusive Price behavior keeps the consumer amount fixed while tax is extracted. A Price already marked exclusive cannot simply be switched to inclusive; replacement must follow existing controlled catalog promotion. Product codes and tax behavior configure calculation; they do not establish the seller's registration. [Stripe product and Price tax configuration](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior).

For the VAT-registered, separately charged delivery case, the proposed default is hosted Checkout with Stripe Tax enabled, an active verified Greek registration, approved product codes, and an inclusive Shipping Rate. Manual inclusive Tax Rates were considered for a uniform regime with included delivery; that alternative is not selected now that separate delivery is confirmed. Any replacement must prove native shipping-tax and custom-amount coverage before revising this plan. Choose one calculation path, not a runtime fallback between them. [Stripe hosted tax collection](https://docs.stripe.com/payments/checkout/taxes), [manual Tax Rates](https://docs.stripe.com/payments/checkout/use-manual-tax-rates).

`txcd_99999999` is Stripe's general tangible-goods category; `txcd_92010001` is its Shipping category. Verify the exact product/service fit rather than deriving codes from names or treating all Distro formats alike. [Stripe tax-code catalogue](https://docs.stripe.com/tax/tax-codes).

A Stripe payment receipt or Stripe-generated invoice is not, by its presence alone, evidence that a compliant Greek Fiscal Document was issued and transmitted. Reuse the accountant's lawful retail-receipt/invoice channel, associate each sale and credit with the order reference, and verify transmission and retention. AADE distinguishes approved issuance channels from a generic ERP. Its current FAQ sets 1 October 2026 as the second e-invoicing wave, with a conditional transition period; the accountant must distinguish applicable B2B requirements from retail receipt rules. [AADE e-invoicing and dispatch FAQ](https://aade.gr/ypohreotiki-ilektroniki-timologisi-psifiaka-parastatika-diakinisis-syhnes-erotiseis), [AADE licensed-provider guidance](https://aade.gr/mydata/parohoi-ypiresion-ilektronikis-timologisis).

AADE also documents an e-commerce/card-not-present exception to specified POS interconnection obligations. That exception is not an exemption from issuing sales documents or a blanket conclusion about BlackBox's other sales channels. Have the accountant review the exact payment/receipt arrangement. [AADE E.2044/2024](https://www.aade.gr/egkyklioi-kai-apofaseis/e-2044-19-06-2024).

## 2. Μεταφορικά: price, collection and fulfillment

Use the owner-selected **€2.50 Small / €3.50 Medium gross Delivery Charge once per eligible order**. The carrier's invoice to BlackBox is a business cost; it does not automatically determine the shopper amount. BOX NOW's published consumer tariff effective 6 April 2026 lists domestic small/medium/large parcels at €3/€4/€8 including VAT, with an additional €1 for island destinations. These public prices are a benchmark, not evidence of BlackBox's merchant contract. [BOX NOW dated tariff](https://boxnow.gr/media/PDF/Steiledematimokatalogosnew_Apr%202026.pdf).

**Packing and cost assumptions:** “smallest” is interpreted as the standard Small locker (8 × 45 × 60 cm); Medium is 17 × 45 × 60 cm. No separate Mini/Large tariff has been selected. The selected shopper charges are €0.50 below the published corresponding mainland consumer carrier prices, before packaging; accepted island destinations may cost more. BlackBox absorbs these differences. Confirm whole-cart packing rules using actual products and protective packaging before implementation; do not derive Small/Medium eligibility from price or an unverified item count. Unknown, oversized and split-parcel carts need an approved policy before payment. [BOX NOW locker dimensions](https://boxnow.gr/locker-info).

Both gross tier prices stay the same whether the seller is taxable or lawfully exempt. At ordinary 24% VAT, Small is €2.02 net + €0.48 VAT and Medium is €2.82 net + €0.68 VAT after agreed rounding; under a verified exemption no VAT is collected. Delivery timing, returns/uncollected-parcel terms and the actual business shipping agreement still need operational confirmation.

Hosted Checkout supports fixed Shipping Rates through `shipping_options`, including zero-cost delivery and delivery estimates. Use a native shipping option rather than a fake Store Item: delivery has no merchandise stock and must not enter cart-line matching. The chosen pay-what-you-want flow also needs provider proof with the Shipping Rate, because Stripe limits those Sessions to one item at quantity one. [Stripe shipping charges](https://docs.stripe.com/payments/during-payment/charge-shipping), [pay-what-you-want restrictions](https://docs.stripe.com/payments/checkout/pay-what-you-want).

For a registered seller, charging transport separately does not make it VAT-free. For this plan, an all-standard-rate approved basket uses the same confirmed rate for its ancillary delivery. If mixed-rate goods are accepted, obtain and test the appropriate allocation; never copy the carrier's input VAT into the customer's sale. Stripe documents proportional/highest-rate approaches by jurisdiction, so its actual Greek result needs acceptance rather than assumption. [Stripe shipping tax behavior](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior#preset-shipping-tax-code).

Manual BOX NOW remains the selected fulfillment model. Confirm packaging, parcel limits, destination coverage, business terms and how the customer agrees the locker before dispatch. The public method must say locker delivery; collecting a street address must not imply home delivery. Published carrier limits and portal support are useful inputs, not proof that every permitted cart can ship for one tariff. [BOX NOW partner information](https://track.boxnow.gr/e-shops), [BOX NOW Partner Portal](https://boxnow.gr/diy/eshops/partner-portal).

Consumer terms must disclose delivery costs/timing and return-cost responsibility. Where withdrawal rights apply, refund standard outbound delivery as required; premium-delivery differences have separate treatment. Sealed audio recordings unsealed by the consumer have a withdrawal exception, which must not be confused with defective-goods rights. Confirm the precise Greek wording and applicable exceptions before publication. [Consumer Rights Directive, Articles 6, 8, 13–14, 16 and 18](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32011L0083), [Greek Ministry consumer guidance](https://www.mindev.gov.gr/%CE%BA%CE%B1%CF%84%CE%B1%CE%BD%CE%B1%CE%BB%CF%89%CF%84%CE%B9%CE%BA%CE%AC-%CE%B4%CE%B9%CE%BA%CE%B1%CE%B9%CF%8E%CE%BC%CE%B1%CF%84%CE%B1-%CE%BC%CE%B5-%CF%84%CE%B7-%CE%BC%CE%AD%CE%B8%CE%BF%CE%B4%CE%BF/).

Fiscal dispatch-document applicability, including any retail/courier exception, must be settled alongside the shipment process. A carrier label does not prove all applicable tax dispatch obligations are met. [AADE current myDATA decisions and circulars](https://aade.gr/mydata-ilektronika-biblia-aade/mydata-shetikes-diataxeis).

## Business decisions still required

The owner has settled catalog scope, Greece-only manual BOX NOW and the €2.50 Small / €3.50 Medium gross postage amounts. Remaining decisions are:

1. Actual sole proprietor/seller identity, business commencement and relevant activities, establishment/dispatch origin, tax registration and normal/exempt regime; accountant verification of the current audio catalog and special-territory treatment. The acknowledged unregistered personal-AFM alternative does not satisfy this compliance gate.
2. Whether online checkout is B2C-only; how a shopper requesting a business invoice is directed to an approved process before payment. No automatic reverse charge based merely on an entered VAT ID.
3. Fiscal issuer/tool, lawful retail channel, issuance/transmission deadlines, document retention, refund/credit process, and any digital dispatch requirement. Prefer an existing external process if it meets those obligations.
4. BOX NOW business terms, actual carrier tariff/coverage and verified Small/Medium packing rules for complete carts; delivery estimate, locker agreement, uncollected-parcel and returns policy. The customer prices are selected; BlackBox absorbs carrier-cost differences for accepted orders. Do not invent a price for Large or split-parcel orders.
5. Approval of Stripe Tax's recurring transaction cost if that proposed path is selected; otherwise prove an approved simpler path before implementation.

## Acceptance example

For **synthetic ordinary 24% cases at the selected tariffs**, merchandise €24.80 comprises €20.00 net + €4.80 VAT. Small postage €2.50 gives **€27.30 gross**, **€5.28 VAT** and €22.02 net; Medium postage €3.50 gives **€28.30 gross**, **€5.48 VAT** and €22.82 net. Only the merchandise value is illustrative; delivery uses the selected prices. Verify the provider/issuer's agreed rounding. The storefront, provider, immutable order facts, fiscal document, and refund rehearsal must agree to the cent. After a later tariff change, an already accepted Session retains its tier and fee unless explicitly expired before payment.
