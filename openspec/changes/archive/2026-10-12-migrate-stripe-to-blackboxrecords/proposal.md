# Proposal

## Why

Move the existing store's UAT and PRD checkout to BlackBoxRecords for the owner's requested unrestricted selling scope after technical readiness. The 2026-10-08 decision supersedes the earlier restricted beta, with no participant/order limit or end date. Preserve the current catalog, stock and commerce history. A later migration will move future sales to the owner's intended official account.

## What Changes

- Use the existing **BlackBoxRecords sandbox** for UAT and **BlackBoxRecords live** for PRD, with explicit account/mode checks.
- Use the supplied seller, stock, bank and necessary operating-owner attestations; configure payment methods, public details, durable credentials, webhooks and payout operations. Reuse approved UAT Tax fixtures while actual live Tax facts remain unknown/deferred; never invent registration or accepted rates. Explicitly enable ordinary Stripe receipts for successful payments and refunds before sales.
- Reuse each environment's D1 runtime presentation and source Product/default-Price facts, including working media URLs, and rebind its catalog links through one reviewed, resumable operator command.
- Follow one maintenance procedure for both environments; rehearse recovery and prove the destination purchase flow in UAT before preparing PRD with checkout closed.
- Use the final 2026-10-09 owner tariff through the VAT/delivery owner: €3 for 1–4 validated cart units, €6 for 5–8 or €10 for 9 or more, once per order. All validated PRD variants share the assumed profile; actual parcel count is manual and the old nineteen-unit single-parcel ceiling does not cap new orders. Preserve historical agreements and stock/cart/configuration guards; actual measurements remain unknown. Hand source-bound proof to `production-go-live-readiness`; deployment/hosted acceptance remains separate. Fiscal-provider/myDATA and filing automation remain deferred without a compliance claim.
- Retain each account's sales history and refund/dispute access through the later switch. IRIS remains deferred under the owner's 2026-10-05 risk acceptance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None in this migration. It applies the existing checkout, catalog, environment and historical-preservation contracts through account configuration and migration tooling. `skip_specs: true` is retained; the linked launch-readiness delta owns the current selling scope and activation requirements.

## Impact

Stripe sandbox/live resources, current D1 catalog links, Worker/GitHub configuration and the existing migration runbooks. Software release keeps its current UAT push/PRD promotion flow; provider acceptance runs separately. The [2026-10-05 inventory](evidence.md) indicated no source-live money/customer transfer need. Confirm that with complete pagination and subscription-status coverage before cutover; customer transfer and dual-account infrastructure are outside the current scope.
