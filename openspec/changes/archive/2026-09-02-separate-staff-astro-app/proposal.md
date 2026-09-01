## Why

The protected `/stock/` workspace currently lives inside the public Astro application even though it now has a separate production hostname and Pages project. Moving it into its own Astro workspace package gives the staff portal a clear source, build, and deployment boundary without adding a new runtime architecture.

## What Changes

- Add a static `apps/staff` Astro application that owns `/stock/` and the staff root redirect.
- Move the existing stock page, layout, browser API helper, focused UI code, styles, and tests out of `apps/web`; the public application no longer emits a `/stock/` document.
- Reuse `@blackbox/api-client` and the existing PRD Worker `/api/internal/*` contract; do not add an API, schema, database, authentication, SSR, or Pages Functions layer.
- Build and verify `apps/staff/dist` independently, then deploy only that artifact to the approved `blackbox-records-staff` Cloudflare Pages project.
- Keep the first staff artifact limited to `/stock/`, the root redirect, required static assets, and deployment policy files.
- Add the staff workspace boundary to the existing module-boundary manifest and repository gates without introducing cross-app source imports or a shared UI package.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-site-and-deployment`: Separate the protected PRD staff artifact and Pages project from the public UAT/PRD frontend artifacts.
- `module-boundaries`: Register `apps/staff` as an independent workspace package and prevent source-level imports between frontend applications.

## Impact

- Affected code: `apps/web` stock-route files, new `apps/staff`, root workspace scripts, static deployment workflow, and focused tests/checks.
- Affected architecture records: `openspec/specs/module-boundaries/module-boundaries.manifest.json` and its matching spec.
- Affected provider surface: dedicated Pages project `blackbox-records-staff`; custom-domain, Access, Worker-route, and hosted JWT proof remain coordinated by `verify-operator-access-jwt`.
- Unchanged: public APIs, generated clients, Worker business logic, D1 schema/data, Stripe/Resend behavior, and public UAT hosting.
