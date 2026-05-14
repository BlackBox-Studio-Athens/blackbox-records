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
- route-level output checks for `/admin/config.yml`
- targeted `/admin/` rendered validation when admin behavior changes

## Migration Status

`open-temporary`

## Exit Criteria

- split Decap YAML builder from route/auth/base-path concerns
- isolate schema-field generation from deployment/runtime wiring
- reduce `decap-config.ts` from a large mixed string builder into smaller bounded helpers
- expose explicit admin entrypoints instead of leaving route consumers coupled to mixed implementation files
