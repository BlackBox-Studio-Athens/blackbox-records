## MODIFIED Requirements

### Requirement: Boundary manifest authority

The system MUST keep module ownership, entrypoints, allowed dependencies, statuses, and exceptions in the OpenSpec module-boundary manifest.

#### Scenario: Module ownership changes

- **GIVEN** a change updates module roots, entrypoints, allowed dependencies, or exception policy
- **WHEN** the change is made
- **THEN** `openspec/specs/module-boundaries/module-boundaries.manifest.json` and this spec are updated together when behavior changes.

#### Scenario: Shared UI primitive is added

- **GIVEN** a reusable UI foundation primitive must be consumed across closed application modules
- **WHEN** the primitive is added under `apps/web/src/components/ui/`
- **THEN** the primitive is listed as a provided `ui-foundation` entrypoint in `module-boundaries.manifest.json`
- **AND** feature modules import that entrypoint directly instead of deep-importing private UI foundation implementation.

#### Scenario: Route-local HTTP helper is added

- **GIVEN** public commerce HTTP route code needs a helper that is not a cross-module interface
- **WHEN** the helper is added under `apps/backend/src/interfaces/http/routes/`
- **THEN** the helper is listed under the owning `public-commerce-http` roots in `module-boundaries.manifest.json`
- **AND** it is not listed as a provided entrypoint unless another module is allowed to import it.

#### Scenario: Cart-scoped checkout route is added

- **GIVEN** cart-scoped checkout pages are added under `apps/web/src/pages/store/checkout/`
- **WHEN** boundary validation runs
- **THEN** those route files are owned by the closed `checkout-web` module
- **AND** item-scoped checkout compatibility pages stay owned by `checkout-web` until removed.

#### Scenario: Store category routes are added

- **GIVEN** Store collection pages exist at `/store/`, `/store/blackbox-releases/`, `/store/distro/`, and `/store/merch/`
- **WHEN** boundary validation runs
- **THEN** their route files, shared category page, category classifier, Distro grouping, and listing cards are owned by the closed `storefront-catalog` module
- **AND** the `/distro/` redirect route remains in the documented static storefront route root.

#### Scenario: Route-lazy Distro search crosses the app-shell boundary

- **GIVEN** Store Distro search presentation is owned by `storefront-catalog`
- **WHEN** the app shell lazily mounts that control on `/store/distro/`
- **THEN** `apps/web/src/components/store/StoreDistroSearch.tsx` is a provided `storefront-catalog` entrypoint
- **AND** the app shell imports that entrypoint instead of a private storefront implementation.

#### Scenario: StoreCart event contract is shared

- **GIVEN** app-shell and checkout-web code coordinate browser-only StoreCart events
- **WHEN** event names are imported across closed module boundaries
- **THEN** they use the dependency-free `store-cart-events.ts` provided entrypoint
- **AND** the app shell does not import checkout presentation to register the event bridge.

#### Scenario: Backend shared observability helper is added

- **GIVEN** backend modules need shared Worker-safe logging, tracing, or HTTP response helpers
- **WHEN** the helper is added
- **THEN** the helper is listed as a provided `platform-shared` entrypoint in `module-boundaries.manifest.json`
- **AND** feature modules import that entrypoint directly instead of deep-importing HTTP route internals.

### Requirement: Storefront catalog provides route-lazy Distro search

The system MUST keep Store Distro search presentation inside the closed `storefront-catalog` module while exposing its app-shell integration through a provided entrypoint.

#### Scenario: App shell mounts Distro search

- **WHEN** the app shell imports the route-lazy control for `/store/distro/`
- **THEN** `apps/web/src/components/store/StoreDistroSearch.tsx` is owned by `storefront-catalog` and listed as a provided entrypoint
- **AND** legacy `apps/web/src/components/distro/DistroSearch.tsx` is not retained as a compatibility facade
- **AND** boundary validation passes without an ownership exception.
