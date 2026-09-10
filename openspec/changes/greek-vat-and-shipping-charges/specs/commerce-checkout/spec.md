## ADDED Requirements

### Requirement: Consumer prices disclose VAT and delivery

The storefront MUST present existing consumer item prices as final VAT-inclusive EUR amounts under the selected taxable VAT Treatment and make delivery terms accessible from Store and checkout. It MUST NOT add VAT on top of the advertised gross price. The final payable amount, including delivery and applicable VAT, MUST be visible before the payment commitment.

#### Scenario: Fixed-price cart is reviewed

- **WHEN** a shopper views a priced Store Item, cart or checkout summary
- **THEN** VAT wording agrees with the approved seller treatment
- **AND** listing/detail wording clearly says VAT is included and shipping is calculated in the cart, with both rates accessible in delivery terms
- **AND** the summary distinguishes merchandise subtotal, the applicable €2.50 Small or €3.50 Medium BOX NOW Delivery Charge, and the gross total
- **AND** both rates are available in delivery terms, while the cart's validated tier/charge comes from the shared current policy and appears before leaving BlackBox for hosted Checkout
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
