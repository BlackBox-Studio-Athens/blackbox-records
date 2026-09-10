## ADDED Requirements

### Requirement: Tax and delivery monetary terms are canonical

The system SHALL use VAT Treatment, Delivery Charge, Packing Profile, Order Monetary Snapshot and Fiscal Document consistently in commerce planning, implementation and operational evidence.

#### Scenario: Monetary responsibilities are named

- **WHEN** an artifact describes pricing and fiscal responsibilities
- **THEN** VAT Treatment means the applicable tax handling for the seller and transaction; this change selects ordinary taxable, VAT-inclusive sales and no seller-exemption mode
- **AND** ΑΦΜ means the seller's tax identifier, which alone establishes neither business commencement nor VAT Treatment
- **AND** Delivery Charge means the gross shipping amount charged to the shopper for the complete cart's confirmed Small/Medium parcel tier, distinct from the carrier's cost to BlackBox
- **AND** Packing Profile means measured protected item dimensions/weight or a measured package's usable capacity, sealed outer dimensions, tare and permitted gross weight, used to validate a complete cart
- **AND** Order Monetary Snapshot means immutable verified merchandise, delivery, VAT and total facts for the accepted order
- **AND** Fiscal Document means the legally required receipt, invoice or credit issued through the approved fiscal process, distinct from a Stripe payment receipt or order confirmation
- **AND** delegating calculation, fiscal issuance or filing to Stripe-connected services does not make Stripe the seller or prove remittance to AADE
- **AND** existing StoreCart, CartLine, CartQuantity, Store Offer, Price Authority and Product Projection meanings remain unchanged.
