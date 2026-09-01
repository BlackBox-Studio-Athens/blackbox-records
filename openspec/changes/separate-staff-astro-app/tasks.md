## 1. Establish the Staff Application Boundary

- [x] 1.1 Create `apps/staff` as package `@blackbox/staff` with static Astro, React, Tailwind, strict TypeScript, Vitest, root base path, and canonical staff site configuration; verify its empty shell passes package-level check and build commands.
- [x] 1.2 Register `@blackbox/staff` in the module-boundary manifest, Knip, dependency-cruiser, ESLint/type-check inputs, and root workspace scripts; verify boundary and unused-code audits recognize it as an independent package with no `apps/web` source imports.

## 2. Move the Stock Workspace

- [x] 2.1 Move the stock page, layout, React application, internal-stock browser helper, focused tests, and only the required local UI primitives/styles/assets into `apps/staff`; verify existing stock interaction and helper tests pass from the new package.
- [x] 2.2 Keep the staff API helper same-origin by default with the existing Local-only `PUBLIC_BACKEND_BASE_URL` override; verify tests cover root-relative hosted URLs and the Local split-port URL without changing generated API contracts.
- [x] 2.3 Add the staff root redirect, noindex metadata, cache/security policy files, and one focused artifact check that permits only the redirect document, `/stock/`, and referenced assets; verify the check rejects an injected public or `/admin/` route document.
- [x] 2.4 Delete the former stock route and staff-only implementation from `apps/web` without forwarding files; verify the public UAT and PRD builds contain no `/stock/` document and public web tests still pass.

## 3. Build and Deploy the Dedicated Artifact

- [x] 3.1 Update root `test:unit`, `check`, and `build` orchestration to include `@blackbox/staff` while preserving focused `build:web` and adding `build:staff`; verify all commands select the intended packages and no API generation runs.
- [x] 3.2 Extend `.github/workflows/pages.yml` so the gated PRD build hands off separate public and staff artifacts and a staff deploy job uploads only `apps/staff/dist` to `blackbox-records-staff`; verify manual targets and job dependencies cannot swap the two artifacts.
- [x] 3.3 Create the `blackbox-records-staff` Pages project if absent and run one initial artifact deployment without attaching the custom domain, Worker route, or Access policy; verify the recorded deployment belongs to the expected project and commit.

## 4. Acceptance and Handoff

- [x] 4.1 Use Browser Use against the Local staff app to verify `/` redirects to `/stock/`, a direct stock detail URL loads, and read/mutation behavior still uses the configured Worker boundary without public app-shell or `/admin/` content.
- [x] 4.2 Run `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, `pnpm build`, and `pnpm openspec -- validate separate-staff-astro-app --strict`; verify both frontend artifacts pass their route-isolation checks.
- [x] 4.3 Record the completed app/project handoff in `verify-operator-access-jwt`, leaving custom-domain attachment, same-origin Worker routing, Access setup, PRD secrets, and hosted JWT proof to that change.
