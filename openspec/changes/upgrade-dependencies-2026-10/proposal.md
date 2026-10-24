# Proposal

## Why

Upgrade the approved October 2026 dependency set together, preserving current application behavior and compatible peer versions. EmDash core, Cloudflare integration and admin are already current at 1.3.1 and need no bump.

## What Changes

- Update the approved runtime, UI and toolchain package versions without changing UI components.
- **BREAKING dependency APIs:** migrate Nx to 24, Vitest to 5 with `@cloudflare/vitest-plugin`, MSW to 3, Motion to 14 and Stripe to 23.
- Move the Stripe SDK API version from `2026-08-26.dahlia` to `2026-09-30.endive`, preserving the legacy-version regression case.
- Keep TypeScript 5.9.3 (openapi-typescript requires 5.x), Lingui core/react 5.9.5 (EmDash admin uses 5), and React Query 5.90.21 (EmDash admin's exact pin). Keep Prisma on stable 7.10.1 because 8 is an RC, and Node types on 24.19.2 for the Node 24 engine.
- Update Renovate's Vitest compatibility rule and record local acceptance separately from hosted gates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This maintenance change preserves baseline product requirements; `skip_specs: true` follows the EmDash upgrade pattern.

## Impact

Workspace manifests and lockfile, Nx migration output, Worker test tooling, MSW setup, Stripe integration constants/tests and dependency policy references. Work stays on main in the existing checkout. No commit, push, deployment, hosted Stripe/Cloudflare access or UI component edit is authorized. Claude owns UI visual verification.

Hosted UAT/PRD webhook endpoint API-version verification (`pnpm stripe:webhooks:verify`) and the UAT release remain OPEN gates.
