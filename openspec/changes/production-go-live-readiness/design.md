## Context

**9 October 2026 selected collection behavior:** the latest owner instruction chooses explicit `NO_TAX_COLLECTED` for new agreements under the existing natural-person seller, with unchanged gross prices and no exemption/registration/compliance claim. Consume the VAT child's immutable policy/reconciliation/disclosure implementation and affected sandbox proof. Positive VAT is no longer a prerequisite for this explicitly selected mode; actual zero provider collection, gross totals, receipts, stock/outbox integrity and truthful identity remain requirements. Tax/accountant/fiscal follow-up remains deferred. This supersedes earlier taxed-only language below and changes no launch, publication or live-payment authority.

The repository now has a verified Holding Page, hosted Pages UAT/PRD, EmDash Content/Items/Stock/Orders in the combined CMS Worker, accepted-snapshot public rendering, and independent code/catalog/launch controls. Remaining launch work is current-account provider and operational proof, approved shopper wording, exact-code-and-content acceptance, and public-origin cutover. Sveltia and compiled repository catalog paths are retired.

The public apex must not imply readiness before those gates close. UAT data and Stripe test-mode objects are evidence only, not production seed material.

## Goals / Non-Goals

**Goals:**

- Preserve one auditable account-migration and launch sequence.
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

### Current execution disposition — 2026-10-09

The [accepted execution disposition](README.md#accepted-execution-disposition--2026-10-09) controls the sequence below: existing owner authorization remains in force, subject to accepted technical readiness and the current UAT provider-proof handoff. Sandbox-paid plus genuine LIVE unpaid application Session inspection/expiry is the accepted launch proof exception. Earlier references to a new final decision or successful live purchase/refund are superseded by that disposition. Live charge/refund receipt emails, settlement, physical dispatch and 24-hour stability remain unobserved. Keep `PRD_AVAILABILITY_ALERTS_APPROVED` absent or false until separate explicit subscriber-send authorization.

### Public apex remains on Holding Page until final approval

`https://blackboxrecordsathens.com/` continues serving the verified Holding Page until every exact-tree gate and the recorded authorization's provider-proof conditions pass. The holding branch remains the immediate rollback target through the stability window.

### Current selling scope follows technical readiness

The owner's [2026-10-08 decision](../migrate-stripe-to-blackboxrecords/evidence.md#owner-decisions--2026-10-08) requests unrestricted selling after actual technical readiness and supersedes the 2026-10-06 restricted beta. No participant list, order cap, end date or cohort/access implementation is required. The necessary operating owner is attested privately. Keep checkout closed and the apex on Holding Page during preparation; the recorded activation authorization remains conditional on technical and accepted provider proof. This planning revision performs no activation.

Ordinary receipts, truthful identity, selected collection behavior, stock/order/webhook integrity and recovery retain source-bound acceptance limits. Final owner authority applies the shared assumed profile to all validated PRD variants and one order fee of €3 for 1–4 validated cart units, €6 for 5–8 or €10 for 9 or more. New `manual` classification preserves legacy Small/Medium/null meanings while actual parcel selection/splitting removes the old nineteen-unit order ceiling. Stock/cart/price/configuration guards and historical agreements remain. New release/content/provider proof is pending, including one >19-unit UAT paid order/readback at flat €10 delivery, followed by UAT closure and PRD promotion. The researched two/six-unit parcel formula is discarded as the desired implementation. Tax/fiscal/IRIS evidence stays deferred and measurements Unknown.

The existing Notify me delivery schedule requires `PRD_AVAILABILITY_ALERTS_APPROVED=true` alongside the existing launch and runtime checkout controls for PRD alerts. This optional Worker input defaults off when absent, false or invalid; keep it absent or false throughout closed preparation and keep it absent or false until separate explicit subscriber-send authorization. Deploy and verify the guard before PRD rebinding. A zero alert-drain limit suppresses claims and send-budget changes while retaining the existing cleanup policy; paid-order delivery and estimate notices keep running first. Local and UAT alert delivery remain unchanged; use the existing UAT sink for delivery proof. No separate scheduler or cohort alert system is needed.

### One exact commit owns launch

Freeze source/configuration changes, including final-origin settings, before selecting the accepted launch commit and building its artifacts. Record environment values and deployment identifiers alongside that SHA. Final launch checks target those artifacts; historical prerequisite evidence retains its original source SHA. Rerun affected checks after source, generated artifact, or configuration changes; evidence notes and OpenSpec archival alone do not invalidate unchanged runtime proof.

### UAT and PRD data stay isolated

Follow the current [release runbook](../../../docs/catalog-promotion.md), including archived `simplify-software-release`: `gh workflow run promote-prd.yml` takes no inputs, verifies the successful push run UAT serves and rebuilds PRD content-free from that SHA. To promote different code, push it first. Main pushes authorize no PRD promotion. Provider smoke runs separately through `uat-smoke.yml` or the existing commands; promotion neither runs it nor installs Stripe credentials. Existing evidence retains its original host/revision; changed code, content or configuration requires affected checks.

PRD editorial content comes from its own accepted immutable CMS snapshot; runtime catalog/stock/order data remains in PRD D1 with bound live provider identities. Items owns explicit catalog setup/publication and price commands. Normal releases neither generate compiled catalogs nor seed inventory. Repository recovery inputs are exceptional, reviewed migration tools. Never copy UAT drafts, snapshots, D1 rows, test Products/Prices, synthetic stock or acceptance status into PRD.

### Canonical origin changes atomically

During closed preparation, verify purchase/return, policy and customer-email links through the technical PRD origin while the apex serves Holding Page. Stage final apex-origin settings for the requested public scope before candidate acceptance and live smoke.

For full public launch, prepare final `ASTRO_SITE_URL`, renderer/CMS public-origin configuration, shopper email links, sitemap/metadata and assertions before approval. Keep accepted media and catalog/email image URLs reachable through the PRD technical origin; inspect current snapshot/provider URLs rather than restoring retired catalog-generation overrides. Verify the paired release and accepted PRD snapshot through technical Pages and explicitly allowlist technical/apex checkout returns. After accepted provider proof under the recorded exception, switch the apex to that verified gateway/runtime without changing code or content. The existing production Worker URL remains the browser API target.

### Destination Stripe acceptance precedes live preparation

[migrate-stripe-to-blackboxrecords](../migrate-stripe-to-blackboxrecords/design.md) owns the existing destination account map, seller resolution, account setup and catalog/configuration cutover. Consume its shared destination UAT proof for listing prices, checkout/reservations and paid-order delivery, then its closed-PRD handoff. The checklists here are launch acceptance views of that work, not a second migration. Seller-neutral tooling and provisional UAT preparation can run alongside physical/fiscal/content work.

All three corrections are implemented. Listing-price stabilization, checkout creation, reservations, outbox, atomic-stock and paid-reconciliation corrections are archived; preserve their dated evidence and account limitations, including unresolved proof recorded in the paid-reconciliation archive. Use one current UAT candidate and approved recipients for only missing or affected account/provider checks: listing prices, reservation/checkout, then paid reconciliation and delivery recovery. Do not reopen/rearchive corrections or repeat purchases for bookkeeping; current designated-account acceptance remains with the shared migration and launch tasks.

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

The bounded child [greek-vat-and-shipping-charges](../greek-vat-and-shipping-charges/proposal.md) owns the VAT/delivery monetary contract and fiscal handoff. The current `NO_TAX_COLLECTED` mode preserves gross item prices without collected tax; VAT-inclusive/Stripe Tax and fiscal-provider work remain later follow-up; the migration supplies seller inputs. Final Greece-only manual BOX NOW delivery is one €3/€6/€10 order fee for 1–4/5–8/9+ validated cart units, independent of actual parcel count and without the old nineteen-unit single-parcel order ceiling. Preserve historical agreements and reuse unchanged child UI/provider/order proof for tasks 2.7–2.9 and 3.8; new-tariff proof remains separate. Tax/fiscal evidence follows the current uncapped-scope deferral; ordinary payment receipts establish no fiscal/myDATA/remittance acceptance. This parent retains provider-proof acceptance and the authorized activation sequence.

The bounded child [complete-shopper-purchase-information](../complete-shopper-purchase-information/proposal.md) owns the remaining public content and its placement. Task 2.7 accepts its publication evidence; VAT task 4.4 supplies policy inputs and checks consistency against the same evidence. Neither child must wait for the other's archival to exchange evidence, and the parent retains final launch acceptance.

### Production controls remain independent

Live catalog mutation requires the migration operator command's one-run, false-by-default confirmation; the release workflow's former `confirm_live_catalog_changes` input is removed. Shopper launch requires `PRD_LAUNCH_APPROVED=true`. Runtime checkout also requires `native_checkout_enabled=true`. Catalog preparation cannot set either checkout control.

The selling candidate removes the temporary checkout-disabled promotion assertion in `scripts/release-candidate.mjs` and updates its test. Preserve candidate provenance, monotonic release order and the two independent checkout controls. Verify code can still be promoted after activation without a release enabling or disabling checkout. Preparation continues to require closed checkout until final approval.

### Delivery remains Greece-only

`GR` is the complete supported delivery-country set. No non-Greece provider, quote, or fallback path is introduced.

### Code and content acceptance are recorded separately

Record the exact application commit/candidate run and PRD accepted snapshot identity/digest together. Publishing content does not rebuild code; source SHA alone cannot prove approved wording or artwork. Recheck affected surfaces after either identity changes. Reuse completed EmDash/runtime-publication evidence from `docs/cms-cutover.md` and `docs/content-publication.md`; close actual outstanding editor-safety/publication-status acceptance before launch. Routine code rollback uses revert, push and promotion. Emergency rollback pairs the renderer and Pages deployments from the same run; roll back the CMS Worker only when no migration intervened. Preserve the content pointer and commerce history; content rollback separately selects a verified accepted snapshot.

Orders and Store search are complete. Remaining paid-account/VAT/purchase-wording acceptance can proceed in parallel with listening and unresolved Distro photography; shared template changes integrate with the implemented purchase hierarchy. Listening and comprehensive photo enrichment are not newly invented payment-launch gates. New request-idempotency work remains in its own ticket; assess its findings for launch relevance without duplicating implementation here.

### Evidence uses one canonical location

Raw performance output is stored under ignored `.codex-artifacts/runtime-performance/<commit>/`. Concise accepted results are appended to this change's `README.md`. Browser Use is the rendering authority; DevTools is used only for trace categories or throttling Browser Use cannot provide.

### User is sole final approver

No other reviewer or automated result can create launch approval. The recorded user authorization permits execution after its technical and provider-proof conditions pass; no new final approval round is required.

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
4. Accept the migration's designated-account setup and shared UAT evidence with approved recipients; close only missing or affected provider checks.
5. Prepare live Stripe, PRD D1, Worker bindings, Access, Cron, email, catalog, approved shopper policies, and the manual operating handoff while checkout remains closed.
6. Run `pnpm validate`, affected generation/publication checks, strict OpenSpec validation and browser acceptance against the selected code and PRD snapshot. Reuse that candidate's passing CI end-to-end and Chromium/Firefox staff-preview suites; local whole-project suites require a maintainer grant. No routine compiled catalog generation or stock seeding.
7. Set the runtime feature flag true while launch approval remains absent and prove checkout stays closed.
8. After accepted technical readiness, UAT provider proof and PRD code/content checks, execute the recorded conditional activation sequence. Accept sandbox-paid plus genuine LIVE unpaid application Session inspection/expiry proof before apex cutover; actual live payment/refund receipt delivery and settlement remain unobserved.
9. Keep the Holding Page rollback target for at least 24 hours, then retire holding-only dependencies and archive this change after accepted stability.

## Open Questions

Remaining concrete execution work includes source drain/signing rollback, coherent destination credentials/configuration, apply/restore and signed replay, PRD schema/release/origin checks, executable assumed-profile assignments/reference, provider tax behavior, approved policy wording/publication and purchase/refund/receipt smoke. Seller/bank/operating inputs are attested; return address and support email are approved public draft facts. Tax evidence and fiscal automation remain deferred, and real measurements remain Unknown. These are not blanket blockers for unrelated implementation or new requests for owner facts. Independent listening and media work can continue.
