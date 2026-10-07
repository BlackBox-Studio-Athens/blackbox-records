# Design

## Context

See [proposal.md](proposal.md) for scope and [evidence.md](evidence.md) for dated observations. The shop is not live. Stripe owns payment objects and prices; D1 owns current catalog links, stock and order history. The Worker has one Stripe key and one webhook signing secret per environment, so the switch uses a short maintenance window.

## Goals / Non-Goals

**Goals:** A technically verified destination account with ordinary receipts, preserved commerce data, repeatable cutover and a restricted paid-beta handoff.

**Non-Goals:** New payment behavior, catalog reseeding, speculative customer transfer or dual-account infrastructure. IRIS remains deferred; the owner's risk acceptance is recorded in evidence.

## Decisions

### 1. Pin account scope and seller authority

| Environment | Source suffix | Destination             | Destination suffix |
| ----------- | ------------- | ----------------------- | ------------------ |
| UAT         | `AFb7Ub`      | BlackBoxRecords sandbox | `PfsVCp`           |
| PRD         | `dyR3DM`      | BlackBoxRecords live    | `GRpxub`           |

Keep full IDs privately. Assert account and mode at each command/run and credential switch. The live account's shared test mode also ends `GRpxub`; it is not UAT. Local mock remains independent; Local `uat-connected` follows the deployed UAT Worker. Preserve unrelated sandbox data.

The owner intends to use BlackBoxRecords temporarily, then switch to an official account. Before beta configuration, record the actual seller, stock rights, payout beneficiary and customer-facing identity; account information must truthfully describe that seller. This decision does not establish that the current holder's Greek business/fiscal status is compliant. If a different seller must use this account, obtain Stripe's permitted changes and reverify capabilities using its [account-transfer guidance](https://support.stripe.com/questions/transfer-a-stripe-account-to-a-different-entity-due-to-a-business-sale-or-acquisition?locale=en-GB). A failed route requires an owner decision, never an automatic seller substitution. Keep private identity evidence outside Git.

### 2. Configure the existing checkout contract

For each destination, verify account capability, Tax origin/registration, explicit inclusive EUR Prices, product code `txcd_99999999`, shipping code `txcd_92010001`, and a dedicated allowed-method `BlackBox merch checkout` PMC. UAT may use approved test configuration; production uses the accepted seller's facts.

Configure website, branding, support/sender/reply details, descriptor and hosted return/terms/privacy links. In **Business → Customer emails**, enable **Successful payments** and **Refunds** on destination live before beta activation; configure the dedicated sandbox separately. Verify the Checkout email reaches the payment, receipt seller/contact/currency/amount details are correct, and receipts can be viewed online/downloaded. Use approved recipients and manual test receipts where needed: test mode does not prove automatic live delivery. Verify live payment and refund receipt delivery during the authorized beta smoke.

Ordinary Stripe receipts are independent of Greek Fiscal Documents/myDATA and remain required for beta. Do not enable paid `invoice_creation` or install a fiscal connector merely to obtain payment receipts. Preserve the existing order-confirmation email with truthful wording; it must not claim unverified fiscal issuance. See [Stripe receipts](https://docs.stripe.com/receipts) and the [receipt obligation](https://stripe.com/en-gr/legal/ssa-service-terms).

Verify effective Sessions retain Greece-only shipping, `adaptive_pricing.enabled=false`, disabled promotion codes and disabled tax-ID collection. Ordinary Stripe-hosted Checkout needs no added embedded-wallet integration; test allowed wallets on eligible devices.

| Store                                                                         | Values                                                                                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Worker, per environment                                                       | `STRIPE_SECRET_KEY`, `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_WEBHOOK_SECRET`        |
| Matching GitHub `catalog-promotion-uat` / `catalog-promotion-prd` environment | Key **secret**, PMC **variable**                                                              |
| Approved private operations storage                                           | Full account/resource IDs, migration journal and usable source rollback credential references |

Use durable keys with the supported permissions exercised by checkout, catalog operations and verifiers. CLI login credentials are temporary. Install Worker values explicitly; updating GitHub does not install them. UAT release verification and the manual `uat-smoke.yml` use GitHub's key/PMC, while checkout uses Worker values. PRD promotion neither installs Stripe credentials nor runs provider checks. Record the deployed code, account and configuration with provider evidence; repeat affected checks after any of them changes.

Retain manual payouts unless the owner chooses otherwise. Assign payout cadence, refund/dispute funding and first-bank-settlement follow-up.

### 3. Rebind current data with one bounded tool

Reuse Items/provider gateways and `readRuntimeCatalogPresentation`. The current `stripe:catalog:verify --env uat --apply` repairs presentation on bound Products from D1; it creates no Prices and writes no D1 bindings. Account rebinding still needs one migration command with plan/apply/restore modes. The existing `pnpm catalog:bindings:migrate` is the completed same-account Product-binding backfill, selected from repository contracts; it is not that command and gains no account-rebinding mode. Default to dry run, require the reviewed manifest hash for apply, and require `--confirm-live-catalog-changes` for PRD writes. Keep this operator command separate from software release; no new general-purpose Actions workflow is needed.

Prepare one private manifest per environment from its current D1 items and source-account Product/default-Price facts: source/target account and mode, item revisions, old/new links, unique variant/lookup identities, runtime presentation, active state, fixed/custom amounts and bounds, tax attributes and a reviewed hash. Include CMS-only, withheld, paused and sold-out items; preserve uninitialized items without inventing prices or publishing them. The default runtime verifier covers published items only, so separately account for every manifest row. PRD values come from PRD authority.

Use that environment's runtime `/media/` image URLs and verify destination Product images resolve. The repository loader's `createContentAssetUrl` still emits retired `/assets/catalog/` URLs; keep `backfill-runtime-catalog.ts` and `--plan-apply` out of this migration. Repair that legacy path only if an identified recovery operation needs it, using actual CMS media identities rather than a pathname substitution. The live-image check remains required; repairing an unused loader is not a migration prerequisite.

Add only the missing account-rebinding plan/apply path and inverse restore data. Journal created objects and completed steps; use retained IDs and unique identities to resume partial creation even after Stripe idempotency expires. Stop on ambiguity or source drift. Keep each mapping/offer update atomic with source preconditions.

Allow writes only to the reviewed current catalog fields. Preserve stock (including `zeroStockState`, `expectedMonth` and preorder fields), pauses, content/publication pointers, orders, monetary facts and retained event/operation history. Keep variant identities, pending `AvailabilityAlert` consent/retry data and `AvailabilityAlertSendDay` counters intact through apply and restore. Compare stable protected fields at the apply boundary; record legitimate drain/delivery, retention cleanup or later probe events separately. Restore uses the inverse catalog manifest, never a routine whole-D1 restore.

### 4. Keep acceptance with its existing owner

| Owner                                                                            | Required handoff                                                                                   |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| This migration                                                                   | Account setup, catalog/config switch, recovery and destination provider proof                      |
| [VAT/delivery change](../greek-vat-and-shipping-charges/tasks.md)                | Seller Tax, measured packing/BOX NOW, fiscal/myDATA/credit/filing coverage and monetary acceptance |
| [Purchase-information change](../complete-shopper-purchase-information/tasks.md) | Approved seller/support/return/privacy content and accepted publication                            |
| [Launch change](../production-go-live-readiness/tasks.md)                        | PRD release/runtime acceptance, live smoke, public routing and final go/no-go                      |

Use one shared UAT evidence set. Cover fixed/custom carts, both shipping tiers, quantity/rounding, supported territories and foreign billing, 3DS, decline/expiry, delayed/replayed webhooks, stale source checkout URLs, and correct order/stock/outbox/messages. Rehearse manual fulfillment/refund/returned-stock handling. Reuse unchanged local tests; rerun affected provider proof for the destination.

Run provider acceptance explicitly through the existing smoke commands or `uat-smoke.yml` against the recorded deployed SHA, after checking current test stock and approved recipients. Release/static smoke does not run these payment scenarios, and a green promotion supplies no destination-account proof. Reuse the resulting purchases across the owning checklists.

Provisional UAT fixtures do not establish measured shipping or fiscal acceptance. Fiscal-provider/myDATA/credit and filing automation are deferred for the restricted beta under the owner's accepted risk, remain unchecked, and must be resolved for full public launch. This does not change the selected tax calculations, measured shipping requirements or applicable obligations. The VAT owner retains fiscal proof and any outstanding beta-period obligations. Live receipts and first bank settlement remain live-proof items in the launch handoff.

### 5. Separate paid beta from public launch and the next account switch

The immediate target is a paid beta for an extremely limited, named cohort. Before activation, the launch owner records the private participant list, a finite order limit, review/end date and operating owner, and verifies access restrictions. An unlisted URL alone is insufficient. Reuse the existing checkout controls, keep the public apex on Holding Page, and use working PRD technical-origin purchase, policy and email links for beta. Obtain the user's explicit beta activation decision after technical acceptance. Fiscal automation and IRIS deferrals are recorded as unresolved work with accepted risk, not completed compliance.

Plan the later official-account migration from a fresh inventory after that account exists. Reuse this cutover procedure, drain old Sessions and retain beta order/payment/account/seller provenance in existing records or the private migration journal. Keep BlackBoxRecords accessible and funded for refunds/disputes; earlier sales retain their original seller and account. Assign late-event and refund handling before switching. No second-account runtime or historical payment transfer is built speculatively.

## Migration Plan

Execute this procedure once for UAT, then for PRD after technical UAT acceptance. Apply decision 5's beta boundary; fiscal automation remains deferred while the actual tax, packing, public-content and payment checks remain required.

1. **Prepare.** Recheck accounts and current inventory; create/resume destination Products/default Prices from the manifest before creating its endpoint.
2. **Freeze and drain.** Coordinate with `release-uat` or `release-prd` for the target environment. Manual provider smoke has its own `uat-provider-smoke` group, runtime Content/Items writes take no release lock, and `blackbox-release` belongs only to Holding Page. Stop new conflicting work and wait for active work to finish; a release lock alone is insufficient. Close checkout, freeze catalog/publication writes, and resolve source Sessions, holds, pending payments, CatalogOperation leases and payable webhook retries. For PRD, verify the launch plan's task 4.1 guard suppresses availability-alert sends before rebinding; closing checkout alone currently does not stop them. Assign retained review/history handling and keep unrelated delivery recovery running where safe.
3. **Capture and stage.** Revalidate the manifest; record source SHA, Worker/content identities, protected fields and rollback references. Disable an existing source endpoint only after drain. Create the target account webhook with the exact Worker URL, required event set and the application's pinned payload version (observed `2026-08-26.dahlia`). Capture its secret, immediately update `disabled=true`, and verify status. Stripe v1 supports disabling through [update](https://docs.stripe.com/api/webhook_endpoints/update), not [create](https://docs.stripe.com/api/webhook_endpoints/create); permit no destination payment/catalog activity in that interval.
4. **Switch.** Update the named GitHub stores, install the matching Worker values coherently, then apply the catalog manifest. Verify account/resource identity, every current link and protected fields. Any failure leaves checkout closed.
5. **Rehearse recovery in UAT.** Before its first destination payment, restore source configuration/catalog links and reapply the same journaled target state. Verify no duplicate objects or lost history. PRD reuses this procedure and test evidence.
6. **Prove delivery.** Enable the target endpoint only after bindings agree. Generate an approved reversible catalog event and replay it; verify signatures, reconciliation and no duplicate effects, then restore probe metadata. Run the existing runtime/PMC/webhook/catalog checks. Do not fabricate live paid orders.
7. **Release the window.** Open only the approved UAT test window. PRD retains `native_checkout_enabled=false` and absent `PRD_LAUNCH_APPROVED`. Check release credential persistence and hand evidence to the owners above.

**Rollback:** Before any destination payment, hold the freeze, disable the destination endpoint, restore matching source configuration and inverse catalog fields, then restore the former source endpoint and verify identity/data. After a destination payment, close checkout and repair forward while preserving both histories.

## Risks / Trade-offs

- **New source obligations** → Refresh the dated empty-live inventory at cutover; resolve any new activity before switching. Revise scope only for an observed need.
- **Drift during a multi-system switch** → One operator, short write freeze, source preconditions and a resumable journal.
- **Missing seller, fiscal or physical proof** → Track each gap with its owner. Only the declared fiscal-automation deferral changes beta sequencing; enabled payment flags and synthetic tests cannot establish compliance or measured packing.
- **IRIS deferred** → Carry the owner's dated decision and known risk into launch evidence without claiming IRIS compliance.
