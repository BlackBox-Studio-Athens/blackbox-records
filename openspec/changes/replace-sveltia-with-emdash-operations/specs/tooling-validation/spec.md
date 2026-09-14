## ADDED Requirements

### Requirement: CMS builds and hosted work prevent accidental quota exhaustion

The canonical combined CMS build SHALL reject KV bindings in source and final generated Wrangler configuration. Astro sessions SHALL remain disabled while Access supplies request identity. Hosted bulk work SHALL follow the documented Free-tier operating rule.

#### Scenario: A dependency introduces session storage

- **WHEN** an adapter update injects a KV namespace into the generated artifact
- **THEN** the CMS build fails before deployment
- **AND** the authenticated-request regression continues to reject an Astro session cookie.

#### Scenario: A bulk hosted operation is proposed

- **WHEN** an import, repeated probe, recovery rehearsal, or background job consumes hosted operations
- **THEN** local rehearsal and a bounded pilot establish actual operations including GET side effects
- **AND** current account-wide remaining allowances, retry overhead, and ordinary service headroom are recorded before bulk execution
- **AND** missing usage evidence keeps the work local.

#### Scenario: Quota use exceeds the planned allowance

- **WHEN** a quota alert or unexpected operation count appears
- **THEN** affected bulk work and retries pause for diagnosis and a reduced budget
- **AND** exhausted writes wait for the stated reset and a fresh usage check without upgrading the plan.

#### Scenario: A quota-consuming resource is added intentionally

- **WHEN** a new binding or background job is needed
- **THEN** its purpose, owner, measured Free-tier budget, and exhaustion behavior are documented
- **AND** KV requires an explicit guard/test policy change rather than a runtime bypass.

### Requirement: One normal development command starts the working stack

The documented normal command SHALL start public web, staff, CMS, commerce, local storage, and official Stripe mock behavior without real provider credentials or Docker.

#### Scenario: Maintainer runs pnpm dev

- **WHEN** the command starts on a configured development machine
- **THEN** it runs the same stack as the canonical WebStorm launcher and existing dev:stack:stripe-mock command
- **AND** public web stays at http://127.0.0.1:4321/blackbox-records/ with the backend on its fixed local port
- **AND** occupied required ports fail clearly and child processes stop with the launcher.

#### Scenario: The stack starts a second time

- **WHEN** local CMS and commerce data already exist
- **THEN** startup applies only pending compatible migrations and preserves prior edits and stock
- **AND** explicit fixture reset is separate from ordinary startup.

#### Scenario: Hosted credentials are absent

- **WHEN** normal mock development starts
- **THEN** no real Stripe, email, Cloudflare, GitHub, or CMS account secret is required
- **AND** local identity bypass cannot work outside Local loopback requests.

### Requirement: CMS and runtime catalog acceptance replaces generated-content checks

Validation SHALL cover CMS schema/render parity, protected APIs, migration reconciliation, runtime identity, fixed/custom pricing, stock concurrency, and publication ordering without requiring hosted credentials for normal unit checks.

#### Scenario: Backend is built

- **WHEN** validation inspects its dependency graph and artifact
- **THEN** no generated current catalog or imported public editorial records are required
- **AND** deterministic tests use explicit fixtures rather than live CMS reads.

#### Scenario: UAT migration is accepted

- **WHEN** the integrated stack is exercised
- **THEN** all four routine operations pass: price change, stock change, Release with ten vinyl, and Distro with ten vinyl
- **AND** both fixed and pay-what-you-want paid flows, signed webhook replay, stock reservations, order workspace, and email retries retain their required behavior.

#### Scenario: Publication or setup is interrupted

- **WHEN** focused failure-injection checks retry each external-write boundary
- **THEN** they detect duplicate identities, double opening stock, stale publication, leaked drafts, and accidental price/order resets.

### Requirement: CMS cutover requires recoverability and cost evidence

The exact final tree SHALL pass repository gates and targeted hosted CMS/publication checks, including a restore rehearsal and free-tier resource assessment, before old writable paths are removed.

#### Scenario: Implementation reaches cutover

- **WHEN** unit tests, check, build, boundary checks, and relevant browser/provider suites finish
- **THEN** evidence identifies their exact code revision and tested environment
- **AND** missing account configuration, cost evidence, restore proof, or live authorization is reported as outstanding rather than successful acceptance.

### Requirement: Runtime catalog validation preserves import provenance

Migration and targeted catalog checks SHALL retain reviewed source matching, artwork evidence, supported price-kind policy, and rejected-duplicate handling without requiring the original distro manifest for future items.

#### Scenario: Imported distro rows are checked

- **WHEN** the old inventory source is converted into runtime records
- **THEN** canonical rows, aliases, approved extras, and rejected duplicates reconcile exactly
- **AND** new post-cutover items are validated directly rather than added to the retired manifest.

## REMOVED Requirements

### Requirement: Commerce validation MUST cover generated UAT catalog artifacts

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Sandbox UAT proof MUST follow reset, seed, apply, and smoke sequence

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Catalog promotion validation is deterministic and fail-closed

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Distro source and projections are validated together

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Distro catalog acceptance includes UAT provider proof

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Generated Sveltia configuration is structurally validated

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Sveltia collection contracts have focused parity checks

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Sveltia previews and media paths are tested together

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Local and rendered Sveltia validation uses the native repository flow

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: UAT Static Smoke verifies hosted Sveltia safety

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.

### Requirement: Sveltia migration passes repository gates

**Reason**: The generated-catalog and Sveltia workflows are replaced by runtime catalog, EmDash, and independent Content Publication.

**Migration**: Retain the substantive identity, media, payment, safety, and hosted-proof coverage in the replacement validation requirements. Remove obsolete commands and assertions only after replacement coverage passes.
