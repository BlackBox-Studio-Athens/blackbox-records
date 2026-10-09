## Purpose

Define the approved VAT treatment, monetary evidence and fiscal-document handoff required for BlackBox's Greek commerce transactions.

## ADDED Requirements

### Requirement: Stripe account facts support the selected collection mode

The system MUST use the migration's actual natural-person seller/account and preserve advertised gross prices. The 2026-10-09 owner instruction explicitly selects `NO_TAX_COLLECTED` for new agreements and defers actual legal tax treatment/fiscal automation. This selection MUST NOT be inferred from missing registration or described as exemption, zero rating, lawful trading or zero tax liability. Earlier inclusive agreements MUST retain their own immutable policy reference and treatment.

#### Scenario: Explicit no-collection agreement is selected

- **WHEN** the configured Local, UAT or PRD policy explicitly selects `NO_TAX_COLLECTED`
- **THEN** the provider request explicitly disables automatic tax, applies no manual rates or exemption fields, and retains existing Price IDs/gross amounts and the selected delivery charge
- **AND** the quote and checkout disclose that VAT is not calculated or collected, without an included-VAT or exemption claim
- **AND** an unknown policy reference fails closed rather than being interpreted from a substring or current global setting.

#### Scenario: Seller details already exist in Stripe

- **WHEN** authorized account inspection is available
- **THEN** existing seller/public details, tax origin and registrations supply the corresponding setup facts without duplicate owner entry
- **AND** public selling information and fiscal records use the same seller
- **AND** only missing required facts require further input, while private identifiers and account dumps remain outside public APIs and source control.

#### Scenario: Account configuration is incomplete

- **WHEN** required tax registration, origin, product classification or fiscal setup is absent or contradictory
- **THEN** affected tax or fiscal evidence remains incomplete/deferred, while a required provider calculation failure remains a specific technical gap
- **AND** missing facts alone cannot select zero tax or a default rate; the explicit no-collection agreement records collection behavior only, leaving actual liability/registration unknown.
- **AND** unavailable facts or access are not represented as successful inspection or used to prevent unrelated implementation with explicit assumptions.

#### Scenario: Existing advertised prices are retained

- **WHEN** inclusive tax behavior is configured
- **THEN** VAT is extracted from the existing gross price and disclosed as included
- **AND** no seller-exemption branch or automatic 24% increase is introduced.

#### Scenario: A special case is encountered

- **WHEN** a product, business-invoice request or destination is outside the accepted treatment
- **THEN** it cannot proceed through an unsupported payable flow
- **AND** an island postcode, foreign billing address or customer-entered tax ID alone does not establish a reduced rate, export or reverse charge
- **AND** foreign billing does not prevent an otherwise supported Greek-delivery consumer sale.

### Requirement: Provider tax configuration is explicit and verified

The system MUST use Stripe Tax as its single calculation path for accepted automatic-tax agreements and explicitly disable calculation for accepted no-collection agreements. Existing inclusive Price metadata MUST remain unchanged; that conditional setting alone establishes no collected VAT or registration. Catalog promotion MUST preserve Price Authority and gross amounts.

#### Scenario: Automatic tax is used

- **WHEN** an accepted automatic-tax checkout is created
- **THEN** the actual seller origin, required registration, item codes, shipping treatment and inclusive behavior are verified in the correct provider environment
- **AND** missing registration or calculation failure is not accepted as legitimate exemption
- **AND** manual rates are not also applied.

#### Scenario: An existing Price is incompatible

- **WHEN** its tax behavior conflicts with the accepted consumer price contract
- **THEN** it is reported and withheld from the affected checkout path until an explicit compatible correction/replacement is accepted
- **AND** routine promotion does not silently change the provider-owned gross amount or replace Price Authority.

### Requirement: Paid monetary facts reconcile and remain immutable

The system MUST retain verified merchandise gross, aggregate Delivery Charge gross, accepted shipping classification, actual collected tax/rates, currency and immutable policy with saved line quantities. New quantity-band agreements MUST use `manual`; legacy Small/Medium/null meanings remain unchanged. Gross total MUST equal merchandise plus delivery gross. No-collection zero/null facts establish no fiscal net. Original order/hold terms MUST remain immutable.

#### Scenario: No tax was collected under a legacy parcel policy

- **GIVEN** an immutable no-collection policy, €24.80 merchandise and €2.50 delivery
- **WHEN** complete paid provider facts show automatic tax explicitly false, no applied line/shipping tax rates and exactly zero collected line/shipping/total tax
- **THEN** €27.30 gross and zero collected tax with null applied rates are atomically retained and normal stock/outbox settlement occurs once
- **AND** missing values, nonzero/negative tax, applied rates or inconsistent identity/currency/quantities/amounts cause durable review
- **AND** zero collection is not used to calculate a fictional fiscal net amount, legal exemption, tax credit or seller liability.

#### Scenario: A quantity-band order exceeds the old parcel ceiling

- **GIVEN** a new immutable quantity-band no-collection agreement for twenty validated cart units with €496 merchandise and €10 aggregate delivery
- **WHEN** complete paid provider facts show €506 total, automatic tax explicitly false, zero collected tax and no applied rates
- **THEN** reconciliation retains `manual`, the original €10 fee and policy with saved quantities, and settles stock/outbox once
- **AND** protected paid-order readback and confirmation preserve the manual classification without calling it Small, Medium or unknown
- **AND** later tariff changes or replay cannot reprice the order or derive extra parcel fees.

#### Scenario: Inclusive sale with Small postage is finalized

- **GIVEN** synthetic merchandise gross €24.80 and Small delivery gross €2.50, both accepted at 24% with agreed rounding
- **WHEN** verified payment is finalized
- **THEN** order gross is €27.30, total VAT is €5.28 and net is €22.02
- **AND** delivery VAT is €0.48, included in its €2.50 charge
- **AND** normal fulfillment and fiscal handoff use the same snapshot.

#### Scenario: Inclusive sale with Medium postage is finalized

- **GIVEN** synthetic merchandise gross €24.80 and Medium delivery gross €3.50, both accepted at 24% with agreed rounding
- **WHEN** verified payment is finalized
- **THEN** order gross is €28.30, total VAT is €5.48 and net is €22.82
- **AND** delivery VAT is €0.68, included in its €3.50 charge.

#### Scenario: Quantity and rounding are reconciled

- **WHEN** the approved provider/issuer rounds VAT at line level
- **THEN** the snapshot preserves that line amount without requiring net or VAT to divide evenly by quantity
- **AND** actual fixed-price quantities and the final shopper-chosen amount follow their respective validated contracts.

#### Scenario: Monetary evidence is incomplete or inconsistent

- **WHEN** item identity, quantity, currency, tax status, shipping charge or total reconciliation fails
- **THEN** the payment is retained as an actionable review case without normal fulfillment
- **AND** failure to persist the review is retryable rather than acknowledged as safely handled
- **AND** fiscal operators can reconcile the received payment even while fulfillment is held.

#### Scenario: An event is replayed or policy changes

- **WHEN** a finalized event is retried or current tax/delivery policy differs from the accepted Session policy
- **THEN** finalized monetary history is preserved and side effects are not duplicated
- **AND** the original seller and VAT Treatment remain traceable even if a later sale uses another seller/AFM
- **AND** historical missing breakdowns remain unknown rather than being backfilled from current rates.

### Requirement: Stripe-connected fiscal services provide traceable documents

The selected fiscal workflow MUST use a verified Stripe-connected service; implementation/acceptance remains deferred for the uncapped scope. Once configured, each applicable Fiscal Document and transmission/reconciliation result MUST be traceable to its order independently of payment receipts. Provider marketing, a generic PDF or ordinary Stripe account verification MUST NOT alone satisfy fiscal acceptance.

#### Scenario: Fiscal automation is deferred for the requested uncapped scope

- **GIVEN** the owner accepted the 2026-10-08 deferral recorded by launch readiness
- **WHEN** an actual payment or refund is recorded
- **THEN** ordinary Stripe receipt delivery and immutable seller/account/monetary facts remain required
- **AND** fiscal automation stays open follow-up work with the privately attested necessary owner for unresolved obligations
- **AND** the deferral establishes neither a legal exemption nor completed issuance, myDATA transmission or filing.

#### Scenario: A paid sale requires a document

- **WHEN** the approved fiscal workflow processes the sale
- **THEN** the connected service receives the authoritative sale and required buyer facts using the supported Stripe integration
- **AND** its Greek issuer, timing, retention, customer delivery and credit process are accepted
- **AND** the document reconciles with the Order Monetary Snapshot without routine manual sale re-entry or duplicate fiscal issuance
- **AND** the responsible operator can identify missing, failed or duplicate issuance/transmission within the required deadline
- **AND** a payment confirmation or generic invoice PDF alone does not mark fiscal obligations satisfied.

#### Scenario: The connector has no sandbox

- **WHEN** the selected service lacks sandbox support
- **THEN** acceptance identifies its supported non-production demonstration method and remaining unproven behavior
- **AND** no real fiscal submission is performed merely to replace a missing test facility.

#### Scenario: A refund is processed

- **WHEN** an authorized operator refunds merchandise or delivery
- **THEN** the applicable gross and VAT adjustment and required credit document are reconciled with the original sale
- **AND** original monetary history is retained
- **AND** stock is reconciled separately from the payment refund.

### Requirement: VAT filing and remittance remain explicit

VAT filing/remittance automation remains deferred open work for the requested uncapped scope under the privately attested necessary owner. Its eventual acceptance MUST identify and verify the selected Stripe-connected service, required inputs and the party funding/remitting liability. Tax calculation, payment receipts and myDATA transmission MUST NOT be treated as proof that a return was filed or VAT paid to AADE.

#### Scenario: Periodic VAT obligations are prepared

- **WHEN** the filing period closes
- **THEN** the responsible service/operator reconciles Stripe sales/refunds and all other required business inputs, including relevant expenses and non-Stripe transactions
- **AND** filing and payment references, deadlines and failures remain traceable
- **AND** unsupported partner coverage remains an explicit acceptance gap rather than a claim that Stripe handles it automatically.
