## MODIFIED Requirements

### Requirement: Nx projects define module roots and actual dependencies

Each application module MUST declare its source root, targets and task inputs in an Nx `project.json`. The boundary manifest MUST reference those projects for ownership roots while continuing to declare allowed dependencies and public entrypoints. Nx dependency edges describe actual imports and runtime relationships; they do not grant architectural permission.

#### Scenario: Module ownership is declared

- **WHEN** a module root changes
- **THEN** the module's `project.json` defines its root and task inputs
- **AND** the boundary manifest references that project instead of duplicating root globs
- **AND** framework pages, layouts and test support remain separate roots such as `web-pages`, `web-layouts` and `web-test-support`.

#### Scenario: Runtime imports affect the Nx graph

- **WHEN** Astro loads a runtime dependency that static import analysis does not discover
- **THEN** the Nx project declares the runtime edge
- **AND** the actual dependency graph remains separate from the manifest's allowed-dependency policy.

#### Scenario: Test ownership crosses modules

- **WHEN** cross-module commerce behavior is tested
- **THEN** its integration suite is located under `apps/web/test/commerce/` and declared as an external test input
- **AND** test ownership does not grant source modules additional import permissions.

#### Scenario: Shared UI primitive is added

- **GIVEN** a reusable UI foundation primitive must be consumed across closed application modules
- **WHEN** the primitive is added under `apps/web/src/components/ui/`
- **THEN** the primitive is listed as a provided `ui-foundation` entrypoint in `module-boundaries.manifest.json`
- **AND** feature modules import that entrypoint directly instead of deep-importing private UI foundation implementation.

#### Scenario: Shell renders the shared music mark

- **WHEN** the app shell renders the modal or minimized player heading
- **THEN** it consumes the player's provided `apps/web/src/components/music/MusicEqualizer.tsx` entrypoint
- **AND** the decorative mark owns no playback state or iframe lifecycle.

#### Scenario: Route-local HTTP helper is added

- **GIVEN** public commerce HTTP route code needs a helper that is not a cross-module interface
- **WHEN** the helper is added under `apps/backend/src/interfaces/http/routes/`
- **THEN** the helper is listed under the owning `public-commerce-http` roots in `module-boundaries.manifest.json`
- **AND** it is not listed as a provided entrypoint unless another module is allowed to import it.

#### Scenario: Public Services inquiry HTTP files are added

- **GIVEN** the public Services inquiry route and route-local service are implemented under `apps/backend/src/interfaces/http/routes/`
- **WHEN** boundary validation runs
- **THEN** both files are listed under the closed `public-commerce-http` roots
- **AND** the shared public contract remains exposed through the existing `public-contracts` named interface
- **AND** the route-local service depends on the provided `email-application` entrypoint rather than provider implementation.

#### Scenario: Scheduled catalog verification is retired

- **GIVEN** Store Listing Price recovery no longer uses a scheduled Worker handler
- **WHEN** boundary validation runs
- **THEN** `public-commerce-http` does not own a scheduled interface root
- **AND** the retired catalog verification handler is not a provided entrypoint.

#### Scenario: Paid-order deliveries run on one owned schedule

- **GIVEN** pending PaidOrderDelivery rows require bounded retry processing
- **WHEN** the Worker scheduled handler is composed
- **THEN** the `orders` module owns and provides `apps/backend/src/application/commerce/orders/run-paid-order-delivery-schedule.ts`
- **AND** that entrypoint drains only paid-order deliveries through the existing email application and Resend integration
- **AND** `public-commerce-http` owns no scheduled root or scheduled entrypoint.

#### Scenario: Cart-scoped checkout route is added

- **GIVEN** cart-scoped checkout pages are added under `apps/web/src/pages/store/checkout/`
- **WHEN** boundary validation runs
- **THEN** those route files are owned by the closed `checkout-web` module
- **AND** item-scoped checkout compatibility pages stay owned by `checkout-web` until removed.

#### Scenario: VAT and delivery summaries are shared with the cart

- **GIVEN** cart and checkout display a Worker-validated delivery quote
- **WHEN** the app shell composes the cart drawer
- **THEN** it supplies the `checkout-web` provided `DeliverySummary.tsx` component through the cart drawer's presentation slot
- **AND** `store-cart` does not depend on checkout HTTP clients or payment authority
- **AND** `checkout-web` owns `DeliveryRates.tsx` and `/terms/` delivery information
- **AND** `commerce-domain` owns the accepted policy and order monetary types in `monetary.ts`, exposed through its existing root entrypoint.

#### Scenario: Purchase information crosses public presentation boundaries

- **GIVEN** public purchase and privacy information is shared by Store Item, checkout, footer and personal-data forms
- **WHEN** those surfaces render policy copy or links
- **THEN** `web-platform` owns and provides `components/PurchaseInformation.tsx`, `components/PurchaseDocument.tsx`, `lib/purchase-information.ts` and `lib/purchase-information-schema.ts` under `apps/web/src/platform/`, with the purchase-information content entry owned by the same module
- **AND** application-owned `web-pages` owns the static `/terms/` and `/privacy/` routes; `checkout-web` retains runtime monetary presentation
- **AND** shared editorial information does not import checkout clients or become price, tax or order authority.

#### Scenario: Store category routes are added

- **GIVEN** Store collection pages exist at `/store/`, `/store/blackbox-releases/`, `/store/distro/`, and `/store/merch/`
- **WHEN** boundary validation runs
- **THEN** `web-pages` owns route files, `web-layouts` owns the shared category page, and `storefront-catalog` owns the category classifier, Distro grouping and listing cards
- **AND** the `/distro/` redirect route remains in the documented static storefront route root.

#### Scenario: Shared Distro groups cross the CMS boundary

- **GIVEN** Astro content validation and CMS collection builders require the same Distro group values and intro-key definitions
- **WHEN** CMS configuration imports those closed values
- **THEN** shared closed values are provided by the pure content-model workspace entrypoint
- **AND** frontend and CMS consumers import it without cross-app source imports or duplicated group lists.

#### Scenario: Shared editorial validation crosses the CMS boundary

- **GIVEN** Astro content schemas and CMS fields require the same path, URL, email, image, and provider constraints
- **WHEN** CMS configuration imports those validation primitives
- **THEN** shared portable editorial constraints are provided by the pure content-model workspace entrypoint
- **AND** native revision, rich-text and immutable snapshot validation use that same pure entrypoint without importing backend source into the public build
- **AND** `storefront-catalog` owns the public snapshot loader and media reader, with `content-loader.ts` provided to Astro collection configuration
- **AND** Astro-specific image/render handling remains in the public web application.

#### Scenario: Route-lazy Store Distro search crosses the app-shell boundary

- **GIVEN** Store Distro search presentation is owned by `storefront-catalog`
- **WHEN** the app shell lazily mounts that control on `/store/distro/`
- **THEN** `apps/web/src/components/store/StoreDistroSearch.tsx` is a provided `storefront-catalog` entrypoint
- **AND** the app shell imports that entrypoint instead of a private storefront implementation.

#### Scenario: Services inquiry presentation crosses the app-shell boundary

- **GIVEN** Services inquiry presentation is owned by `storefront-catalog`
- **WHEN** the app shell lazily mounts the inquiry form
- **THEN** `apps/web/src/components/services/**` is an owned `storefront-catalog` root
- **AND** `ServicesInquiryForm.tsx` remains a provided entrypoint
- **AND** reusable controls are imported through `ui-foundation` entrypoints.

#### Scenario: Shared Store Coverflow controller crosses the app-shell boundary

- **GIVEN** Store Coverflow interaction behavior is owned by `storefront-catalog`
- **WHEN** the app shell mounts that behavior after activating `/store/`
- **THEN** `apps/web/src/components/store/StoreCoverflowController.ts` is a provided `storefront-catalog` entrypoint
- **AND** Distro and app-shell callers import the same controller instead of duplicating interaction logic or using an ownership exception.

#### Scenario: StoreCart event contract is shared

- **GIVEN** app-shell and checkout-web code coordinate browser-only StoreCart events
- **WHEN** event names are imported across closed module boundaries
- **THEN** they use the dependency-free `store-cart-events.ts` provided entrypoint
- **AND** the app shell does not import checkout presentation to register the event bridge.

#### Scenario: Backend shared observability helper is added

- **GIVEN** backend modules need shared Worker-safe logging, tracing, or HTTP response helpers
- **WHEN** the helper is added
- **THEN** the helper is listed as a provided `backend-platform` entrypoint in `module-boundaries.manifest.json`
- **AND** feature modules import that entrypoint directly instead of deep-importing HTTP route internals.

#### Scenario: Internal routes use the operator authentication boundary

- **GIVEN** the complete `/api/internal/*` router requires one shared authentication middleware
- **WHEN** public HTTP composition mounts the operator-auth entrypoint
- **THEN** `public-commerce-http` declares `operator-auth` as an allowed dependency
- **AND** `operator-auth` may use only provided `backend-platform` environment, observability, and response entrypoints.

#### Scenario: Staff frontend is isolated from the public web app

- **GIVEN** stock operations are built by the `@blackbox/staff` workspace
- **WHEN** boundary validation runs
- **THEN** the closed `staff-frontend` module is the application composition root and owns `apps/staff/src` pages, layouts, root styles and `StaffOverview`
- **AND** nested closed `staff-*` modules own their Nx project roots beneath `apps/staff/src`
- **AND** staff workspace dependencies are limited to documented internal API and pure content-model entrypoints
- **AND** `operator-stock` retains backend ownership without public or staff frontend roots.

## ADDED Requirements

### Requirement: Staff frontend is composed of closed feature modules

The `staff-frontend` composition root SHALL consume closed `staff-*` modules for the shared UI primitives, platform helpers, order, publication, shell, stock and content features. Each module MUST declare its root, task inputs and test target in its own Nx `project.json`, and module dependencies MUST stay acyclic.

#### Scenario: Staff modules are layered

- **WHEN** boundary validation runs
- **THEN** layering runs `staff-ui` ← `staff-platform` ← {`staff-orders`, `staff-publication`} ← {`staff-shell`, `staff-stock`} ← `staff-content` ← `staff-frontend`
- **AND** `staff-ui` has no staff dependencies, `staff-platform` may use `staff-ui`, and `staff-orders` and `staff-publication` may use `staff-ui` and `staff-platform`
- **AND** `staff-shell` and `staff-stock` may use `staff-ui`, `staff-platform` and `staff-publication`
- **AND** `staff-content` may use `staff-ui`, `staff-platform`, `staff-publication` and `staff-stock`
- **AND** `staff-frontend` may use every staff module, and declares them as implicit Nx dependencies because Astro imports are invisible to static analysis.

#### Scenario: Shell and stock stay independent of the content editor

- **WHEN** a staff shell or stock file is added or changed
- **THEN** it does not import `staff-content`
- **AND** publication behavior shared with the editor lives in `staff-publication`.

#### Scenario: Internal API client access is narrow

- **WHEN** a staff module needs `@blackbox/api-client`
- **THEN** only `staff-platform` and `staff-orders` consume the `./internal` export
- **AND** no staff module consumes another `@blackbox/api-client` export.

#### Scenario: Staff module tests run independently

- **WHEN** a maintainer runs `pnpm test <staff-module>` or `pnpm test:watch <staff-module>` for a module with tests
- **THEN** that module's own Nx test target runs only its test files
- **AND** `staff-ui` and `staff-frontend` have no test target
- **AND** every staff test file has exactly one owning module.
