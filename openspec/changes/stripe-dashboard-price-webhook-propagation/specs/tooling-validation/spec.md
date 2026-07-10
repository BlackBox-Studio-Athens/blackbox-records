## ADDED Requirements

### Requirement: Price-change propagation has operator proof

The system SHALL provide repeatable operator checks that prove a Stripe Dashboard price change propagated to the backend and storefront.

#### Scenario: Operator verifies webhook configuration

- **WHEN** an operator runs webhook verification for UAT
- **THEN** it verifies the persistent Stripe endpoint URL, enabled catalog event coverage, test-mode status, and Worker secret presence without printing secrets
- **AND** it requires `price.created`, `price.updated`, `price.deleted`, `product.created`, `product.updated`, and `product.deleted` coverage.

#### Scenario: Operator verifies catalog after price change

- **GIVEN** a Stripe Dashboard price change was made for a Store Item variant
- **WHEN** `pnpm stripe:catalog:verify --env uat` runs
- **THEN** the report identifies whether Product Projection, Price Authority, D1 mapping, and Store Offer snapshot are aligned
- **AND** the report is mutation-free unless an explicit apply flag is supplied.

#### Scenario: Operator reads public Store Offer

- **GIVEN** catalog verification reports the replacement Price as current
- **WHEN** the operator reads the public Store Offer endpoint for the item
- **THEN** the browser-safe response shows the updated display price and checkout readiness
- **AND** it omits provider IDs, D1 IDs, secrets, and internal stack traces.

### Requirement: Price-change runbook is documented

The system MUST document the supported Stripe Dashboard price-change workflow for non-developer operators.

#### Scenario: Colleague receives price-change instructions

- **WHEN** a colleague needs to update a buyable item price
- **THEN** the runbook tells them to use Stripe Dashboard, open the existing app-owned Product, add the replacement EUR Price, make it the default, archive the stale active Price, and request UAT proof
- **AND** it does not ask them to copy metadata, lookup keys, Stripe IDs, D1 IDs, or repository identifiers
- **AND** it states that Decap edits item information only, not checkout price.

#### Scenario: Existing Stripe account access is used

- **WHEN** the colleague performs the UAT price-change exercise using the same existing Stripe business account and UAT Sandbox as the owner
- **THEN** the runbook does not require a separate restricted-role proof or a second Stripe account
- **AND** it requires Sandbox/test-mode confirmation, two-step authentication, and confirmation that the existing Product is the intended Store Item before adding the Price.

#### Scenario: Replacement Price identity fields are empty

- **GIVEN** a replacement Price was created under the correct app-identified Product without Price metadata or a lookup key
- **WHEN** only that replacement Price remains active and reconciliation runs
- **THEN** the system repairs Price metadata and the canonical lookup key automatically
- **AND** the runbook does not send the colleague into Stripe advanced metadata fields.

#### Scenario: Existing Product identity is missing or wrong

- **GIVEN** the selected Product lacks complete app identity or identifies another Store Item variant
- **WHEN** the colleague cannot safely confirm the Product
- **THEN** the runbook tells them to stop and request catalog-owner repair
- **AND** it does not ask them to invent or copy identity values.

#### Scenario: Multiple active prices are found

- **GIVEN** verification reports ambiguous active Prices
- **WHEN** the operator follows troubleshooting
- **THEN** the runbook tells them to archive or deactivate stale matching Prices
- **AND** it tells them to rerun verification before accepting checkout readiness.

### Requirement: Price propagation validation is covered by automated tests

The system MUST include focused tests for the Stripe Dashboard price-change propagation path.

#### Scenario: Reconciler tests replacement Prices

- **WHEN** application catalog-sync tests run
- **THEN** they cover replacement Price selection, stale mapping update, snapshot update, wrong identity, wrong currency, and ambiguous active Price failure.

#### Scenario: Webhook tests catalog event processing

- **WHEN** webhook acknowledgement or route tests run
- **THEN** they cover signed catalog event handling, duplicate succeeded event handling, failed-attempt retry behavior, missing or malformed variant identity, Product Environment mismatch, current-state reconciliation, redacted logging, and retryable reconciliation failure.

#### Scenario: Storefront and checkout tests use Worker authority

- **WHEN** Store Offer and checkout tests run
- **THEN** they prove storefront display and checkout start consume current Worker/Stripe/D1 authority rather than static Astro or browser price snapshots.

### Requirement: Price-change evidence stays redacted

The system MUST keep all price-change diagnostics and evidence safe for logs, CI artifacts, and handoff summaries.

#### Scenario: Verification output includes provider context

- **WHEN** verification output mentions Stripe Products, Prices, webhook endpoints, checkout sessions, or API errors
- **THEN** it redacts full object IDs and secrets
- **AND** it preserves enough safe context to identify the affected Product Environment, `storeItemSlug`, `variantId`, issue code, and operator action.

#### Scenario: Webhook logs catalog propagation

- **WHEN** a catalog webhook is processed
- **THEN** logs include safe fields such as Product Environment, event type, outcome, retryable status, safe reason, `storeItemSlug` when available, and `variantId` when available
- **AND** logs do not include raw webhook bodies, full Stripe object IDs, or signing secrets.

### Requirement: PRD validation remains gated

The system MUST keep live PRD price propagation disabled or readiness-only until the approved PRD-open gate exists.

#### Scenario: PRD is not open

- **GIVEN** `PRD_OPEN_GATE` is not configured as open
- **WHEN** price-change propagation tooling is run for PRD
- **THEN** it reports disabled, not configured, or readiness-only status
- **AND** it does not mutate Stripe live mode, PRD D1, or live checkout state.

#### Scenario: PRD catalog webhook arrives before open gate

- **GIVEN** `PRD_OPEN_GATE` is not configured as open
- **WHEN** the PRD Worker receives a signed Stripe catalog webhook
- **THEN** the runtime path may verify the signature and record safe readiness diagnostics
- **AND** it does not mutate PRD D1 Store Offer snapshots, PRD VariantStripeMapping, Stripe live mode, or live checkout readiness.

#### Scenario: PRD opens later

- **GIVEN** the production-readiness gate approves live checkout and live provider mutation
- **WHEN** PRD price propagation validation is enabled
- **THEN** it uses PRD Worker, PRD D1, PRD Stripe live account state, and PRD webhook secrets
- **AND** UAT evidence cannot be reused as PRD acceptance.
