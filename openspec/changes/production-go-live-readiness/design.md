## Context

The repository now has a verified Holding Page, hosted Pages UAT/PRD, EmDash Content/Items/Stock/Orders in the combined CMS Worker, accepted-snapshot public rendering, and independent code/catalog/launch controls. Remaining launch work is current-account provider and operational proof, approved shopper wording, exact-code-and-content acceptance, and public-origin cutover. Sveltia and compiled repository catalog paths are retired.

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

The implemented `align-cloudflare-uat-and-release-promotion`, `replace-sveltia-with-emdash-operations` and `reliable-content-publication` changes supply the release/publication paths. Follow `docs/catalog-promotion.md`: select the reviewed full `artifact_commit_sha`, successful `candidate_run_id` and `confirm_code_promotion=true`; consume retained PRD renderer, Pages gateway/assets and combined CMS Worker artifacts without rebuilding. Refresh an expired or content-mismatched candidate through UAT. Main pushes authorize no PRD promotion. Existing evidence retains its original host/revision; changed code, content or configuration requires affected checks.

PRD editorial content comes from its own accepted immutable CMS snapshot; runtime catalog/stock/order data remains in PRD D1 with bound live provider identities. Items owns explicit catalog setup/publication and price commands. Normal releases neither generate compiled catalogs nor seed inventory. Repository recovery inputs are exceptional, reviewed migration tools. Never copy UAT drafts, snapshots, D1 rows, test Products/Prices, synthetic stock or acceptance status into PRD.

### Canonical origin changes atomically

Prepare final `ASTRO_SITE_URL`, renderer/CMS public-origin configuration, shopper email links, sitemap/metadata and assertions before approval. Keep accepted media and catalog/email image URLs reachable through the PRD technical origin while the apex serves Holding Page; inspect current snapshot/provider URLs rather than restoring retired catalog-generation overrides. Verify the paired release and accepted PRD snapshot through technical Pages and explicitly allowlist technical/apex checkout returns. After successful smoke, switch the apex to that verified gateway/runtime without changing code or content. The existing production Worker URL remains the browser API target.

### Stripe work is last

After the new Stripe account exists, test mode closes in this order: listing-price stabilization, checkout stock reservations, then paid-order delivery outbox. Live Products/Prices, Payment Method Configuration, webhook, secrets, D1 preparation, and deployment follow while shopper checkout remains closed.

All three corrections are implemented. Listing-price stabilization, checkout creation, reservations, outbox and atomic-stock corrections are already archived; preserve their dated evidence and its account limitations. Use one current UAT candidate and approved recipients for only missing or affected account/provider checks: listing prices, reservation/checkout, then paid reconciliation and delivery recovery. Do not reopen archives or repeat purchases for bookkeeping. Paid-reconciliation remains open for its declared account acceptance and closure.

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

The table above is historical failure evidence, not current implementation status. As of 2026-09-17, source config has PRD `*/5 * * * *` and UAT `*/15 * * * *`. Verify the existing deployed schedule and `CommerceRuntime` forwarding to the bounded leased processor; do not add another Cron or revert cadence to match the old proposal. Follow `docs/cloudflare-free-tier.md`, including measured operation budgets and source/generated CMS no-KV guards. Reuse UAT controlled transient-recovery evidence where applicable. Do not manufacture a PRD paid order or send an unapproved email; inspect real delivery only after live-smoke approval.

### Manual selling operations are a launch gate

The earlier gateway and route observations predate the VAT child's local implementation and the current `/terms/` delivery page; they are not the current feature inventory. Local monetary presentation now exists, while approved dispatch/returns/privacy content and hosted provider/operational acceptance remain incomplete. Local rendering does not establish business approval or launch readiness.

Use an owner-approved manual runbook covering paid/review/failed-delivery checks, Greek BOX NOW destination confirmation and shipment creation, a dispatch record that prevents duplicate fulfillment, Dashboard refunds, and explicit stock reconciliation after returns. Reuse protected order reads, current emails, and a minimal manual dispatch record; no shipping platform is required.

Record the selected separately charged delivery policy, who owns tax/receipt/invoice handling, and the exact checkout total expected. Configure and verify the approved model before launch; finish the bounded monetary implementation below before accepting this gate. Do not infer tax treatment, invent policy terms, or assume Stripe sends the receipt promised by the return page. Inventory existing public information, then publish the approved missing shipping timing/rates, return/refund process, contact, and privacy content in accessible storefront links. Verify against Stripe's [website checklist](https://docs.stripe.com/get-started/checklist/website); this is operational readiness, not a legal determination.

The bounded child [greek-vat-and-shipping-charges](../greek-vat-and-shipping-charges/proposal.md) owns the VAT/delivery monetary contract and fiscal handoff. On 2026-09-11 the owner selected the current Stripe account as seller/business authority, taxable VAT-inclusive existing prices, Stripe Tax and Stripe-connected fiscal/filing services. Greece-only manual BOX NOW remains €2.50 Small / €3.50 Medium gross once per order, using the child's protected flat-stack algorithm and measured item/package dimensions and weights; later changes preserve accepted amounts. This supersedes the earlier undecided seller/exemption and manual fiscal re-entry alternatives. Local monetary/packing work can proceed with synthetic fixtures while account verification, physical measurements and provider capability evidence remain acceptance gates. Reuse the child's UI/provider/order/fiscal evidence for tasks 2.7–2.9 and 3.8; a Stripe payment receipt alone is not fiscal/myDATA/remittance proof. There is no separate launch approval or planning authorization to configure live providers.

The bounded child [complete-shopper-purchase-information](../complete-shopper-purchase-information/proposal.md) owns the remaining public content and its placement. Task 2.7 accepts its publication evidence; VAT task 4.4 supplies policy inputs and checks consistency against the same evidence. Neither child must wait for the other's archival to exchange evidence, and the parent retains final launch acceptance.

### Production controls remain independent

Live catalog mutation requires the one-run `confirm_live_catalog_changes` workflow input or direct CLI `--confirm-live-catalog-changes`. Shopper launch requires `PRD_LAUNCH_APPROVED=true`. Runtime checkout also requires `native_checkout_enabled=true`. Catalog preparation cannot set either checkout control.

### Delivery remains Greece-only

`GR` is the complete supported delivery-country set. No non-Greece provider, quote, or fallback path is introduced.

### Code and content acceptance are recorded separately

Record the exact application commit/candidate run and PRD accepted snapshot identity/digest together. Publishing content does not rebuild code; source SHA alone cannot prove approved wording or artwork. Recheck affected surfaces after either identity changes. Reuse completed EmDash/runtime-publication evidence from `docs/cms-cutover.md` and `docs/content-publication.md`; close actual outstanding editor-safety/publication-status acceptance before launch. Code rollback promotes a compatible candidate preserving the content pointer; content rollback selects a verified accepted snapshot. An old static artifact is not a content rollback.

Orders and Store search are complete. Remaining paid-account/VAT/purchase-wording acceptance can proceed in parallel with listening and unresolved Distro photography; shared template changes integrate with the implemented purchase hierarchy. Listening and comprehensive photo enrichment are not newly invented payment-launch gates. New request-idempotency work remains in its own ticket; assess its findings for launch relevance without duplicating implementation here.

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
3. Reuse implemented correction/archive evidence and fix only concrete regressions found on the launch candidate; account access is not a prerequisite for local corrections.
4. Obtain the new Stripe account, approved secret-store credentials, and approved UAT recipients; close shared provider evidence in the declared order.
5. Prepare live Stripe, PRD D1, Worker bindings, Access, Cron, email, catalog, approved shopper policies, and the manual operating handoff while checkout remains closed.
6. Run deterministic Prisma/API generation where applicable, `pnpm validate`, `pnpm validate:editor`, relevant Local publication checks, strict OpenSpec validation and Browser Use against the exact code and accepted content snapshot. No routine compiled catalog generation or stock seeding.
7. Set the runtime feature flag true while launch approval remains absent and prove checkout stays closed.
8. After explicit user approval, set `PRD_LAUNCH_APPROVED=true`, run one bounded live checkout smoke, and cut over the public apex only on success.
9. Keep the Holding Page rollback target for at least 24 hours, then retire holding-only dependencies and archive this change after accepted stability.

## Open Questions

Account configuration evidence, approved recipients, measured packing, fiscal-provider coverage, named operating owners and approved policy wording remain external execution inputs. The existing taxable-inclusive and €2.50/€3.50 shipping decisions are settled; verify their implementation and provider coverage rather than reopening them. No missing acceptance is assumed complete. Independent listening and media work need not wait for these inputs.
