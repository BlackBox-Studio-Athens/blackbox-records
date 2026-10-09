## ADDED Requirements

### Requirement: Tax and delivery monetary terms are canonical

The system SHALL use VAT Treatment, Delivery Charge, Packing Profile, Order Monetary Snapshot and Fiscal Document consistently in commerce planning, implementation and operational evidence.

#### Scenario: Monetary responsibilities are named

- **WHEN** an artifact describes pricing and fiscal responsibilities
- **THEN** VAT Treatment means actual applicable tax handling; current NO_TAX_COLLECTED records collection behavior only, without establishing exemption, liability or registration, while historical inclusive agreements retain their own treatment
- **AND** ΑΦΜ means the seller's tax identifier, which alone establishes neither business commencement nor VAT Treatment
- **AND** Delivery Charge means one gross order fee based on total validated cart units: €3 for 1–4, €6 for 5–8 or €10 for 9 or more, independent of actual parcel count and distinct from carrier cost; historical agreements retain their original fee
- **AND** Packing Profile means measured or explicitly owner-authorized assumed protected item dimensions/weight or package usable capacity, sealed outer dimensions, tare and permitted gross weight, used to validate a complete cart with a reference that preserves its assumed/measured provenance
- **AND** Order Monetary Snapshot means immutable verified merchandise, delivery, VAT and total facts for the accepted order
- **AND** Fiscal Document means the legally required receipt, invoice or credit issued through the approved fiscal process, distinct from a Stripe payment receipt or order confirmation
- **AND** delegating calculation, fiscal issuance or filing to Stripe-connected services does not make Stripe the seller or prove remittance to AADE
- **AND** existing StoreCart, CartLine, CartQuantity, Store Offer, Price Authority and Product Projection meanings remain unchanged.
