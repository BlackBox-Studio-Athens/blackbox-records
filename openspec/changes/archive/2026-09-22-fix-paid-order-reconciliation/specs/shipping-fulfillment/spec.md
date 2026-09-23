## ADDED Requirements

### Requirement: Collected shipping details own fulfillment identity

The system MUST derive the shipment recipient and delivery address from verified Checkout shipping details, keep shopper contact separate, and never substitute billing details for missing shipping details.

#### Scenario: Billing and shipping differ

- **WHEN** a verified paid Session contains a Greek shipping address and recipient different from the buyer's billing details
- **THEN** the persisted fulfillment and operator delivery use the shipping recipient and address
- **AND** billing country does not reject an otherwise valid Greek shipment
- **AND** buyer email and optional phone remain shopper contact.

#### Scenario: Shipping data is incomplete or unsupported

- **WHEN** verified shipping lacks required recipient/address fields or its country is not `GR`
- **THEN** the order does not become ready for normal fulfillment
- **AND** billing details are not used as a fallback
- **AND** reconciliation preserves a durable review outcome or remains retryable until that outcome can be recorded.

#### Scenario: Fulfillment is replayed

- **WHEN** the same paid Session is delivered again
- **THEN** previously committed paid fulfillment facts remain immutable
- **AND** no raw billing or provider payload is added to public checkout responses or order storage.
