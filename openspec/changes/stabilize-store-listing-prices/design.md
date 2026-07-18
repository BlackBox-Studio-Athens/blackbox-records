## Context

At investigation time, UAT exposed 81 listing records: 16 ready and 65 unavailable. Sixty-two snapshots were rejected only because their 24-hour `freshUntil` value had passed. Cloudflare historical Worker metrics showed repeated scheduled invocations ending with `scriptThrewException` at exactly 50 external subrequests. The current full-catalog loop performs multiple Stripe calls per variant, so it cannot finish the catalog within that limit.

Seven catalog entries use Stripe pay-what-you-want Prices. Reconciliation deliberately stores `amountMinor = null` for those valid Prices, but the listing reader currently treats every null amount as unavailable.

Existing code already has the smaller recovery path this catalog needs:

```text
Stripe Product/Price event
  -> signed catalog webhook
  -> reconcile one identified variant
  -> update its D1 mapping and Store Offer snapshot
  -> listing projection reads the saved snapshot

Store Item detail or checkout
  -> reconcile current Stripe state for that requested variant
  -> fail closed when Price Authority is invalid or ambiguous
```

The catalog is small, prices change rarely, and new items are normally introduced one at a time. No dynamic-pricing or continuous full-catalog polling requirement exists.

The active `automate-cms-catalog-promotion` change currently conflicts with this direction: it allows generated Desired Price changes to replace valid active Stripe Prices. Its planning artifacts must be reconciled before implementation.

## Goals / Non-Goals

**Goals:**

- Keep a valid listing price visible regardless of snapshot age.
- Keep Stripe as Price Authority and checkout-time source of truth.
- Update one item after one Dashboard price change without scanning unrelated items.
- Create the initial Price for a new item without replacing existing valid Prices.
- Present valid pay-what-you-want offers correctly.
- Prevent a new Store Item card from deploying before its listing-price record is ready.
- Remove the failing Worker cron and avoid new infrastructure.

**Non-Goals:**

- Building a bulk Stripe catalog cache, queue, polling service, or generic event bus.
- Making Astro content, Desired Price, or browser state runtime price authority.
- Removing the `freshUntil` D1 column in this change.
- Changing stock, availability, hosted Checkout, order, or webhook security rules.
- Allowing ambiguous, inactive, malformed, or wrong-environment Prices to display or checkout.
- Changing the current PRD-open gate.

## Decisions

### Listing validity is state-based, not time-based

The listing reader will accept a snapshot when Product and Price are active and its stored currency/amount shape is valid. It will not inspect `freshUntil`. Catalog reconciliation will stop creating `snapshot_stale` issues and stop writing a snapshot only because time passed.

The `freshUntil` column will remain populated for schema compatibility but will have no validity meaning. This avoids a D1 migration for a field that can be removed later only if cleanup is worth the migration cost.

Alternative: increase the TTL or optimize the scheduled scan. Rejected because it keeps a clock able to hide immutable Price data and retains an unnecessary full-catalog job.

### Pay-what-you-want uses the existing null snapshot invariant

`CatalogReconciler` already returns `null` from `getStoreOfferSnapshotAmountMinor` only for a reconciled `pay_what_you_want` Price, while an invalid fixed amount returns `undefined` and is not promoted as a valid snapshot. The listing projection will therefore map an active snapshot with `amountMinor = null` to ready display text `Pay what you want`.

No new D1 column or public API shape is needed. The existing ready record already carries a display string.

Alternative: add `priceKind` and custom-amount bounds to `StoreOfferSnapshot`. Rejected because listing cards need only safe display text; detail and checkout continue to resolve the full authoritative offer.

### Existing targeted recovery replaces scheduled full-catalog recovery

Remove `runScheduledCatalogVerification`, the Worker `scheduled` handler, its UAT cron trigger, and schedule-specific tests. Keep an explicit empty UAT `crons` array for one simple reason: Wrangler leaves old deployed triggers unchanged when the key is absent, while `crons: []` deletes them. Remove the cron-presence assertion and report field from `verify-stripe-webhook-endpoints.ts` and its tests while preserving all webhook endpoint/configuration checks. Keep existing signed webhook reconciliation, Store Offer detail reconciliation, checkout reconciliation, and manual catalog verification.

Add `--store-item <storeItemSlug>` to the existing catalog verification command. Targeted dry-run inspects one item; targeted apply repairs only that item's D1 mapping/snapshot and permitted identity metadata. Full read-only verification remains available for deliberate audits, but no runtime cron calls it.

Alternative: keep a smaller batch cron. Rejected because webhook plus request-path reconciliation already exists and a batch size creates partial-progress rules the use case does not need.

### Desired Price is bootstrap input only

Normal promotion will use generated Desired Price only when no valid active Price Authority exists for the variant. This provisions a new item's first Price. If one valid active Price already exists, normal promotion may update repo-owned Product Projection and D1 snapshot/mapping, but it must not archive, create, reactivate, or replace a Price because Desired Price differs.

Explicit UAT whole-catalog reset remains separate. After reset removes current UAT objects, bootstrap data may recreate missing Prices. PRD reset remains prohibited.

This requires removing the current reconciler branch that archives/replaces a resolved Price on expected-amount mismatch and removing Desired Price mismatch as a blocking issue for an otherwise valid existing Price. General Price Authority validation—identity, environment, active state, supported currency/kind, and ambiguity—remains fail-closed.

Alternative: add separate `initialPrice` and `replacementPrice` modes. Rejected because replacement through repo promotion is no longer a supported normal operation; Stripe Dashboard replacement plus webhook is the one price-update path.

### Catalog deployment uses one hosted readiness gate

For a commit that changes the visible Store Item set, promotion will prepare D1/Stripe and deploy the Worker first. Before static frontend deployment, one gate compares canonical published Store Item slugs from the generated catalog with `/api/store/listing-prices` for the target environment. Every slug must have one `ready` record; fixed and pay-what-you-want records both qualify.

The independent `pages.yml` push path must skip static deployment for these catalog-set commits. Catalog promotion becomes the only path that invokes their static deployment after readiness passes. This closes the current race where a push-triggered static job could publish the card while provider promotion is still running. Non-catalog pushes retain the existing `pages.yml` behavior.

The gate extends the existing promotion/static workflow instead of adding an endpoint or service. Editorial-only deploys that do not change the Store Item set keep the normal static path.

Alternative: let the card deploy and wait for later repair. Rejected because that recreates the visible regression during new-item publication.

### Overlapping OpenSpec rules are reconciled first

Before source implementation, update the active `automate-cms-catalog-promotion` proposal, design, `catalog-promotion-automation`, `commerce-checkout`, and `project-language` deltas so they no longer require normal promotion to replace a valid existing Price from generated Desired Price. Existing coordinated promotion, first-publication creation, reset separation, and deploy sequencing remain.

## Risks / Trade-offs

- [Risk] A webhook is missed and a listing briefly shows the previous price. -> Stripe retries failed webhook delivery; Store Item detail and checkout reconcile current Stripe state and fail closed; the targeted verification command provides operator repair without touching other items.
- [Risk] Leaving `freshUntil` in D1 suggests it still controls validity. -> Specs, tests, and code remove all time-based listing/reconciliation decisions; docs call the field compatibility-only.
- [Risk] Bootstrap-only Desired Price conflicts with unfinished promotion work. -> Reconcile the named active OpenSpec artifacts before source edits and validate both changes together.
- [Risk] Hosted readiness failure blocks a catalog deploy. -> Report exact missing/non-ready slugs and rerun the same idempotent promotion after repair; editorial-only deploys do not use this gate.
- [Risk] Null amount could be mistaken for malformed fixed price. -> Preserve the reconciler invariant: only a valid pay-what-you-want Price produces a null snapshot amount; invalid fixed Prices remain blocking and cannot create a ready snapshot.

## Migration Plan

1. Reconcile the overlapping active OpenSpec change and validate both contracts.
2. Add regression tests, then change listing and reconciler validity rules without a D1 migration.
3. Add the single-item catalog verifier selector and bootstrap-only promotion behavior.
4. Remove the scheduled Worker handler/module/test and cron-presence checks, then deploy an explicit empty UAT cron list to delete the old trigger.
5. Make catalog promotion own static deployment for visible Store Item set changes, then add the hosted listing-readiness gate before that deployment.
6. Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
7. Deploy the UAT Worker before the UAT static site, verify all canonical Store Item slugs return ready listing records, and verify `/store/` through Browser Use.
8. Prove one Dashboard replacement Price updates only its target item and one new-item promotion leaves an existing item's Price identity unchanged.

Rollback requires only reverting the Worker/workflow release; no schema or data rollback exists. Existing snapshots and Stripe Prices remain intact. Do not restore the failing cron as a data-repair step; use targeted verification for an affected item.

## Open Questions

None.
