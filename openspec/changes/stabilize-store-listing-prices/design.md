## Context

The accepted implementation removed time-based invalidation and the failing catalog Cron, retained one-item recovery, made Desired Price bootstrap-only, and sequenced catalog deployment behind hosted readiness. July 18, 2026 UAT evidence showed 81 of 81 ready records, including seven pay-what-you-want records, with no Price unavailable cards.

## Goals / Non-Goals

**Goals:**

- Preserve valid prices until a real provider/catalog change replaces them.
- Keep one-item changes isolated.
- Finish with evidence that a real Dashboard replacement affects only its target.

**Non-Goals:**

- Reintroducing any scheduled catalog scan.
- Proving new-item non-destruction again through live provider mutation; the deterministic two-item regression owns that invariant.
- Changing checkout, stock, order, or PRD-open policy.

## Decisions

### Price validity is state-based

Active Product/Price identity, currency, amount kind, and snapshot shape determine readiness. freshUntil remains compatibility data only and has no display or reconciliation authority. A valid null amount means pay-what-you-want; malformed fixed prices remain unavailable.

### Recovery is targeted

Normal recovery is:

1. signed Product/Price webhook for one identified variant;
2. authoritative Store Offer or checkout reconciliation for the requested variant;
3. manual verifier with one storeItemSlug selector.

Full read-only audits may inspect the catalog, but no runtime Cron scans or mutates it.

### Desired Price is bootstrap input

Normal promotion creates a Stripe Price only when no valid Price Authority exists. One valid existing Price is preserved even when generated Desired Price differs. Dashboard replacement plus webhook is the supported normal price-change path. Explicit UAT reset remains separate.

### Publication waits for hosted readiness

When the visible Store Item set changes, catalog promotion prepares provider/D1 state and Worker deployment, verifies one ready listing record per canonical slug, then dispatches static deployment. Independent static push deployment skips that catalog-set commit.

automate-cms-catalog-promotion owns orchestration only; this change owns price semantics.

## Risks / Trade-offs

- [Webhook is missed] → Detail/checkout reconciliation and the one-item verifier repair the target without a catalog scan.
- [Old freshUntil is misread later] → Keep regression tests proving age alone never changes readiness.
- [Hosted readiness blocks publication] → Report app-owned failing slugs and rerun the same idempotent promotion.

## Migration Plan

Implementation and rollout are complete. One remaining closeout step replaces one UAT Price in Stripe Dashboard, observes the signed webhook/reconciliation, and proves only the target mapping and listing snapshot changed. Redacted evidence must exclude Stripe IDs and account data.

Rollback reverts the release. It does not restore Cron or rewrite provider/catalog data.
