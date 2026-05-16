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
- `apps/web/src/lib/admin/decap-page-collections.test.ts`
- `apps/web/src/lib/admin/decap-site-chrome-collections.test.ts`
- `apps/web/src/lib/admin/decap-artist-collection.test.ts`
- `apps/web/src/lib/admin/decap-release-collection.test.ts`
- `apps/web/src/lib/admin/decap-distro-collection.test.ts`
- `apps/web/src/lib/admin/decap-news-collection.test.ts`
- route-level output checks for `/admin/config.yml`
- targeted `/admin/` rendered validation when admin behavior changes

## Migration Status

`closed`

`cms-admin` no longer carries the temporary-open exception. The admin route surfaces, runtime/base-path decisions, Decap
YAML builder, page/collection field generation, and media route are split into explicit files with direct tests for the
generated config behavior.

## Closure Evidence

- `/admin/`, `/admin/config.yml`, and `/admin/media/**` are declared module entrypoints.
- `decap-runtime-config.ts` owns hosted/local auth and base-path decisions.
- `decap-yaml-builder.ts` owns generic YAML field and collection rendering.
- page, site chrome, artist, release, distro, news, and settings/admin field generation are isolated behind tested helpers.
- `decap-config.ts` is a small composition root for backend/auth/site-root YAML and collection assembly.

## Forbidden Moves

- do not move shopper-facing catalog, checkout, stock, order, Stripe, D1, or BOX NOW behavior into `cms-admin`
- do not widen ownership beyond `apps/web/src/pages/admin/**` and `apps/web/src/lib/admin/**`
- do not add temporary compatibility facades for old deep imports
- do not add new `open-temporary` modules as a convenience escape hatch
