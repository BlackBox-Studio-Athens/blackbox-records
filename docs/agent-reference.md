# Project contracts and edit points

Read the relevant section. [AGENTS.md](../AGENTS.md) routes to current domain specs and operational owners.

## Local runtime

- `pnpm dev` runs the normal stack with the official local Stripe mock, public site, staff, CMS and backend without real provider credentials. Before serving or rebuilding frontend output, inspect the current Local serving mode and process; reuse a suitable running site. For frontend-only work, check `pnpm site:dev:status` and start `pnpm site:dev:bg` only when this checkout's port is free. Stop only a serving process you own, using `pnpm site:dev:stop`, before rebuilding its output.
- The primary checkout serves the public Local site at `http://127.0.0.1:4321/blackbox-records/`; each linked worktree gets a stable port from 4331 upward in steps of 10. `pnpm site:dev`, `pnpm site:dev:bg` and `pnpm test:e2e` use the checkout's port, and an occupied port fails instead of moving.
- The full Local stack binds 4321 and runs from one checkout at a time; a second start fails and names the running checkout. The stack's checkout serves its site on 4321, even when standalone Astro reports no instance.
- Agent sessions lease the shared Chrome profile through a Claude Code hook; another session's lease frees after 180 seconds without use. Meanwhile use a named e2e spec or the built-in browser pane on this checkout's URL.
- `pnpm local:status` shows validation slots, site ports, the stack owner, the Chrome lease and any maintainer grant. This state lives in `<git common dir>/blackbox-feedback/` and is shared by every checkout.
- On Windows, workerd cannot open SQLite files whose path reaches 256 characters, and a Durable Object stored there fails every request with an opaque `internal error`. Local Worker names stay short so storage fits checkout paths up to 104 characters (Claude Code worktree names up to 37); the Local Worker launchers refuse deeper checkouts and state how much shorter the path must be.
- `pnpm site:dev` stays foreground for stack/IDE supervision. Background controls are `pnpm site:dev:status`, `pnpm site:dev:logs` and `pnpm site:dev:stop`. Astro startup diagnostics are in `apps/web/.astro/dev.log`.
- `pnpm test:e2e <spec|-g filter>` runs deterministic Playwright specs against this checkout's Local URL; locally it requires a spec path or title filter and takes one validation slot. It reuses a site already serving that URL (background Astro, or the full stack when this checkout runs it), otherwise starts the static-site launcher (`apps/web/scripts/start-static-site-dev.mjs`) for the run and stops it afterwards. It never starts the stack; specs stub the Worker reads they need.
- The canonical committed IDE launcher is [BlackBox Local Stack](../.run/BlackBox%20Local%20Stack.run.xml), running `pnpm dev:stack:stripe-mock`. Preserve the separately requested Validate Fresh, OpenSpec Strict and Stripe Sandbox Smoke entries. Add no further committed IDE launchers without a user request.
- Keep the launcher working when environment variables, ports, checkout setup, migrations or seeds change. Wrangler supplies local D1; there is no separate D1 process.
- Normal startup applies pending migrations, seeds commerce only when empty, and preserves stock/prices. CMS bootstraps only when all collections are empty. Local D1/R2 persist under `apps/backend/.wrangler/state`. Restart retains the published snapshot without promoting drafts; local publication never dispatches hosted workflows.
- `pnpm dev:backend:mock` delegates to the backend package mock script. `pnpm dev:stack:uat-connected` connects Local frontend to UAT without copying hosted secrets. Provider diagnostics follow [Stripe UAT](stripe-sandbox-uat.md); normal acceptance starts locally.
- Secret names/templates are defined in [the backend template](../apps/backend/.dev.vars.example) and [README](../README.md). Run `pnpm checkout:preflight:stripe-test` before advanced real Stripe test mode. Browser public variables never carry runtime secrets.

## Content and data

- EmDash owns normal editorial work. [Content workspace](content-workspace.md) owns editing and preview; [content publication](content-publication.md) owns accepted snapshots. Repository content supports retained static builds and explicit migration/recovery, not parallel live editing.
- Collection schemas and public loaders meet in [content.config.ts](../apps/web/src/content.config.ts). Portable contracts belong to [content-model](../packages/content-model/src/index.ts); image processing stays in web. Content query helpers are in [site-data.ts](../apps/web/src/lib/site-data.ts).
- Editorial content must not acquire commerce controls or provider identifiers. Store categories are derived presentation views, not additional stock, offer, Stripe or D1 authority.
- EmDash calendar dates use validated `YYYY-MM-DD` strings. Apply [CMS application migrations](../apps/backend/cms-migrations/README.md) before native core migrations. Retain concurrent-save/delete protection until the existing race smoke passes without it.
- Persistence uses domain repository seams and Prisma/D1. Wrangler applies migrations through `COMMERCE_DB`; do not introduce `prisma migrate dev`, `prisma db push`, `prisma migrate deploy` or a runtime database URL. Preserve deployed migration history.
- Retain `COMMERCE_DB`, the `COMMERCE_RUNTIME` Durable Object binding and its migration. The [boundary spec](../openspec/specs/module-boundaries/spec.md) defines ownership; entrypoints and dependencies are declared in each module's `project.json` `metadata.boundaries`, and the [manifest](../openspec/specs/module-boundaries/module-boundaries.manifest.json) keeps workspace-package policy. Move callers directly instead of adding temporary compatibility facades.
- D1 owns stock and order state. StoreCart is browser convenience state behind [store-cart.ts](../apps/web/src/components/store/cart/store-cart.ts), using native localStorage for its current scope. [Checkout](../openspec/specs/commerce-checkout/spec.md) and [project language](../openspec/specs/project-language/spec.md) define payload and authority constraints.
- Hosted operator identity comes from verified Access JWT claims, not an email header. The Local bypass is loopback-only. [Commerce operations](commerce-operations.md) owns protected stock operations; [shipping](../openspec/specs/shipping-fulfillment/spec.md) owns Greece-only manual fulfillment.

## Public frontend

| Concern                      | Entry point                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Site/base configuration      | [astro.config.mjs](../apps/web/astro.config.mjs)                                                                                         |
| Layout, metadata and JSON-LD | [SiteLayout.astro](../apps/web/src/layouts/SiteLayout.astro)                                                                             |
| Persistent shell mounting    | [AppShell.astro](../apps/web/src/layouts/AppShell.astro)                                                                                 |
| Shell state/navigation       | [AppShellRoot.tsx](../apps/web/src/components/app-shell/AppShellRoot.tsx), [routing.ts](../apps/web/src/components/app-shell/routing.ts) |
| Overlay fragments            | [app-shell-overlay](../apps/web/src/pages/app-shell-overlay/)                                                                            |
| Styling and primitives       | [global.css](../apps/web/src/styles/global.css), [UI components](../apps/web/src/components/ui/)                                         |

- Keep the monochrome visual language unless the task changes it. Artist frames remain 3:4 with `object-fit: contain` over a blurred copy of the same photo (`.artist-photo-fill`), never black bars or a text scrim; names sit below the photo. Sources are ideally 1800 × 2400, at least 1200 × 1600, with headroom. Preserve the whole band photo.
- The shell owns player state, mobile navigation, scroll/focus resets and the transition veil. Page-local player state and body-swapping navigation require reconsidering persistence.
- The minimized player appears after iframe load and real embed interaction. Closing beforehand destroys the session; minimizing afterward retains it; Stop destroys it. The open modal owns one history entry at the page's own URL, so device and browser Back close it with these semantics without routing the page. Full reloads, new tabs and non-shell navigation cannot preserve third-party iframe playback.
- News remains routable but hidden from primary navigation. Releases are editorial; Store owns commerce browsing. Follow the [shell/player spec](../openspec/specs/app-shell-and-player/spec.md) and current Store specs for categories and legacy redirects.
- Store listings use the shell-mounted listing-price projection; item and checkout paths use authoritative offer reads. Keep prefetch changes deliberate.
- Local base-path defaults and hosted `/` differ. [Environment model](environment-model.md) and [catalog promotion](catalog-promotion.md) own target configuration. Pages serves public assets and the read gateway, without business routes, persistence or provider secrets.

## Graphify context

The Blackbox index includes archived OpenSpec changes, which broad architecture queries can select as starting points. Include the relevant Blackbox module or symbol names when already known to locate the current domain. The root AGENTS.md sets Blackbox's query budget; global instructions own truncation and evidence handling.

## Nx workspace

Nx `project.json` files define app and module roots, targets and task inputs. Framework roots include `web-pages`, `web-layouts` and `web-test-support`. Each module's `project.json` `metadata.boundaries` declares its public entrypoints and allowed dependencies; the boundary manifest keeps workspace-package policy. Nx's import graph describes actual dependencies, including declared Astro runtime edges; it does not grant architectural permission. Native Vitest projects derive test ownership from module locations and runtime suffixes. Root contract tests run as five cached groups, `workspace:test-agent`, `test-release`, `test-runner`, `test-boundaries` and `test-content`, each with declared inputs in the root `project.json`; `pnpm test:contracts` runs all five. `scripts/check-module-projects.mjs` checks test ownership (each root test in exactly one group), module cycles, source ownership and that no root task except `format` hashes documentation or OpenSpec change files (`architecture` may hash the agent guidance documents it checks); cross-module commerce integration tests live under `apps/web/test/commerce/`, and backend cross-module tests under `apps/backend/test/integration/<feature>/`; single-module backend tests sit beside their source.
