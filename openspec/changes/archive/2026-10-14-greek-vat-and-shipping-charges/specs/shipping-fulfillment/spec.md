## ADDED Requirements

### Requirement: Delivery Charge is explicit and applied once

The system MUST charge one aggregate Delivery Charge per eligible Greek BOX NOW order: €3 for 1–4 validated cart units, €6 for 5–8, or €10 for 9 or more. Current NO_TAX_COLLECTED explicitly disables automatic tax and claims no included VAT or exemption. Carrier costs and actual parcel count remain separate; BlackBox absorbs differences without a later top-up. Historical agreements retain their original charge and policy.

#### Scenario: Separate delivery is charged

- **WHEN** an eligible Greek cart enters payable checkout
- **THEN** the accepted quantity-band Delivery Charge appears separately and contributes once to the gross total on the site and in Stripe
- **AND** total validated cart quantity determines the band, without inferring disc counts from item metadata or charging per parcel
- **AND** delivery is not represented as a stock-bearing Store Item.
- **AND** owner-authorized assumed dimensions remain labelled assumed until measured evidence exists.

#### Scenario: The complete cart determines the delivery band

- **WHEN** the Worker validates a cart's products, quantities, prices and stock
- **THEN** it sums all validated line quantities and exposes the €3/€6/€10 band charge before hosted Checkout
- **AND** changing cart quantities requires recalculation
- **AND** the browser cannot select a cheaper band or Stripe shipping option
- **AND** parcel count and manual packing do not alter this fee or impose a nineteen-unit order ceiling

### Requirement: Packing eligibility accounts for the complete protected cart

The system MUST apply the final quantity-band tariff to newly created agreements, counting validated cart units across all lines. Every validated PRD variant shares the owner-authorized assumed item profile, regardless of format. Actual parcel selection and count are manual fulfillment responsibilities and MUST NOT impose the old single-parcel capacity ceiling on new orders. Actual measurements remain Unknown; identity, price, quantity, stock and configuration checks remain.

#### Scenario: Provisional UAT packing

- **GIVEN** owner-authorized UAT testing with a Stripe test key
- **WHEN** measured profiles are not yet available
- **THEN** the Worker may use the explicit synthetic profiles and a synthetic accepted-policy reference
- **AND** this UAT test authorization alone enables neither PRD nor UAT without a test key; PRD universal assumed packing has separate explicit owner authority and its own policy reference
- **AND** Local/UAT synthetic profiles do not become PRD measurement or packing authority
- **AND** successful provider tests do not establish measured packing or fiscal acceptance.

#### Scenario: The owner authorizes the same assumed profile for every PRD product

- **GIVEN** the owner authorized the same existing assumed profile for all products and manual offline shipments
- **WHEN** any validated PRD product variant enters checkout, regardless of format
- **THEN** the Worker counts validated cart units under `quantity-band-shipping-no-tax-collected-prd-2026-10-09-v1`, retaining the existing assumed 315 × 315 × 8 mm / 220 g profile as assumed provenance
- **AND** positive/safe quantities, stock, amount and configuration checks still apply
- **AND** 1–4 units cost €3, 5–8 cost €6 and 9 or more cost €10, subject to unchanged cart/per-line/stock guards
- **AND** manual splitting/repacking at BlackBox's cost allows quantities beyond the old nineteen-unit single-parcel capacity
- **AND** older vinyl/no-tax/inclusive references remain allowlisted and accepted hold/order terms are not rewritten
- **AND** new agreements use additive `manual` shipping classification while historical Small/Medium/null values retain their meanings
- **AND** technical packing/cart constraints are not participant, order or time limits, and assumed values are never recorded as measured evidence.

#### Scenario: Quantity crosses a tariff boundary

- **WHEN** total cart quantity changes from four to five or eight to nine
- **THEN** the quote changes from €3 to €6 or €6 to €10 respectively, independent of format, line order or duplicate-line grouping
- **AND** changing cart contents recalculates eligibility before creating checkout.

#### Scenario: An older packing agreement reaches a capacity boundary

- **WHEN** an accepted legacy agreement uses physical parcel selection and exactly meets usable dimensions and gross-weight limits with the required clearance/protection already accounted for
- **THEN** it fits that package
- **AND** exceeding any one limit prevents that package from being selected even if total item volume is small enough.

#### Scenario: Configuration or cart input is invalid

- **WHEN** the selected policy configuration, product identity or cart quantity is missing/invalid
- **THEN** shipping is unavailable and no payable Session is created for that cart
- **AND** the system does not guess disc counts from format labels, invent another tariff or request a later customer top-up.

### Requirement: Accepted shipping prices survive carrier and tariff changes

The system MUST preserve the accepted shopper charge for existing checkout agreements and orders despite different carrier costs or later policy changes.

#### Scenario: Carrier cost differs from the shopper charge

- **WHEN** an accepted island order, packaging choice or manual parcel split costs BlackBox more or less than the accepted fee
- **THEN** the shopper still pays the originally accepted aggregate order charge once
- **AND** no additional payment is demanded after checkout.

#### Scenario: The owner changes the future tariff

- **WHEN** a validated Worker tariff changes for new checkout agreements
- **THEN** the shared public policy and newly created native Stripe shipping option use the new gross amount for the accepted band
- **AND** an existing Session retains its disclosed tier/amount or is explicitly expired before payment
- **AND** finalized orders and applicable refunds use their original monetary snapshot.

#### Scenario: Configuration is missing or a custom amount is used

- **WHEN** the delivery policy is missing, invalid, unexpectedly zero or incompatible with the chosen payment flow
- **THEN** checkout does not silently assume free delivery or infer a tax mode from missing setup
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

#### Scenario: An unusual item requires manual repacking

- **WHEN** physical packing finds a box set, sleeve, protection or sealed carton outside the assumed model
- **THEN** the operator verifies/repackages at BlackBox's cost without a later customer top-up
- **AND** the shared model is not claimed as measured fit or a verified maximum, and no new per-product onboarding/measurement approval gate is introduced.

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
