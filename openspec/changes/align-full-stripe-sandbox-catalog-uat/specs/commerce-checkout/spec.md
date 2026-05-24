## MODIFIED Requirements

### Requirement: Browser checkout state MUST remain non-authoritative

Static Astro pages and browser state MUST NOT expose Stripe Price IDs, Stripe secrets, D1 IDs, stock authority, paid order state, or authoritative item prices. They MAY show current Store Items as available with Worker-confirmed checkout copy when the Worker remains responsible for Store Offer reads and checkout creation.

#### Scenario: Static availability remains browser-safe

- **GIVEN** a current Store Item is rendered on the static UAT storefront
- **WHEN** the page displays purchase availability
- **THEN** it may show the item as available and "Worker-confirmed at checkout"
- **AND** it does not include a Stripe Price ID, D1 ID, stock count, secret, or authoritative amount.
