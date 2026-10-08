## Purpose

Define the fail-closed evidence, data, provider, approval, cutover, and rollback gates required to launch native commerce on the public production origin.

## ADDED Requirements

### Requirement: Production launch gates

The system MUST block PRD native-commerce activation until required technical prerequisite acceptance is complete and live payment, domain, webhook, Worker, D1, emergency-disable, rollback and sole-approver evidence identifies the accepted launch code and content. The 2026-10-08 requested scope is unrestricted selling with no participant/order cap or end date. Declared Tax/fiscal deferrals and assumed packing MUST remain honest unresolved evidence, not successful compliance or measurement. The authorized bounded live smoke precedes public cutover; archive paperwork alone is not an additional runtime gate.

#### Scenario: Launch is requested

- **GIVEN** new-account Stripe test-mode evidence exists
- **WHEN** PRD launch is considered
- **THEN** live Stripe credentials, live Products/Prices, Payment Method Configuration, production webhook endpoint, production Worker/D1 configuration, paid-delivery schedule, and final origin evidence are verified first
- **AND** `PRD_LAUNCH_APPROVED` remains absent until the user gives explicit final approval
- **AND** `native_checkout_enabled` remains an independent runtime control.

#### Scenario: Prerequisite implementation evidence is reviewed

- **WHEN** the final launch checklist is assembled
- **THEN** environment alignment, production controls, EmDash and accepted-snapshot publication, listing-price stabilization, Holding Page handoff, operator JWT verification, checkout stock reservations and paid-order delivery have accepted evidence with historical account/commit limits preserved
- **AND** evidence includes Access allow/deny proof, one-unit checkout concurrency and replay safety, immediate and scheduled delivery recovery, and the verified Holding Page rollback target
- **AND** checkout creation and paid-order reconciliation/return corrections have local regression and new-account acceptance evidence
- **AND** atomic operator-stock correction has local D1/browser evidence and protected PRD acceptance after migration and matching Worker/staff deployment with checkout closed
- **AND** no required technical launch acceptance remains unresolved; explicitly deferred Tax/fiscal evidence stays open, while unrelated optional features and completed-but-unarchived paperwork do not create additional launch gates.

#### Scenario: Shipping scope is reviewed

- **WHEN** checkout and fulfillment configuration are evaluated for launch
- **THEN** `GR` is the complete supported delivery-country set
- **AND** non-Greece delivery is rejected before payment or normal fulfillment
- **AND** no non-Greece provider, quote, or fallback path is configured.

### Requirement: Requested selling scope preserves controls and receipts

The system MUST follow the owner's 2026-10-08 unrestricted selling scope after technical readiness without adding cohort, order-limit or end-date restrictions. It MUST retain the independent launch/runtime controls, immediate checkout stop and ordinary Stripe payment/refund receipts. Availability-alert sends MUST stay suppressed while PRD checkout is closed. The owner-accepted Tax evidence and fiscal-provider/myDATA/credit/filing deferrals apply to this uncapped scope and MUST remain unresolved evidence, without a legal exemption or successful fiscal-acceptance claim.

#### Scenario: A customer pays in the approved scope

- **GIVEN** the supplied seller/account inputs, technical acceptance and final user activation decision are recorded
- **WHEN** an eligible customer completes a real payment
- **THEN** normal provider calculation, authorized assumed-profile shipping, stock, order and delivery checks apply, and the configured Stripe payment receipt uses accurate seller/contact and transaction details
- **AND** the authorized smoke proves payment and refund receipt delivery to an approved recipient; sandbox manual receipts alone do not prove live automatic delivery
- **AND** paid invoice creation and fiscal connectors are not prerequisites for ordinary payment receipts
- **AND** purchase returns, policies and customer-email links reach the accepted PRD site, with the apex held until approved cutover.

#### Scenario: Checkout is stopped during preparation or an incident

- **WHEN** preparation or incident handling closes an existing checkout control
- **THEN** new checkout is rejected while existing paid orders and refunds remain recoverable
- **AND** the public apex remains on or returns to Holding Page when routing rollback is required.

#### Scenario: Future sales move to the later official account

- **WHEN** future sales move to the owner's official account
- **THEN** the switch uses refreshed inventory, source-session drain and verified target configuration
- **AND** earlier orders retain their original account, seller and monetary history, with access and funding for old-account refunds/disputes
- **AND** the later switch is follow-up work, and payment success alone does not mark fiscal work complete.

#### Scenario: Availability alerts are due before public selling

- **GIVEN** PRD checkout is closed
- **WHEN** scheduled delivery runs with due availability alerts
- **THEN** availability-alert sending is suppressed and pending requests retain their existing retention policy
- **AND** paid-order delivery and estimate notices continue normally
- **AND** availability alerts resume only for approved public selling.

### Requirement: Exact launch tree

The system MUST associate launch code artifacts, configuration, validation, approval and cutover with one exact accepted commit SHA and MUST separately identify the accepted PRD content snapshot and runtime catalog evidence.

#### Scenario: Exact-tree evidence is accepted

- **WHEN** build, Worker, catalog, migration, test, performance, browser, and provider evidence is recorded
- **THEN** final launch checks identify the accepted artifact commit SHA and relevant environment configuration/deployment
- **AND** historical prerequisite results retain their original source references
- **AND** technical PRD code deployment follows explicit Software Release promotion of the accepted UAT candidate SHA/run and its verified PRD-targeted artifacts, independently of live-catalog and shopper-launch authorization
- **AND** a later source, generated-artifact, or configuration change reruns affected checks; evidence notes or archival alone do not invalidate unchanged runtime proof.

#### Scenario: Code is promoted during approved selling

- **GIVEN** shopper checkout has been approved and enabled
- **WHEN** an accepted software release is promoted
- **THEN** candidate provenance and release-order checks still apply without requiring checkout to be disabled
- **AND** code promotion preserves the independent checkout controls and does not authorize catalog mutation or activation.

#### Scenario: Content changes independently of code

- **WHEN** a selected CMS revision is published after code acceptance
- **THEN** launch evidence records the new accepted PRD snapshot identity and rechecks affected public surfaces
- **AND** code SHA alone is not proof of approved content, and UAT content is not substituted for PRD content.

### Requirement: Destination Stripe provider sequence

The system MUST accept the migration's designated-sandbox UAT behavior before live-mode preparation and MUST keep shopper checkout closed throughout live preparation. Independent account/tooling and Store performance work MAY proceed in parallel; each retains its required launch acceptance.

#### Scenario: New Stripe account test mode is prepared

- **WHEN** account access, approved test credentials, and approved delivery recipients exist
- **THEN** listing-price replacement behavior is proved first
- **AND** checkout reservation creation, settlement, expiry, replay safety, and one-unit concurrency are proved next
- **AND** paid-order delivery and recovery are accepted after reservation proof, with shared scenarios reused where applicable
- **AND** existing archives remain closed while missing or affected designated-account acceptance is recorded in this launch plan without duplicate purchases for paperwork.

#### Scenario: Review corrections are accepted

- **WHEN** reservation and paid-order provider evidence is collected
- **THEN** all three correction changes are implemented on that tree
- **AND** existing checkout-creation, atomic-stock, reservation and outbox archives retain their recorded evidence and limitations
- **AND** the archived paid-reconciliation correction retains its unresolved designated-account limits, with remaining proof accepted through the shared migration/launch checks rather than a second archive cycle
- **AND** overlapping tasks reference the same accepted evidence without requiring duplicate purchases or unchanged test reruns
- **AND** a local mock or failure-reproduction probe never substitutes for new-account provider proof.

#### Scenario: PRD-only operator correction is accepted

- **GIVEN** the staff portal is PRD-only and no UAT staff portal exists
- **WHEN** atomic operator-stock correction is locally validated
- **THEN** real local D1 race/rollback tests, native local browser flows, and repository gates permit correction archival
- **AND** launch still requires protected PRD Access allow/deny, approved real-stock adjustment/recount, stale-conflict retained input, explicit reassessment, and matching audit proof with checkout closed
- **AND** local archival authorizes neither PRD mutation nor shopper launch and requires no synthetic production sales or stock.

#### Scenario: Production delivery recovery is prepared

- **WHEN** PRD delivery readiness is evaluated with shopper checkout closed
- **THEN** the deployed PRD schedule matches the current committed five-minute cadence and forwards through CommerceRuntime to the existing bounded delivery processor
- **AND** an observed invocation proves the correct environment bindings
- **AND** the same bounded handler has controlled transient-failure recovery evidence from UAT
- **AND** the check creates no synthetic paid production order or unapproved email.
- **AND** measured operation budgets remain within the documented Cloudflare Free-tier policy without a second scheduler or KV binding.

#### Scenario: Live provider resources are prepared

- **GIVEN** `PRD_LAUNCH_APPROVED` is absent
- **AND** `native_checkout_enabled=false`
- **WHEN** live Products/Prices, Payment Method Configuration, webhook, PRD D1, Worker bindings, Cron, email, and catalog mappings are prepared
- **THEN** PRD catalog mutation requires one-run live-catalog confirmation
- **AND** Store capabilities report checkout disabled
- **AND** checkout creation rejects before provider work.

### Requirement: Manual selling operations are accepted before launch

The system MUST verify the owner-approved manual fulfillment/refund procedure, shipping-charge model, supported assumed-profile cart behavior, provider calculations and ordinary receipts against the actual checkout experience before activation. The necessary operating owner is supplied by private attestation. Actual Tax evidence and fiscal automation remain explicitly deferred for the requested uncapped scope, without claiming completed fiscal issuance or filing.

#### Scenario: Manual handoff is rehearsed

- **WHEN** the new-account test purchase is reviewed for launch acceptance
- **THEN** assigned operators can find paid orders, review exceptions, and failed deliveries
- **AND** the runbook covers Greek BOX NOW destination/shipment handling, dispatch recording that prevents duplicate fulfillment, manual refunds, and explicit returned-stock reconciliation
- **AND** test evidence distinguishes a runbook rehearsal from an actual physical shipment.

#### Scenario: Checkout charges and receipts are reviewed

- **WHEN** the owner selects included delivery or a separate shipping charge and the intended tax/receipt/invoice workflow
- **THEN** the configured checkout total and shopper-visible claims match that approved model and identify deferred fiscal issuance honestly
- **AND** required monetary implementation and acceptance finish before launch
- **AND** absent provider options or Dashboard defaults are not treated as proof of the advertised behavior.

### Requirement: Shopper selling information is available before launch

The system MUST provide accessible, owner-approved shipping timing/rates, return/refund instructions, customer contact, and privacy information before opening checkout.

#### Scenario: Shopper reviews purchase conditions

- **WHEN** a shopper uses Store and checkout on the accepted launch artifact
- **THEN** the relevant information is reachable through accessible storefront links
- **AND** it agrees with the configured Greek delivery scope, charges, contact channels, and manual operations
- **AND** missing business or policy decisions remain launch blockers rather than invented text.

### Requirement: Release data promotion boundary

The system MUST use PRD's own accepted immutable CMS snapshot and runtime D1 catalog as its launch data path, with explicit Items/provider ownership of live prices, and MUST NOT copy UAT runtime/provider state into PRD. Routine release MUST NOT seed stock or restore retired repository catalog authority.

#### Scenario: UAT-prepared content is selected for launch

- **GIVEN** colleagues have reviewed editorial content and code in UAT
- **WHEN** the corresponding PRD launch is prepared
- **THEN** PRD's reviewed revisions are published through its own Content/Items workflow and its accepted snapshot is verified independently of the UAT snapshot
- **AND** code promotion rebuilds PRD renderer/CMS/Pages artifacts from the SHA of UAT's successful push run while preserving the PRD content pointer
- **AND** approved launch Store Items have explicit PRD target policy, live price authority, first-publication stock readiness, PRD D1 readiness rows, and live provider ownership evidence
- **AND** UAT D1 rows, Stripe test-mode Products/Prices, synthetic stock quantities, and UAT smoke evidence are not copied or treated as PRD launch data
- **AND** PRD catalog assets use PRD asset URLs instead of UAT asset URLs.

### Requirement: Canonical production cutover

The system MUST prepare and verify every final public-origin dependency in the accepted full-site artifact before approval, then expose that artifact at the apex only after the approved live smoke succeeds.

#### Scenario: Public apex is cut over

- **GIVEN** the exact launch tree has approval and a successful bounded live checkout smoke
- **WHEN** the apex moves from the Holding Page to production `main`
- **THEN** `ASTRO_SITE_URL`, renderer/CMS public-origin configuration, public checkout returns, shopper-facing email links, sitemap/metadata and affected assertions use `https://blackboxrecordsathens.com/`
- **AND** catalog/email images keep their verified PRD asset URLs without requiring an asset-host migration
- **AND** `https://blackbox-records-web.pages.dev` remains a technical Pages origin rather than the canonical public identity
- **AND** the existing production Worker URL remains the browser API target unless a separate approved API-hostname change exists.

#### Scenario: Final origins are staged

- **WHEN** the accepted full-site artifact is verified through the technical Pages origin while the apex serves Holding Page
- **THEN** its canonical metadata, CMS, and shopper-facing links already target the final apex
- **AND** catalog/email images remain reachable on the PRD asset host while the apex serves Holding Page
- **AND** technical and apex checkout return origins are explicitly allowlisted for smoke and public use respectively
- **AND** successful smoke is followed by routing cutover, without code or generated-asset changes that would invalidate acceptance.

#### Scenario: Code or content rollback is prepared

- **WHEN** a launch rollback procedure is reviewed
- **THEN** routine code rollback uses a revert, push and promotion, preserving the content pointer and commerce history
- **AND** emergency rollback pairs renderer and Pages deployments from the same run and rolls back the CMS Worker only when no migration intervened
- **AND** content rollback separately selects a verified accepted snapshot
- **AND** an old static artifact is not treated as restoration of prior published content.

#### Scenario: Live smoke or cutover fails

- **WHEN** a critical issue appears before or during public cutover
- **THEN** `native_checkout_enabled` is disabled first
- **AND** `PRD_LAUNCH_APPROVED` is removed when needed
- **AND** the public apex remains on or returns to the verified Holding Page when full-site rollback is required.

### Requirement: Launch approval and stability

The system MUST treat the user's explicit approval as the only final go/no-go authority and MUST preserve rollback through a minimum 24-hour stability window.

#### Scenario: Runtime flag is enabled before approval

- **GIVEN** `native_checkout_enabled=true`
- **AND** `PRD_LAUNCH_APPROVED` is absent
- **WHEN** Store capabilities or checkout creation is requested
- **THEN** shopper checkout remains disabled.

#### Scenario: User approves launch

- **WHEN** required technical pre-activation evidence passes, the current assumptions/deferrals are recorded and the user explicitly approves the bounded live smoke and conditional public cutover
- **THEN** `PRD_LAUNCH_APPROVED=true` may be deployed for the accepted Worker configuration
- **AND** one bounded live checkout smoke runs before apex cutover.

#### Scenario: Stability window is accepted

- **GIVEN** the public apex has served the accepted full site for at least 24 hours
- **WHEN** the user accepts stability evidence
- **THEN** holding-only workflow, source, artifact, and branch dependencies may be retired
- **AND** holding-only `noindex` remnants are removed
- **AND** final evidence is recorded before this change is archived.

### Requirement: Launch evidence safety

The system SHALL record PRD evidence without committing secrets, full Stripe IDs, provider credentials, raw provider payloads, or account-specific private data.

#### Scenario: Evidence is recorded

- **GIVEN** a production readiness check produces account-specific output
- **WHEN** evidence is written to OpenSpec
- **THEN** it is redacted to safe identifiers and summary status only.

### Requirement: Post-commerce performance readiness

The system MUST remeasure Store behavior against one production build and exact commit before launch acceptance. Independent Stripe preparation MAY proceed in parallel.

#### Scenario: Current Store gates pass

- **WHEN** bundle checks, documented performance profiles, Browser Use behavior, listing-price request count, per-card Store Offer count, and Store 5xx checks pass
- **THEN** the change records a no-action result and does not add performance architecture.

#### Scenario: Reproducible application failure remains

- **WHEN** a Store failure is attributable to current application behavior
- **THEN** one bounded performance child addresses only the measured cause and supplies accepted evidence before launch; archival alone is not a runtime gate
- **AND** pagination, virtualization, batching, static prices, or new frontend dependencies require a separate explicit design decision.
