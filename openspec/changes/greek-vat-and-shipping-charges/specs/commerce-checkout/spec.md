## ADDED Requirements

### Requirement: Consumer prices disclose VAT and delivery

The storefront MUST preserve advertised gross EUR item prices and disclose the accepted collection mode and Delivery Charge before payment. Current NO_TAX_COLLECTED agreements MUST NOT claim included VAT, exemption or a 0% rate. Historical inclusive agreements retain their treatment; VAT MUST NOT be added twice. Store and checkout MUST link to current delivery terms and show the final payable amount before commitment.

#### Scenario: Fixed-price cart is reviewed

- **WHEN** a shopper views a priced Store Item, cart or checkout summary
- **THEN** VAT wording agrees with the approved seller treatment
- **AND** listing/detail wording is price-neutral for current no-collection agreements, with collection disclosure and shipping calculated in the cart
- **AND** the summary distinguishes merchandise subtotal, one aggregate BOX NOW Delivery Charge and gross total
- **AND** the shared policy discloses €3 for 1–4 validated cart units, €6 for 5–8 and €10 for 9 or more before hosted Checkout; actual manual parcel count does not alter this fee
- **AND** any included VAT breakdown is informational rather than added again.

#### Scenario: Amount is not final yet

- **WHEN** pricing is stale, unavailable or chosen later in hosted Checkout
- **THEN** the UI identifies the limitation and does not label a preset, minimum or local draft amount as the final payable total
- **AND** unknown delivery or tax is not displayed as zero
- **AND** the final hosted payment screen supplies the complete accepted amount before payment.

### Requirement: Monetary authority stays outside the browser

The system MUST derive tax treatment, customer delivery policy and payment amounts from trusted backend/provider state. StoreCart remains convenience state, and StartCheckout MUST NOT accept browser-authored tax amounts, rates, shipping amounts or provider rate identifiers as authority.

#### Scenario: Shopper modifies browser state

- **WHEN** local cart data or submitted tax/shipping fields are tampered with
- **THEN** the Worker rejects unsupported fields and revalidates item identities, quantities and approved policy
- **AND** browser values cannot reduce the amount collected.

#### Scenario: Tax setup is missing

- **WHEN** the provider cannot establish the selected taxable treatment
- **THEN** the affected payable flow is unavailable until setup is corrected
- **AND** the UI does not infer an exemption or replace the included-VAT disclosure with a zero-tax claim.

#### Scenario: Store presentation is hydrated

- **WHEN** a Store section activates
- **THEN** public VAT/delivery information reuses shared browser-safe responses and the existing listing-price projection
- **AND** no per-card offer/tax request or private provider/registration field is introduced.

#### Scenario: Confirmation is shown

- **WHEN** the shopper receives a confirmation or views a checkout return
- **THEN** displayed monetary facts agree with the verified order snapshot where exposed
- **AND** the copy distinguishes order/payment confirmation from the approved Fiscal Document process without exposing protected fiscal or personal records.
