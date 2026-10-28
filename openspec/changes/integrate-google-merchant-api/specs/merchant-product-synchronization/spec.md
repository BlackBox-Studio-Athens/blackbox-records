# Merchant product synchronization

## Purpose

Keep Google Merchant Center product data aligned with the publicly available BlackBox store catalog and commerce state.

## ADDED Requirements

### Requirement: Only accepted public offers are sent

The system SHALL submit only eligible accepted Store Items and authoritative public offer facts to the configured Merchant API source, for Greece.

#### Scenario: A draft is not published

- **WHEN** an editorial draft exists without accepted publication
- **THEN** its private content is never submitted to Google.

#### Scenario: Public commerce state is uncertain

- **WHEN** price, stock, identity or accepted content cannot be verified
- **THEN** the synchronization does not invent or publish a buyable offer.

### Requirement: Product changes are reconciled

The system SHALL reconcile submitted products with current accepted offers, including changes, unavailable items and removals, and refresh products before provider expiration.

#### Scenario: Stock or price changes

- **WHEN** a synchronized offer changes
- **THEN** Google receives the current authoritative values through a retryable synchronization.

#### Scenario: A product is withdrawn

- **WHEN** a previously synchronized item is no longer eligible
- **THEN** its managed product input is removed from the configured data source after verified ineligibility.

#### Scenario: An offer becomes eligible again

- **WHEN** a removed offer is again verified eligible
- **THEN** it is reinserted with the same stable variant identity.

### Requirement: Pre-orders are excluded

The system MUST exclude pre-orders and backorders from the initial Merchant integration.

#### Scenario: A delayed offer is buyable on the website

- **WHEN** an accepted offer is a pre-order or backorder
- **THEN** it is not submitted by the integration, even when checkout permits purchase.

#### Scenario: An exact pre-order date passes

- **WHEN** the shopper-facing pre-order ends because its date has arrived but the stored stock pre-order has not been explicitly cleared
- **THEN** Merchant synchronization continues to exclude the offer, without changing checkout behavior or clearing stock state.

#### Scenario: Copies arrive and the operator clears the pre-order

- **WHEN** the existing stock operation explicitly clears the stored pre-order after arrival confirmation
- **THEN** the next scan may submit the offer only if all accepted-content, price and effective-stock checks also pass.

### Requirement: Manufacturer identifiers are not invented

The system MUST keep stable Merchant offer identity separate from GTIN, MPN and brand. It SHALL omit unverified or unavailable identifier attributes and initially omit `identifierExists`; absence of local identifier fields SHALL NOT imply that identifiers were never assigned. It SHALL NOT require a separately maintained Merchant catalog or new identifier editor for the initial integration.

#### Scenario: A product lacks typed identifier data

- **WHEN** an otherwise verified in-stock offer has no verified manufacturer identifier available
- **THEN** its input omits those identifier attributes without substituting its variant ID, catalog number or artist name, and Google serving eligibility remains subject to provider diagnostics.

#### Scenario: Product condition is unverified

- **WHEN** current stock establishes buyability but does not establish product condition
- **THEN** the mapper does not infer NEW from stock, and condition requirements must be verified before accepting the product into the pilot.

### Requirement: Reconciliation uses a bounded rotating scan

The system SHALL process at most five candidate identities per fifteen-minute UTC clock slot using the existing schedule, including previously managed identities needed for removal. It SHALL send changed verified inputs and refresh unchanged eligible inputs after seven days since successful submission. It SHALL NOT add event hooks, a change detector or automatic provider-status polling.

#### Scenario: Scheduled work starts with different delays

- **WHEN** paid-order delivery or scheduler jitter delays successive Merchant invocations by different amounts
- **THEN** at most one run is claimed in each current UTC fifteen-minute clock slot, without replaying missed slots, while active real-time leases and quota cooldowns still block claims.

#### Scenario: An eligible offer is unchanged

- **WHEN** its verified payload matches the last successfully submitted payload and its refresh is not due
- **THEN** no product mutation is sent to Google.

#### Scenario: A read fails during a scan

- **WHEN** a source or provider read fails or accepted inventory completeness cannot be verified
- **THEN** uncertainty does not cause removal or refresh of unverified facts, immediate provider retry loops are avoided, and pending work remains eligible for a later scan without blocking other candidates.

### Requirement: Failures do not affect checkout

The synchronization SHALL operate independently of checkout and provide safe, actionable failure information without exposing credentials or private data.

#### Scenario: Checkout flag evaluation is uncertain

- **WHEN** the checkout flag provider throws or returns evaluation error details
- **THEN** Merchant preserves managed offers without upserting or removing them, while ordinary shopper checkout retains its existing fallback behavior.

#### Scenario: Google is unavailable

- **WHEN** authentication or a provider request fails
- **THEN** checkout and publication remain available and the failure can be retried and diagnosed.

### Requirement: Activation is environment isolated

The integration MUST be disabled by default, use environment-specific credentials and data sources, and keep test data out of the production Merchant Center source.

#### Scenario: UAT is enabled for provider testing

- **WHEN** UAT submits product inputs
- **THEN** it uses a genuine Google test account with its own source and credential, whose identity has no access to the production Merchant account.

#### Scenario: Production is not explicitly enabled

- **WHEN** production activation is absent
- **THEN** no production Google product mutations occur.
