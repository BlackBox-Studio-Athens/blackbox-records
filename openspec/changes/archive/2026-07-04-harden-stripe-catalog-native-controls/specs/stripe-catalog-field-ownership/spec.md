## ADDED Requirements

### Requirement: Stripe native identity fields are owned by the application

The system SHALL identify BlackBox-owned Stripe catalog objects through application-owned Stripe lookup keys and metadata.

#### Scenario: Catalog Product and Price are created

- **GIVEN** catalog apply creates a Stripe Product and Price for a Store Item variant
- **WHEN** the Stripe objects are sent to Stripe
- **THEN** the Price uses the deterministic lookup key `blackbox:{environment}:{storeItemSlug}:{variantId}`
- **AND** Product and Price metadata include `appEnv`, `sourceId`, `sourceKind`, `storeItemSlug`, and `variantId`.

#### Scenario: Product ID strategy is evaluated

- **GIVEN** the implementation considers deterministic Stripe Product IDs
- **WHEN** existing active Products already use Stripe-generated IDs
- **THEN** Product ID is not treated as the sole source of identity
- **AND** any deterministic Product ID adoption is limited to fresh create or full recreate flows with lookup key and metadata still present.

#### Scenario: Dashboard identity edit creates drift

- **GIVEN** a Stripe Dashboard user removes or changes lookup key or app identity metadata on a BlackBox-owned Product or Price
- **WHEN** catalog reconciliation or verification runs
- **THEN** the object is reported as identity drift or ignored as untrusted if ownership cannot be proven
- **AND** the Dashboard value is not imported into repo content or trusted browser state.

### Requirement: Stripe identity is environment-scoped

The system MUST prevent UAT, PRD, and Local catalog identities from being accepted across Product Environments.

#### Scenario: UAT verifier sees sandbox legacy identity

- **GIVEN** Stripe contains an object identified as `blackbox:sandbox:*`
- **WHEN** UAT verification expects `blackbox:uat:*`
- **THEN** the object is reported as legacy or foreign identity
- **AND** it is not accepted as the active UAT Store Offer.

#### Scenario: PRD identity appears in UAT

- **GIVEN** a Stripe object identifies `appEnv=prd` or uses a `blackbox:prd:*` lookup key
- **WHEN** UAT verification or reconciliation inspects it
- **THEN** the object is treated as foreign-environment drift
- **AND** UAT D1 mappings and Store Offer snapshots are not updated from that object.
