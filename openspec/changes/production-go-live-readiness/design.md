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

Freeze source/configuration changes, including final-origin settings, before selecting the accepted launch commit and building its artifacts. Record environment values and deployment identifiers alongside that SHA. Final launch checks target those artifacts; historical prerequisite evidence retains its original source SHA. Rerun affected checks after source, generated artifact, or configuration changes; evidence notes and OpenSpec archival alone do not invalidate unchanged runtime proof.

### UAT and PRD data stay isolated

PRD is prepared from repository-owned content and generated catalog artifacts. UAT D1 rows, Stripe test-mode Products/Prices, synthetic stock, and UAT smoke evidence are never copied or treated as PRD data.

### Canonical origin changes atomically

Prepare final `ASTRO_SITE_URL`, Sveltia `site_url`, shopper-facing email links, sitemap/metadata, and assertions before approval. Keep catalog and email image URLs on the reachable PRD technical asset host through cutover; changing the site's canonical identity does not require migrating its asset host. Pin the existing `PRD_CATALOG_ASSET_SITE_URL` override so an apex `ASTRO_SITE_URL` does not silently retarget generated Product images while the apex still serves Holding Page. Verify the artifact through the technical Pages origin and explicitly allowlist technical and apex checkout returns for smoke and public use. After successful smoke, switch the apex to that verified artifact and check public routing, without code or generated-asset changes. The existing production Worker URL remains the browser API target.

### Stripe work is last

After the new Stripe account exists, test mode closes in this order: listing-price stabilization, checkout stock reservations, then paid-order delivery outbox. Live Products/Prices, Payment Method Configuration, webhook, secrets, D1 preparation, and deployment follow while shopper checkout remains closed.

Implement all three corrections locally before provider acceptance. Use one corrected UAT code commit and approved recipients to prove listing prices, then reservation/checkout behavior, then delivery recovery. Reference the same scenario evidence from overlapping child tasks; do not repeat purchases or full checks solely for another checklist. Sync/archive provider-dependent checkout-creation work, reservations, outbox, and paid-reconciliation after their respective evidence passes. Archival paperwork does not block shared UAT execution, and all changes must close before launch.

The staff portal is PRD-only; no UAT staff hostname is provisioned. On 2026-09-09 the user approved accepting and archiving `make-operator-stock-writes-atomic` from real local D1 race/rollback tests, local native browser flows, and repository gates. Its protected PRD adjustment/recount/conflict, retained-input, reassessment, audit, and Access allow/deny proof remains launch task 4.9 after PRD migration and matching Worker/staff deployment with checkout closed. Use approved real-stock operations, preserve audit history, and do not seed synthetic production sales or stock. Local archival does not satisfy this launch gate.

### Readiness review coverage and sanity recheck

The 2026-09-09 review was rechecked against the current main worktree at HEAD `4423fbd0b8a8b4d1f1638207095fe18966d79955`, including pre-existing unrelated edits. Eleven local probe assertions reproduced the six code findings again. These are failure reproductions, not regression passes or provider acceptance. Each child design records source locations, concrete triggers, and verification limits.

| Review finding                                | Owning OpenSpec work                | Recheck conclusion                                                                                                                                                                                    |
| --------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Billing details used for shipment          | `fix-paid-order-reconciliation`     | Actual mapper/fulfillment probe selects billing; valid Greek delivery with GB billing fails.                                                                                                          |
| 2. Expiry below provider minimum              | `fix-stripe-checkout-creation`      | Two seconds elapsed produces 1,798 seconds; documented-contract risk confirmed, real Stripe rejection untested.                                                                                       |
| 3. Incompatible pay-what-you-want carts       | `fix-stripe-checkout-creation`      | Mixed cart and quantity two reach gateway creation; current Stripe documentation forbids both.                                                                                                        |
| 4. Failed paid reconciliation acknowledged    | `fix-paid-order-reconciliation`     | Missing-order and stock-shortage outcomes return success without durable completion/recovery. Use retryable failure or existing terminal review as appropriate.                                       |
| 5. Concurrent sale overwritten by stock write | `make-operator-stock-writes-atomic` | Deterministic real-use-case/adapter interleaving ends at two instead of one; D1 race/rollback proof is required during implementation.                                                                |
| 6. Premature final order confirmation         | `fix-paid-order-reconciliation`     | Null, pending, and review order statuses all show recorded-order success.                                                                                                                             |
| 7. No committed PRD retry schedule            | This change, tasks 4.5 and 4.8      | `apps/backend/wrangler.jsonc` has UAT `*/15 * * * *` at lines 133-135; PRD lines 156-193 have no triggers. Remote schedule was not inspected. Already planned configuration, now explicit acceptance. |

Do not create another delivery scheduler or outbox change. Add the PRD 15-minute Cron to the existing environment configuration and verify the deployed handler drains due rows through the existing five-row, leased, bounded delivery processor. Prove controlled transient recovery with approved test recipients in UAT; verify PRD scheduled invocation/bindings while checkout remains closed. Do not manufacture a production paid order or send an unapproved email to test Cron. After the separately authorized live smoke, inspect its actual delivery state.

### Manual selling operations are a launch gate

The gateway recheck confirms no separate shipping rate, automatic-tax option, or invoice-creation option in Session creation. A scoped route search again found no dedicated shipping/returns/refund/privacy/terms page. These observations do not establish that shipping must be charged, automation is necessary, or all policy content is absent. They establish decisions and shopper-visible evidence that cannot be assumed complete.

Use an owner-approved manual runbook covering paid/review/failed-delivery checks, Greek BOX NOW destination confirmation and shipment creation, a dispatch record that prevents duplicate fulfillment, Dashboard refunds, and explicit stock reconciliation after returns. Reuse protected order reads, current emails, and a minimal manual dispatch record; no shipping platform is required.

Record whether delivery is included or separately charged, who owns tax/receipt/invoice handling, and the exact checkout total expected. Configure and verify the approved model before launch; if it requires new monetary behavior, finish a bounded implementation/spec update before accepting this gate. Do not infer tax treatment, invent policy terms, or assume Stripe sends the receipt promised by the return page. Inventory existing public information, then publish the approved missing shipping timing/rates, return/refund process, contact, and privacy content in accessible storefront links. Verify against Stripe's [website checklist](https://docs.stripe.com/get-started/checklist/website); this is operational readiness, not a legal determination.

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
3. Implement and locally validate the three correction changes; account access is not a prerequisite for this work.
4. Obtain the new Stripe account, approved secret-store credentials, and approved UAT recipients; close shared provider evidence in the declared order.
5. Prepare live Stripe, PRD D1, Worker bindings, Access, Cron, email, catalog, approved shopper policies, and the manual operating handoff while checkout remains closed.
6. Run deterministic generation, full repository gates, strict OpenSpec validation, and Browser Use against the exact tree.
7. Set the runtime feature flag true while launch approval remains absent and prove checkout stays closed.
8. After explicit user approval, set `PRD_LAUNCH_APPROVED=true`, run one bounded live checkout smoke, and cut over the public apex only on success.
9. Keep the Holding Page rollback target for at least 24 hours, then retire holding-only dependencies and archive this change after accepted stability.

## Open Questions

Account identifiers, credentials, approved recipients, shipping-charge treatment, tax/receipt/invoice ownership, and policy wording are external execution inputs. The gate is fixed: none can be assumed complete and any required monetary implementation must finish before launch approval. These inputs do not block preparing the verified code corrections.
