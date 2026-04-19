# ADR-003: BOX NOW Shipping Scope And Production Cutover Boundary

**Status:** Accepted  
**Date:** 2026-04-19  
**Decision owner:** Approved during archived milestone v1.0

## Context

Greek shipments require BOX NOW locker selection. Order volume is expected to stay low, and the current production storefront still redirects `/shop/` externally to Fourthwall. The project therefore needs a shipping scope that stays thin in v1 and a clear boundary between sandbox implementation and production launch work.

## Decision

- v1 supports **BOX NOW locker selection for Greece only**.
- Locker selection happens **before payment** on the site-owned checkout flow.
- v1 persists only the thinnest approved locker metadata: `locker_id`, `country_code`, and `locker_name_or_label`.
- v1 fulfillment stays **manual through the BOX NOW partner portal**.
- Production cutover is a **future milestone**. Sandbox implementation must not silently turn into live rollout work.

## Rationale

- Low order volume does not justify a heavyweight shipping platform on day one.
- BOX NOW’s locker selection paths are enough to satisfy the immediate Greek shipping requirement.
- The project should not mix shipping MVP work with production launch risk.

## Consequences

- The checkout flow must block payment if a valid Greek locker is not selected.
- Non-Greece shipping paths are deferred to future milestones.
- Deep BOX NOW automation is deferred to v2 unless actual demand proves it necessary.
- Go-live planning must define production cutover and emergency disable behavior separately from the sandbox milestone.

## References

- [BOX NOW API manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf)
- [BOX NOW partner portal](https://boxnow.gr/en/diy/eshops/partner-portal)
