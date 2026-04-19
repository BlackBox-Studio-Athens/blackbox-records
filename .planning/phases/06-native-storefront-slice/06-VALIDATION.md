---
phase: 6
slug: native-storefront-slice
status: ready
nyquist_compliant: true
---

# Phase 6 Validation

| Check ID | Plan | Requirement | Validation |
|----------|------|-------------|------------|
| V-06-01 | 06-01 | CATA-01 | One unified shop projection contract exists for release-derived and distro-derived entries |
| V-06-02 | 06-02 | CATA-03 | Cross-collection mapping rules define canonical shop slugs and release-to-shop resolution |
| V-06-03 | 06-03 | CATA-04 | Offer state comes from a fixture adapter, not editorial collections |
| V-06-04 | 06-04 | CATA-01 | `/shop/` is native and no longer a redirect-only route in the Worker/sandbox path |
| V-06-05 | 06-05 | CATA-02 | PDP and checkout handoff shell exist without requiring D1 or Stripe |
| V-06-06 | 06-06 | CATA-03 | Release pages can navigate to canonical native shop PDPs where mapped |
| V-06-07 | 06-07 | CATA-02 | Editorial assets and summaries are reused instead of duplicated |

## Exit gate

Phase 6 is complete only when the native shop contract is real, navigable, and visually integrated into the site shell without depending on D1 or Stripe.
