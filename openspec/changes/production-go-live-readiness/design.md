## Context

The repository now has a verified production Holding Page, aligned Local/UAT/PRD environments, accepted Sveltia editing, protected operator APIs, and separate controls for catalog preparation, launch approval, and runtime checkout. Remaining launch work spans new-account Stripe proof, PRD-only data preparation, exact-tree acceptance, and an atomic public-origin cutover.

The public apex must not imply readiness before those gates close. UAT data and Stripe test-mode objects are evidence only, not production seed material.

## Goals / Non-Goals

**Goals:**

- Preserve one auditable Stripe-last launch sequence.
- Make one exact commit SHA own all launch artifacts and evidence.
- Keep catalog preparation, launch approval, and runtime checkout independently controllable.
- Keep the Holding Page available as immediate rollback through a minimum 24-hour stability window.
- Make invalid launch combinations fail closed.

**Non-Goals:**

- Copying UAT D1 rows, Stripe test objects, synthetic stock, or UAT evidence into PRD.
- Introducing pagination, virtualization, request batching, static listing prices, or new frontend dependencies without a separately approved design.
- Changing the production Worker browser API hostname without separate approval.
- Expanding delivery beyond Greece.

## Decisions

### Public apex remains on Holding Page until final approval

`https://blackboxrecordsathens.com/` continues serving the verified Holding Page until every exact-tree gate passes and the user gives the sole final go/no-go approval. The holding branch remains the immediate rollback target through the stability window.

### One exact commit owns launch

One accepted commit SHA identifies the static build, Worker code and configuration, generated catalog artifacts, migrations, tests, performance evidence, browser evidence, provider preparation, launch approval, and cutover. A change to an affected surface invalidates the corresponding evidence and requires rerunning it.

### UAT and PRD data stay isolated

PRD is prepared from repository-owned content and generated catalog artifacts. UAT D1 rows, Stripe test-mode Products/Prices, synthetic stock, and UAT smoke evidence are never copied or treated as PRD data.

### Canonical origin changes atomically

At cutover, `ASTRO_SITE_URL`, generated Sveltia `site_url`, checkout return origins, email brand URLs, catalog asset origins, sitemap/metadata, and affected assertions move together to `https://blackboxrecordsathens.com/`. `https://blackbox-records-web.pages.dev` remains the underlying technical Pages origin. The existing production Worker URL remains the browser API target unless a separately approved public API hostname already exists.

### Stripe work is last

After the new Stripe account exists, test mode closes in this order: listing-price stabilization, checkout stock reservations, then paid-order delivery outbox. Live Products/Prices, Payment Method Configuration, webhook, secrets, D1 preparation, and deployment follow while shopper checkout remains closed.

### Production controls remain independent

Live catalog mutation requires the one-run `confirm_live_catalog_changes` workflow input or direct CLI `--confirm-live-catalog-changes`. Shopper launch requires `PRD_LAUNCH_APPROVED=true`. Runtime checkout also requires `native_checkout_enabled=true`. Catalog preparation cannot set either checkout control.

### Delivery remains Greece-only

`GR` is the complete supported delivery-country set. No non-Greece provider, quote, or fallback path is introduced.

### Evidence uses one canonical location

Raw performance output is stored under ignored `.codex-artifacts/runtime-performance/<commit>/`. Concise accepted results are appended to this change's `README.md`. Browser Use is the rendering authority; DevTools is used only for trace categories or throttling Browser Use cannot provide.

### User is sole final approver

No other reviewer or automated result can create launch approval. After all preparation and exact-tree checks pass, the user gives the sole final go/no-go decision.

## Risks / Trade-offs

- **Accepted commit changes late:** affected evidence must be rerun. This costs time but prevents mixed-tree approval.
- **Origin drift:** atomic origin updates and scoped stale-origin searches reduce partial-cutover risk.
- **Provider configuration succeeds while checkout is closed:** capability and checkout rejection checks prove preparation did not authorize launch.
- **Live smoke fails:** disable `native_checkout_enabled`, remove launch approval if needed, and keep or restore the apex Holding Page.
- **Measured Store regression:** create one bounded child change for the measured cause; avoid speculative architecture.

## Migration Plan

1. Record completed prerequisite archives and accepted evidence.
2. Remeasure Store performance on one exact production build; record no action or close one bounded child.
3. Obtain the new Stripe account, approved secret-store credentials, and approved UAT delivery recipients.
4. Close listing-price, reservation, and delivery-outbox changes in new-account test mode.
5. Prepare live Stripe, PRD D1, Worker bindings, Access, Cron, email, and catalog while checkout remains closed.
6. Run deterministic generation, full repository gates, strict OpenSpec validation, and Browser Use against the exact tree.
7. Set the runtime feature flag true while launch approval remains absent and prove checkout stays closed.
8. After explicit user approval, set `PRD_LAUNCH_APPROVED=true`, run one bounded live checkout smoke, and cut over the public apex only on success.
9. Keep the Holding Page rollback target for at least 24 hours, then retire holding-only dependencies and archive this change after accepted stability.

## Open Questions

None. Account-specific identifiers and credentials remain external inputs supplied through approved secret stores.
