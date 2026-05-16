# Codebase Modules

**Analysis Date:** 2026-05-14  
**Status:** Planning source of truth for future milestone `v1.2 Modulith Boundary Hardening`

## Purpose

This document defines the explicit application-module model for future hardening work in `blackbox-records`.

It is the repo-local equivalent of a Spring Modulith application-module map, but implemented through a TypeScript-native
boundary stack:

- modules are explicit
- modules are closed by default
- extra exposed surfaces are named interfaces
- allowed dependencies are documented in advance
- temporary-open and split-pending exceptions are explicit and time-bounded
- tooling reads one repo machine-readable manifest

## TypeScript-Native Enforcement Stack

### Primary layers

- `eslint-plugin-boundaries` is the primary import and entrypoint rule layer.
- `dependency-cruiser` is the primary cycle and graph-shape rule layer.
- explicit root entrypoints and named interfaces are the legal import targets.
- `.planning/codebase/module-boundaries.manifest.json` is the future tooling input.

### Why this stack

- the planned module boundaries mostly live _inside_ `apps/web` and `apps/backend`
- this makes a manifest plus lint and graph checks a closer fit than project-level workspace tagging
- the stack is mechanical enough to help AI agents, not just human reviewers

## Source Of Truth Layering

- `MODULES.md` is the human-readable module map.
- `.planning/codebase/modules/*.md` are the human-readable per-module canvases.
- `.planning/codebase/module-boundaries.manifest.json` is the machine-readable enforcement source for tooling.

All three surfaces must move together when module ownership, entrypoints, statuses, or allowed dependencies change.
Human review should start from `MODULES.md` and the module canvases; lint, dependency graph checks, and manifest audits
read the JSON manifest. A change that updates only the Markdown docs or only the manifest is incomplete unless it is
purely editorial and cannot affect ownership, entrypoints, status, dependencies, or exception policy.

## Canonical Module Table

| Module                 | Status          | Primary owned roots                                                                                              | Provided interface                                       |
| ---------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `app-shell`            | `closed`        | `apps/web/src/components/app-shell/`, `apps/web/src/lib/app-shell/`                                              | `AppShell.astro` and the thin shell composition root     |
| `player`               | `closed`        | `apps/web/src/components/app-shell/player-*`, `apps/web/src/components/music/`, `apps/web/src/utils/music.ts`    | listen-trigger and player session surfaces               |
| `ui-foundation`        | `closed`        | `apps/web/src/components/ui/`, `apps/web/src/lib/utils.ts`                                                       | shared frontend UI primitives and `cn` helper            |
| `storefront-catalog`   | `closed`        | shopper-facing content query, catalog projection, cards/detail, and non-checkout store routes                    | browser-safe catalog and route-projection surfaces       |
| `store-cart`           | `closed`        | `apps/web/src/lib/store-cart.ts`, StoreCart button and drawer                                                    | `@/lib/store-cart` plus cart UI surfaces                 |
| `checkout-web`         | `closed`        | checkout pages, checkout UI state, public checkout browser adapters                                              | shopper checkout routes and browser-safe checkout client |
| `cms-admin`            | `closed`        | `apps/web/src/pages/admin/`, `apps/web/src/lib/admin/`                                                           | `/admin/` surfaces and Decap config/media routes         |
| `public-commerce-http` | `closed`        | public Worker HTTP routes and public contracts, with client access exposed through `@blackbox/api-client/public` | `/api/store/*`, `/api/checkout/*`, public OpenAPI/client |
| `commerce-domain`      | `closed`        | backend commerce IDs and repository port contracts                                                               | backend commerce repository SPI                          |
| `checkout-core`        | `closed`        | `apps/backend/src/application/commerce/checkout/`                                                                | checkout use-case API                                    |
| `orders`               | `closed`        | `apps/backend/src/application/commerce/orders/`, order readback HTTP                                             | order lifecycle and reconciliation APIs                  |
| `stock`                | `closed`        | `apps/backend/src/application/commerce/stock/`                                                                   | stock read/write use-case API                            |
| `operator-stock`       | `closed`        | protected stock UI and internal stock routes, with client access exposed through `@blackbox/api-client/internal` | `/stock/` and `/api/internal/*` stock-facing surfaces    |
| `platform-shared`      | `split-pending` | shared config, bootstrap, public client-factory, and residual foundation code                                    | shared factories and bootstrap helpers only              |

## Dependency Rules

### Default rule

- A module may depend only on another module's provided interface or explicitly named interface.
- Deep imports into another module's internal implementation are forbidden by policy.
- Events are exceptional decoupling tools, not the default cross-module interaction mode.

### Initial allowed dependency matrix

- `app-shell` -> `player`, `store-cart`, `checkout-web`, `storefront-catalog`, `ui-foundation`, `platform-shared`
- `player` -> `ui-foundation`, `platform-shared`
- `ui-foundation` -> no business-module dependencies
- `storefront-catalog` -> `player`, `store-cart`, `checkout-web`, `ui-foundation`, `platform-shared`
- `store-cart` -> `ui-foundation`, `platform-shared`
- `checkout-web` -> `store-cart`, `storefront-catalog`, `public-commerce-http`, `ui-foundation`, `platform-shared`
- `cms-admin` -> `storefront-catalog`, `platform-shared`
- `public-commerce-http` -> `checkout-core`, `orders`, `stock`, `platform-shared`
- `commerce-domain` -> no business-module dependencies
- `checkout-core` -> `commerce-domain`, `orders`, `stock`, `platform-shared`
- `orders` -> `commerce-domain`, `stock`, `platform-shared`
- `stock` -> `commerce-domain`, `platform-shared`
- `operator-stock` -> `stock`, `orders`, `ui-foundation`, `platform-shared`
- `platform-shared` -> no business-module dependencies

## Entrypoint Policy

- The root provided interface is the default import target.
- Any extra exposed surface must be declared as a named interface in the owning module canvas and manifest.
- Planned TypeScript shapes include `index.ts`, `api.ts`, and `spi.ts`.
- A file path is not a named interface just because it is exported today.
- Temporary compatibility facades are out of policy for future boundary slices.

### Real package boundaries

- When a module is already a real workspace package, package `exports` are the preferred hard boundary surface.
- `@blackbox/api-client` is the existing example of this pattern.
- In-app modules should not be forced into packages just to get entrypoint clarity.

## Generated And Shared Artifact Policy

- Generated artifacts still need an explicit owner module.
- Shared artifacts still need an explicit owner module.
- A generated or shared artifact does not need to pretend to be an ordinary business module when a package or
  platform-shared boundary is the right fit.
- Backend commerce IDs and repository port contracts belong to `commerce-domain`, not `platform-shared`.
- `platform-shared` remains strict bootstrap-only and must not become a business-logic catch-all.

## Exception Policy

- `open-temporary` is allowed only for legacy hotspots with explicit exit criteria.
- `split-pending` is allowed only for residual shared buckets that are supposed to shrink.
- There are no remaining approved `open-temporary` modules.
- Every `open-temporary` module must carry manifest metadata for its temporary reason, exit criteria, and forbidden moves
  while open.
- New modules must not start as `open-temporary` without a new planning decision and manifest validator update.
- Covered module roots should fail fast under the boundary stack; do not hide boundary work behind audit-only drift.

## Branch And Review Policy

- Use one approved execution slice per branch or local commit cluster.
- Keep branch creation and sequencing manual while this repo uses Codex flat planning mode.
- Do not enable `.planning/config.json` parallelization or `workflow.use_worktrees` for Phase 12 slices.
- Do not add temporary compatibility facades; move callers to documented entrypoints inside the same slice.

## Verification Targets

Future hardening work should enforce this document through:

- `eslint-plugin-boundaries` in `eslint.config.mjs`
- `dependency-cruiser` graph rules
- custom audit scripts where repo-specific rules are still needed
- targeted architecture tests
- existing repo gates such as `pnpm check`, `pnpm test:unit`, and `pnpm audit:commerce-boundaries`

## Module Canvases

- [app-shell](modules/app-shell.md)
- [player](modules/player.md)
- [ui-foundation](modules/ui-foundation.md)
- [storefront-catalog](modules/storefront-catalog.md)
- [store-cart](modules/store-cart.md)
- [checkout-web](modules/checkout-web.md)
- [cms-admin](modules/cms-admin.md)
- [public-commerce-http](modules/public-commerce-http.md)
- [commerce-domain](modules/commerce-domain.md)
- [checkout-core](modules/checkout-core.md)
- [orders](modules/orders.md)
- [stock](modules/stock.md)
- [operator-stock](modules/operator-stock.md)
- [platform-shared](modules/platform-shared.md)
