## Purpose

Define the approved VAT treatment, monetary evidence and fiscal-document handoff required for BlackBox's Greek commerce transactions.

## ADDED Requirements

### Requirement: Stripe account facts support the selected taxable checkout

The system MUST use the owner's current Stripe account as the seller/business source of truth and implement the selected ordinary taxable, VAT-inclusive treatment for the accepted physical audio catalog. Existing advertised amounts MUST remain consumer gross prices. Actual registration/configuration and fiscal-provider evidence MUST be verified before hosted acceptance and launch; unavailable account access MUST NOT be represented as successful inspection or prevent local implementation with synthetic fixtures.

#### Scenario: Seller details already exist in Stripe

- **WHEN** authorized account inspection is available
- **THEN** existing seller/public details, tax origin and registrations supply the corresponding setup facts without duplicate owner entry
- **AND** public selling information and fiscal records use the same seller
- **AND** only missing required facts require further input, while private identifiers and account dumps remain outside public APIs and source control.

#### Scenario: Account configuration is incomplete

- **WHEN** required tax registration, origin, product classification or fiscal setup is absent or contradictory
- **THEN** affected hosted acceptance remains incomplete until corrected
- **AND** unknown treatment cannot become a zero-tax/default-rate sale or a claim that tax collection or remittance is configured.

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

The system MUST use Stripe Tax as its single tax-calculation path, with explicit inclusive consumer Prices and delivery treatment. Catalog promotion MUST preserve valid Price Authority and report incompatible tax configuration before checkout use.

#### Scenario: Automatic tax is used

- **WHEN** a supported checkout is created
- **THEN** the actual seller origin, required registration, item codes, shipping treatment and inclusive behavior are verified in the correct provider environment
- **AND** missing registration or calculation failure is not accepted as legitimate exemption
- **AND** manual rates are not also applied.

#### Scenario: An existing Price is incompatible

- **WHEN** its tax behavior conflicts with the accepted consumer price contract
- **THEN** it is reported and withheld from the affected checkout path until an explicit compatible correction/replacement is accepted
- **AND** routine promotion does not silently change the provider-owned gross amount or replace Price Authority.

### Requirement: Paid monetary facts reconcile and remain immutable

The system MUST verify and retain an Order Monetary Snapshot containing merchandise gross, Delivery Charge gross and accepted Small/Medium tier, line and delivery VAT, total VAT, currency and the applied treatment, using authoritative finalized payment facts. For the accepted inclusive no-discount model, gross order total MUST equal merchandise gross plus delivery gross; VAT MUST be included once.

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

The selling workflow MUST delegate routine fiscal issuance/transmission to a verified Stripe-connected service, with an accepted Greek issuer, timing, retention, delivery and credit process. Each applicable Fiscal Document and transmission/reconciliation result MUST be traceable to its order independently of payment receipts. Provider marketing, a generic PDF and ordinary Stripe account verification MUST NOT alone satisfy fiscal acceptance.

#### Scenario: A paid sale requires a document

- **WHEN** the approved fiscal workflow processes the sale
- **THEN** the connected service receives the authoritative sale and required buyer facts using the supported Stripe integration
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

The selling workflow MUST identify and verify the Stripe-connected service responsible for Greek VAT filing, its required inputs and the party funding/remitting the liability. Tax calculation, payment receipts and myDATA transmission MUST NOT be treated as proof that a return was filed or VAT paid to AADE.

#### Scenario: Periodic VAT obligations are prepared

- **WHEN** the filing period closes
- **THEN** the responsible service/operator reconciles Stripe sales/refunds and all other required business inputs, including relevant expenses and non-Stripe transactions
- **AND** filing and payment references, deadlines and failures remain traceable
- **AND** unsupported partner coverage remains an explicit acceptance gap rather than a claim that Stripe handles it automatically.
