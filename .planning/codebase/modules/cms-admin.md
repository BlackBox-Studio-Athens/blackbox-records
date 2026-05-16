# Module Canvas: cms-admin

## Responsibility

Own Decap authoring routes, generated admin configuration, and admin media routing without leaking those concerns into
shopper-facing modules.

## Owned Files And Directories

- `apps/web/src/pages/admin/**`
- `apps/web/src/lib/admin/**`

## Provided Interface

- `/admin/`
- `/admin/config.yml`
- `/admin/media/**`

## Internal Implementation Area

- Decap YAML generation
- generic Decap YAML field and collection rendering
- content-schema-aware field and collection mapping
- auth and base-path mapping details
- media route and asset resolution details

## Allowed Dependencies

- `storefront-catalog`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- future `admin-config` named interface if route handlers and config generation need a stable split

## Published Events

- none formal today

## Listened-To Events

- none formal today

## Verification Strategy

- keep shopper-facing storefront code free of admin internals
- validate generated config output and media route behavior
- preserve editor/schema alignment when content models change
- keep the exception bar hard: do not widen this module's ownership or add new temporary-open peers casually

## Tests Required Before Refactors

- `apps/web/src/lib/admin/decap-config.test.ts`
- `apps/web/src/lib/admin/decap-yaml-builder.test.ts`
- `apps/web/src/lib/admin/decap-runtime-config.test.ts`
- `apps/web/src/lib/admin/decap-home-fields.test.ts`
- `apps/web/src/lib/admin/decap-about-fields.test.ts`
- `apps/web/src/lib/admin/decap-services-fields.test.ts`
- `apps/web/src/lib/admin/decap-settings-fields.test.ts`
- route-level output checks for `/admin/config.yml`
- targeted `/admin/` rendered validation when admin behavior changes

## Migration Status

`open-temporary`

`cms-admin` remains open-temporary because the current admin surface still combines Decap route surfaces, YAML
generation, content-schema awareness, hosted auth/base-path handling, and admin media routing inside one legacy hotspot.
That exception is temporary, not a general license to grow the module.

## Exit Criteria

- separate `/admin/`, `/admin/config.yml`, and `/admin/media/**` route surfaces from config-building internals
- split Decap YAML builder from route/auth/base-path concerns
- isolate content-schema-aware field generation from deployment/runtime wiring
- reduce `decap-config.ts` from a large mixed string builder into smaller bounded helpers
- expose explicit admin entrypoints instead of leaving route consumers coupled to mixed implementation files

## Forbidden While Open

- do not move shopper-facing catalog, checkout, stock, order, Stripe, D1, or BOX NOW behavior into `cms-admin`
- do not widen ownership beyond `apps/web/src/pages/admin/**` and `apps/web/src/lib/admin/**`
- do not add temporary compatibility facades for old deep imports
- do not add new `open-temporary` modules as a convenience escape hatch
- do not split `decap-config.ts` until the split has direct coverage for generated config output and route behavior
