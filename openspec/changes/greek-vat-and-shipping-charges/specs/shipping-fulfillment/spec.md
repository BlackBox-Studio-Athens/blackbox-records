## ADDED Requirements

### Requirement: Delivery Charge is explicit and applied once

The system MUST initially charge **€2.50 gross for Small (250 EUR cents) or €3.50 gross for Medium (350 EUR cents)**, including VAT, once per eligible Greek BOX NOW order according to its verified packed size. The shopper amount MUST be disclosed before payment, use the selected taxable VAT Treatment, and remain distinct from the carrier's invoice cost and merchandise stock. The initial policy has no free-shipping threshold, per-item fee or island surcharge; BlackBox absorbs carrier and packaging cost differences for accepted orders.

#### Scenario: Separate delivery is charged

- **WHEN** an eligible Greek cart enters payable checkout
- **THEN** the applicable €2.50 Small or €3.50 Medium order-level Delivery Charge appears separately and contributes once to the gross total
- **AND** merchandise quantity contributes to packed-size validation without multiplying the charge per item
- **AND** delivery is not represented as a stock-bearing Store Item.

#### Scenario: The complete cart determines the parcel tier

- **WHEN** the Worker validates a cart against approved packing rules for products, quantities and protective packaging
- **THEN** it selects the smallest confirmed fitting supported tier and exposes the applicable charge before hosted Checkout
- **AND** changing cart quantities requires recalculation
- **AND** a cart requiring Medium cannot obtain Small pricing by submitting a browser-selected tier or choosing a cheaper Stripe shipping option
- **AND** unknown, Large or split-parcel cases cannot become payable until an explicit supported policy exists.

### Requirement: Packing eligibility accounts for the complete protected cart

The system MUST select the smallest supported package whose measured usable dimensions and gross-weight limit accommodate every cart unit under the supported flat-stack method. It MUST account for quantities, item protection and outer packaging, validate sealed fit against the carrier's tier limits, and keep measurement authority outside the browser. Synthetic measurements MUST NOT qualify production stock for shipping.

#### Scenario: Provisional UAT packing

- **GIVEN** owner-authorized UAT testing with a Stripe test key
- **WHEN** measured profiles are not yet available
- **THEN** the Worker may use the explicit synthetic profiles and a synthetic accepted-policy reference
- **AND** PRD and UAT without a test key remain ineligible under these profiles
- **AND** successful provider tests do not establish measured packing or fiscal acceptance.

#### Scenario: Quantity or mixed contents exceed Small capacity

- **WHEN** the protected complete cart exceeds Small height, footprint or weight capacity but fits Medium
- **THEN** the quote is Medium at €3.50 gross, regardless of each item's individual tier or its price
- **AND** the result is independent of line order or duplicate lines for the same variant
- **AND** changing cart contents recalculates eligibility before creating checkout.

#### Scenario: A capacity boundary is reached

- **WHEN** a cart exactly meets usable dimensions and gross-weight limits with the required clearance/protection already accounted for
- **THEN** it fits that package
- **AND** exceeding any one limit prevents that package from being selected even if total item volume is small enough.

#### Scenario: Physical inputs are missing or neither package fits

- **WHEN** an assigned profile is missing, invalid or unmeasured for production, or neither supported package fits
- **THEN** shipping is unavailable and no payable Session is created for that cart
- **AND** the system does not guess from format labels, compress records, invent a larger tariff or request a later customer top-up.

### Requirement: Accepted shipping prices survive carrier and tariff changes

The system MUST preserve the accepted shopper charge for existing checkout agreements and orders despite different carrier costs or later policy changes.

#### Scenario: Carrier cost differs from the shopper charge

- **WHEN** an accepted island order or packaging choice costs BlackBox more or less than the selected tier's fee
- **THEN** the shopper still pays the agreed €2.50 or €3.50 once
- **AND** no additional payment is demanded after checkout.

#### Scenario: The owner changes the future tariff

- **WHEN** a validated Worker tier amount changes for new checkout agreements
- **THEN** the shared public policy and newly created native Stripe shipping option use the new gross amount for that tier
- **AND** an existing Session retains its disclosed tier/amount or is explicitly expired before payment
- **AND** finalized orders and applicable refunds use their original monetary snapshot.

#### Scenario: Configuration is missing or a custom amount is used

- **WHEN** the delivery policy is missing, invalid, unexpectedly zero or incompatible with the chosen payment flow
- **THEN** checkout does not silently assume free or untaxed delivery
- **AND** the accepted pay-what-you-want path must prove the same delivery/tax behavior using the shopper's finalized amount.

### Requirement: Delivery promises match manual BOX NOW operations

The system MUST disclose the agreed Greek BOX NOW locker method, coverage, delivery timing and locker-confirmation process before payment. Accepted carts and destinations MUST fit the approved shipment agreement without undisclosed post-payment charges. Existing restrictions on country scope, automation and BOX NOW data remain in force.

#### Scenario: A shopper reviews delivery terms

- **WHEN** delivery is offered
- **THEN** the shopper can find the gross charge, supported destinations, realistic timing and how the locker is agreed before dispatch
- **AND** collection of a street address does not promise home delivery.

#### Scenario: A cart cannot be fulfilled under the advertised policy

- **WHEN** its destination, quantity or parcel requirements are unsupported
- **THEN** the order cannot become payable under that policy
- **AND** the system does not collect an undisclosed surcharge after payment or use a non-Greece fallback.

### Requirement: Delivery refunds and fiscal dispatch are reconciled

The selling workflow MUST apply the approved consumer-law delivery/return policy, required credit treatment and any applicable fiscal dispatch-document process alongside manual shipment records.

#### Scenario: Withdrawal or another refund is accepted

- **WHEN** an operator processes an eligible return/refund
- **THEN** applicable standard outbound delivery reimbursement, premium-delivery treatment and disclosed return costs are applied consistently
- **AND** VAT and credit records reconcile with the original monetary snapshot
- **AND** withdrawal exceptions do not remove applicable defective-goods rights.

#### Scenario: Shipment is handed over

- **WHEN** an operator dispatches a paid order
- **THEN** the required fiscal issuance/dispatch checks and duplicate-safe shipment record are complete under the approved process
- **AND** a carrier label or an email delivery result alone is not treated as proof of fiscal compliance.
