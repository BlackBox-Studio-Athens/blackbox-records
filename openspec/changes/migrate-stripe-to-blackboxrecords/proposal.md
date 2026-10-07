# Proposal

## Why

Move the existing store's UAT and PRD checkout to BlackBoxRecords for an extremely limited paid beta. Complete its technical setup while preserving the current catalog, stock and commerce history. A later migration will move future sales to the owner's intended official account.

## What Changes

- Use the existing **BlackBoxRecords sandbox** for UAT and **BlackBoxRecords live** for PRD, with explicit account/mode checks.
- Confirm the actual beta seller and configure Tax, payment methods, public details, durable credentials, webhooks and payout operations. Explicitly enable ordinary Stripe receipts for successful payments and refunds before beta sales.
- Reuse each environment's D1 runtime presentation and source Product/default-Price facts, including working media URLs, and rebind its catalog links through one reviewed, resumable operator command.
- Follow one maintenance procedure for both environments; rehearse recovery and prove the destination purchase flow in UAT before preparing PRD with checkout closed.
- Complete measured BOX NOW and truthful public-content acceptance through their existing owners. Hand evidence to `production-go-live-readiness` for restricted-beta activation; fiscal-provider/myDATA and filing automation remain open for the later public-launch phase under the owner's accepted risk.
- Retain each account's sales history and refund/dispute access through the later switch. IRIS remains deferred under the owner's 2026-10-05 risk acceptance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None in this migration. It applies the existing checkout, catalog, environment and historical-preservation contracts through account configuration and migration tooling. `skip_specs: true` is retained; the linked launch-readiness delta owns restricted-beta access and activation requirements.

## Impact

Stripe sandbox/live resources, current D1 catalog links, Worker/GitHub configuration and the existing migration runbooks. Software release keeps its current UAT push/PRD promotion flow; provider acceptance runs separately. The [2026-10-05 inventory](evidence.md) indicated no source-live money/customer transfer need. Confirm that with complete pagination and subscription-status coverage before cutover; customer transfer and dual-account infrastructure are outside the current scope.
