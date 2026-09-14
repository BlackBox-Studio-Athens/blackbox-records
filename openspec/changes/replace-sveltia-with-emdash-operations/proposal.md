## Why

Label members currently cross a Git-backed editor, Stripe Dashboard, and a separate staff portal; catalog changes also regenerate backend build inputs. That makes ordinary content, price, and stock work depend on software release machinery.

Use self-hosted EmDash for editorial CMS functionality and extend the working staff workspace for commerce actions. Keep the existing Stripe Checkout, stock ledger, order handling, and public Astro experience. The target is a small, low-traffic system operated from one place, not a new general-purpose CMS or commerce platform.

## What Changes

- **BREAKING:** Replace Sveltia/Git content writes with EmDash-managed editorial content in a dedicated D1 database and media in R2. Use supported EmDash APIs from the BlackBox-owned staff UI; its built-in admin is not the normal member workspace.
- **BREAKING:** Separate Content Publication from Software Release. Publishing uses the environment's deployed, approved code revision and a consistent published-content snapshot, without committing content or deploying a Worker.
- **BREAKING:** Replace the generated catalog compiled into the backend with persisted runtime catalog records in `COMMERCE_DB`. Existing Stripe Product bindings and Product default Prices remain authoritative; stock and orders remain in their existing D1 model.
- Combine CMS, stock, orders, and price/item commands behind one Cloudflare Access login and one backend Worker deployment per Product Environment. Serve the existing staff build from that Worker; retain the separate static public Pages application.
- Add one guided item-creation flow for label releases, distro, and merch. Generate stable identities, default to one variant and EUR, and support opening physical/online stock without repeated seeding. Preserve fixed and pay-what-you-want price behavior.
- Add staff price changes through validated Stripe commands and reuse existing stock adjustment/count and order operations. Generic CMS CRUD cannot mutate commerce authority.
- Make `pnpm dev` run the existing canonical mock stack, including CMS and staff. Preserve the WebStorm launcher, fixed ports, real-Stripe diagnostic options, and secret-free normal development.
- Add migration reconciliation, private backups, restore proof, and cutover/rollback instructions before removing old writable paths.

## Capabilities

### New Capabilities

- `emdash-editorial-operations`: Self-hosted CMS, custom staff editing, single identity, migration, and recoverable content/media ownership.
- `content-publishing`: Revision-bound publication independent of code release, draft isolation, publish status, and stale-deployment prevention.
- `staff-item-management`: Guided item creation and retry-safe staff price commands using existing commerce authority.

### Modified Capabilities

- `sveltia-editorial-operations`: Retire the old editor, Git authentication, configuration, and previews after verified cutover.
- `stripe-catalog-sync`: Runtime catalog records replace compiled manifests and inventory-source gating while preserving bound-Product/default-Price reconciliation.
- `stripe-catalog-field-ownership`: EmDash owns editorial fields; Stripe still owns selling prices; protected application commands connect the staff UI to commerce.
- `catalog-promotion-automation`: Remove routine catalog generation/provider synchronization from software deployment.
- `software-release-promotion`: Bind candidate artifacts to content revisions and refresh stale PRD content without changing the reviewed code SHA.
- `static-site-and-deployment`: Staff assets ship with the combined Worker; public Pages remains static and can publish content separately.
- `environment-model`: Isolate CMS databases, media, and staff identities across UAT and PRD.
- `module-boundaries`: Define CMS/runtime catalog ownership and supported public/internal entrypoints without cross-app source imports.
- `site-images`: Move editorial media authority to EmDash/R2 while preserving Astro image delivery and public URL compatibility.
- `project-language`: Define Content Publication and Item Setup without changing Store Item, Release, Stock, or Price Authority meanings.
- `tooling-validation`: One normal local command; replace Sveltia/generated-catalog checks with CMS, runtime catalog, publication, and migration checks.

## Impact

Prevent recurrence of the KV PUT exhaustion incident through a build guard against CMS KV bindings and the [Free-tier operating rule](../../../docs/cloudflare-free-tier.md): local rehearsal, measured bounded pilots, account-wide operation budgets, and stopping affected bulk work on quota alerts. Future quota-consuming resources require a documented reason and budget.

Depends on `align-cloudflare-uat-and-release-promotion` for hosted acceptance. Primary surfaces are `apps/backend`, `apps/staff`, `apps/web/src/content.config.ts`, `apps/web/src/lib/site-data.ts`, storefront catalog readers, `packages/api-client`, catalog/local-stack scripts, and release workflows. Keep Prisma and the existing commerce application/repository seams; EmDash owns its own CMS schema and migrations.

The first implementation checkpoint must prove the pinned EmDash/Astro/Cloudflare combination supports headless editing, Access authentication, the combined Worker, and the actual free-tier resource budget. The user authorized the minimum necessary integration fixes on 2026-09-12: a small version-pinned dependency patch may correct the reproduced stale-revision bug, with a runnable regression and removal on an upstream fix. Do not maintain a separate CMS fork, weaken conflict checks, remove working functionality, or silently select a paid plan if that checkpoint fails.

This change supersedes only the Sveltia, compiled-catalog, separate-staff-deployment, and coupled-publication assumptions in earlier work. Preserve completed order workspace/catalog fixes and coordinate unfinished paid-order, VAT/shipping, purchase-information, distro enrichment, and go-live changes without claiming their acceptance. Reconcile completed changes with baseline specs before applying overlapping deltas.

No shopper accounts, new payment engine, Stripe Connect, BOX NOW automation, dynamic public-site rewrite, plugin marketplace, AI features, or general workflow framework. Git-backed editorial history ends at cutover; backups must replace it. Free hosting is a measured acceptance goal, not a guarantee inferred from low traffic.

Recommended implementer: Astra medium for each ordered task section, with a handoff checkpoint after each section. Do not run the migration phases as independent parallel rewrites.
