## MODIFIED Requirements

### Requirement: Staff frontend artifact is independent

The system SHALL build the protected staff portal as an independent static frontend artifact and SHALL exclude operator route documents from public frontend artifacts.

#### Scenario: Public frontend artifacts are built

- **WHEN** the UAT or PRD public Astro application builds
- **THEN** its artifact contains no `/stock/` route document
- **AND** it contains no staff-only browser API or page entrypoint.

#### Scenario: Staff frontend artifact is built

- **WHEN** the staff Astro application builds
- **THEN** its artifact contains `/stock/`, the staff root redirect, required assets, and staff content/item/order routes
- **AND** it contains no shopper, checkout, public app-shell route document or public CMS credentials.

### Requirement: Staff frontend remains static and Worker-backed

The staff frontend SHALL remain a static Astro/React build served by the combined backend Worker. All operational reads and writes SHALL use protected same-origin backend routes.

#### Scenario: Staff browser requests stock data

- **WHEN** the workspace reads or mutates editorial or operational records
- **THEN** it calls the appropriate authenticated CMS or internal application API
- **AND** no public Pages Function, browser secret, or duplicate stock implementation performs the work.

### Requirement: Catalog deployments use the gated source revision

Software deployment SHALL use the reviewed code revision and explicit target content snapshot. Content Publication SHALL use the already-deployed approved code revision without deploying the backend or performing general provider synchronization.

#### Scenario: Source affects catalog or code

- **WHEN** repository and compatibility gates pass
- **THEN** UAT backend and public artifacts deploy with revision-bound evidence before explicit PRD promotion.

#### Scenario: Editorial content changes

- **WHEN** content publication validates a complete target snapshot
- **THEN** only the static public artifact is rebuilt and published
- **AND** its backend and Stripe catalog are not redeployed or synchronized as a prerequisite.

#### Scenario: PRD launch is disabled

- **WHEN** software or content is published
- **THEN** existing shopper launch controls remain unchanged.

### Requirement: UAT static smoke stays read-only

UAT Static Smoke SHALL verify the Cloudflare public site's routes, public assets, metadata, redirects, Review Site Marker, and checkout shell without modifying content or provider state.

#### Scenario: UAT static smoke runs

- **WHEN** the suite targets configured UAT
- **THEN** public artifacts contain no Sveltia runtime, writable CMS configuration, or staff page documents
- **AND** old admin links lead to the protected workspace or a clear retired state
- **AND** authenticated staff tests remain a separate explicitly scoped suite.

## ADDED Requirements

### Requirement: One backend deployment includes staff and CMS

Each hosted Product Environment SHALL deploy one backend Worker containing CMS runtime, protected staff assets, existing application APIs, Stripe webhooks, and required scheduled handlers. The public storefront SHALL remain a separate static Pages deployment.

#### Scenario: Combined backend is deployed

- **WHEN** its verified artifact is promoted
- **THEN** CMS and commerce code and staff assets share that backend deployment revision
- **AND** the deployment preserves paid-order retries and public shopper/webhook access.

#### Scenario: Private assets are requested

- **WHEN** a request uses either the staff hostname or a public Worker alias
- **THEN** authentication and host policy run before private assets or CMS responses can be returned
- **AND** static asset routing cannot bypass the protection.

## REMOVED Requirements

### Requirement: Staff frontend uses a dedicated PRD Pages project

**Reason**: Staff assets ship with the combined Worker instead of a third independently deployed application.

**Migration**: Verify the protected Worker-hosted staff surface in UAT and PRD before retiring the old staff Pages deployment path. Preserve recoverable deployment history.
