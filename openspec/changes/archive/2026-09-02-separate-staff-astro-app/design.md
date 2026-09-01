## Context

The current `/stock/` page is a small static Astro entrypoint inside `apps/web`. It renders one React island through `StockOpsLayout`, uses a browser helper for `/api/internal/*`, and depends on a small set of local UI primitives, global style tokens, brand assets, and `@blackbox/api-client/internal`.

The pnpm workspace already includes `apps/*`, so a new application needs no workspace-layout change. The existing static deployment workflow already performs shared unit, check, unused-code, build-artifact, and Cloudflare Direct Upload stages. See `proposal.md` for motivation and the delta specs for required behavior.

## Goals / Non-Goals

**Goals:**

- Make staff route ownership obvious from source tree through deployed artifact.
- Preserve the current stock workflow and same-origin Worker API behavior.
- Keep normal repository gates authoritative for both frontend applications.
- Reuse existing deployment machinery with the fewest new moving parts.

**Non-Goals:**

- Redesigning the stock workspace or changing its operator behavior.
- Creating a shared design-system package, generic portal framework, or reusable deployment abstraction.
- Adding SSR, an Astro Cloudflare adapter, Pages Functions, a proxy Worker, or a second backend.
- Changing Access JWT verification, internal API contracts, D1, or UAT topology.
- Adding staff pages beyond the approved root redirect and `/stock/`.

## Decisions

### Create `apps/staff` as a normal Astro workspace package

Use package name `@blackbox/staff`, static output, React integration, Tailwind's existing Vite integration, `site: https://staff.blackboxrecordsathens.com`, and root base path.

Astro file-based routing becomes the route allowlist: the application contains only the stock page. This is cleaner than changing `srcDir` inside `apps/web`, deleting routes after a public build, or maintaining a custom Astro integration.

### Move staff behavior instead of importing from `apps/web`

Move the stock page, layout, stock application, internal-stock browser helper, and their focused tests into `apps/staff`. Remove their former public-app copies and route.

The staff app owns a minimal local set of the simple UI primitives and style tokens it uses. Do not create `packages/ui` for one consumer split, and do not import `apps/web/src/**`. Small presentation duplication is accepted to preserve the application boundary; extract a shared package only after repeated cross-app change proves it useful.

Brand files needed by the staff shell may be copied into the staff public directory. Keep that set explicit and small rather than introducing an asset package.

### Share only the generated internal API contract

Keep `@blackbox/api-client/internal` as the cross-workspace dependency. The staff-owned browser helper defaults to same-origin requests and accepts `PUBLIC_BACKEND_BASE_URL` only for Local split-port development.

Do not change generated clients or run `pnpm generate:api` unless an API contract changes independently.

### Keep route and artifact policy explicit

The staff application owns:

- `/stock/` as its only page;
- `/` as a redirect to `/stock/`;
- noindex metadata and staff-specific cache/security policy files;
- required fingerprinted Astro assets and a small explicit public-asset set.

A focused artifact check enumerates generated HTML and fails if shopper, checkout, `/admin/`, or other public route documents appear. This check is narrow; it does not become a generic static-site policy framework.

### Extend the existing static deployment workflow

Reuse `.github/workflows/pages.yml` rather than create another workflow or reusable workflow abstraction.

The PRD static build stage builds both frontend packages for the same commit and uploads two named artifacts:

- `apps/web/dist` for `blackbox-records-web`;
- `apps/staff/dist` for `blackbox-records-staff`.

Add a staff deploy job that shares the existing unit-test and workspace-check prerequisites and receives only the staff artifact. Main pushes deploy both PRD artifacts. Manual dispatch may add `staff` as a target while retaining `all`, `uat`, and `prd`; `prd` continues to mean the public PRD site, while `all` includes staff.

The staff app uses its canonical site value from its own config, so public-site `ASTRO_SITE_URL` and Decap variables do not affect it.

### Register the workspace and owned roots directly

Add `@blackbox/staff` to the module-boundary manifest as a workspace package. Staff routes, components, libraries, styles, and tests are staff-owned roots. Update ESLint, dependency-cruiser, Knip, TypeScript checking, unit-test selection, formatting, and build scripts only where the new workspace requires inclusion.

Do not add a compatibility facade at the old `apps/web` paths.

### Coordinate provider activation with the JWT change

This change creates the application, verified artifact, workflow, and Pages deployment target. `verify-operator-access-jwt` remains responsible for attaching `staff.blackboxrecordsathens.com`, configuring the same-origin `/api/internal/*` Worker route and Cloudflare Access, setting PRD trust values, and running hosted positive/negative proof.

Provider setup must associate the custom domain with `blackbox-records-staff` before adding a Worker route or Access policy that would block Pages domain validation.

## Risks / Trade-offs

- [A few UI primitives and style tokens exist in both frontend apps] → Accept the small duplication; extract shared UI only after real repeated maintenance cost appears.
- [One workflow deploys two PRD frontends on main] → Prefer simple shared gates and commit alignment; split workflows only if CI duration or independent release cadence becomes a measured problem.
- [Moving files can leave public route or test references behind] → Use boundary, unused-code, artifact, unit, and build checks; do not retain forwarding files.
- [Provider setup order can block custom-domain validation] → Create and validate the Pages custom domain before installing Worker routing and Access.

## Migration Plan

1. Add `apps/staff` with its own Astro/package/type/test configuration and minimal static shell.
2. Move stock UI behavior and focused tests, then prove Local same-origin and split-port behavior.
3. Remove the stock route and staff-only implementation from `apps/web`.
4. Add staff artifact verification and include the workspace in repository gates and module-boundary records.
5. Extend the existing static deployment workflow to build, hand off, and deploy `apps/staff/dist` to `blackbox-records-staff`.
6. Run repository gates and strict OpenSpec validation, then hand provider activation and hosted proof back to `verify-operator-access-jwt`.

Rollback reverts the application move and workflow changes, then redeploys the prior public/staff commit as needed. No database or API rollback is required.
