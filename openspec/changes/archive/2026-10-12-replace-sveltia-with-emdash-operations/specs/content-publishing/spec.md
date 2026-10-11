## Purpose

Publish editorial content independently of application code while keeping drafts private, deployments consistent, and live commerce independent of static builds.

## ADDED Requirements

### Requirement: Content publication does not release software

Content Publication SHALL publish a consistent content revision using the target environment's currently deployed approved code revision. It SHALL NOT create Git commits, deploy backend code, promote a UAT candidate, or require a developer to edit catalog files.

#### Scenario: Member publishes a post while a UI change is in UAT

- **WHEN** the member publishes PRD News
- **THEN** the PRD site updates using PRD's currently approved code
- **AND** the unpromoted UI change stays in UAT.

#### Scenario: Member changes price or stock

- **WHEN** an authorized price or stock operation succeeds
- **THEN** the runtime Store Offer or stock state updates without content publication, a static build, or a Worker deployment.

### Requirement: Publication uses a complete immutable snapshot

A public build SHALL consume one validated published-content snapshot and its referenced media. It SHALL NOT mix revisions, include drafts, or silently fall back to stale repository content when loading the snapshot fails.

#### Scenario: Another editor saves during a build

- **WHEN** a publication build is already using a captured revision
- **THEN** it finishes against that revision without including the later save
- **AND** the later published revision can be processed separately.

#### Scenario: Snapshot export or validation fails

- **WHEN** content, references, or required media cannot be validated
- **THEN** the new static artifact is not deployed
- **AND** the previous public site remains available with a visible failure status for staff.

#### Scenario: Published distro has no commerce setup yet

- **WHEN** a published Distro source is absent from the runtime catalog
- **THEN** the snapshot retains its canonical source-slug display entry so existing storefront content stays browsable
- **AND** an existing bound identity takes precedence; this display projection creates no D1 item, Product, Price, stock or checkout eligibility.

### Requirement: Publish status distinguishes requested from live

The workspace SHALL distinguish saved draft, publication pending, live, and failed publication. A publish request SHALL be durable and safely retryable without requiring the browser to remain open.

#### Scenario: Dispatch fails or the browser closes

- **WHEN** a valid publication request cannot reach deployment automation
- **THEN** its pending state remains visible and the same request can be retried
- **AND** the UI does not claim that the page is live.

#### Scenario: Deployment succeeds but acknowledgement is lost

- **WHEN** the system retries or reconciles the publication
- **THEN** it verifies the actual deployment and revision before marking it live
- **AND** duplicate notifications do not republish an older revision.

### Requirement: Content and software deployments share target ordering

Content Publication and Software Release promotion SHALL serialize target mutation and verify deployed code and content preconditions. Neither path SHALL overwrite a newer accepted publication with an older artifact.

#### Scenario: Content changes after a code candidate was built

- **WHEN** a PRD candidate artifact contains an older content revision
- **THEN** promotion stops and refreshes the candidate's PRD-targeted artifact against current PRD content, retaining the same approved code SHA
- **AND** the refreshed artifact passes content, build, compatibility, and target checks before explicit promotion.

#### Scenario: Code is promoted while a publication waits

- **WHEN** the publication reaches its deployment step
- **THEN** it checks the target's deployed code revision again
- **AND** it rebuilds with that approved revision or stops for a safe retry instead of downgrading code.

### Requirement: Environment publication never copies operational data

UAT and PRD SHALL own separate content and publication state. Software promotion SHALL NOT copy UAT content, customer data, stock, orders, provider identifiers, or secrets into PRD.

#### Scenario: A UI candidate is reviewed

- **WHEN** UAT requires representative content
- **THEN** it uses UAT fixtures or an explicit editorial-only sanitized import
- **AND** promoting the code leaves PRD content and operational records intact.

### Requirement: Publication preserves safe storefront behavior

New Store Items SHALL remain unavailable for checkout until their setup and public publication are confirmed. Hiding or archiving an item SHALL preserve its operational history and prevent new checkout independently of static deployment success.

#### Scenario: First item publication fails

- **WHEN** its setup is ready but the public build fails
- **THEN** the item remains unpublished and cannot start checkout through a guessed identity
- **AND** retrying publication does not create more stock or provider objects.

#### Scenario: An item is unpublished

- **WHEN** an authorized member confirms the action
- **THEN** new checkout is paused before public removal
- **AND** existing reservations, paid orders, return pages, and fulfillment remain processable.

#### Scenario: New content is live

- **WHEN** a fresh page load follows a confirmed publication
- **THEN** pages, metadata, sitemap, search data, and overlay fragments use that revision
- **AND** existing music playback is not forcibly reloaded to update an already-open tab.
