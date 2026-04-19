# ADR-003: BOX NOW Shipping Scope And Brownfield Cutover Strategy

**Status:** Proposed  
**Date:** 2026-04-06  
**Decision owner:** Human review required in Phases 4 and 5

## Context

Greek shipments require BOX NOW locker selection. At the same time, order volume is expected to stay low, and the migration starts from a current live storefront that still redirects `/shop/` externally to Fourthwall.

The project therefore needs a shipping scope that stays thin in v1 and a cutover plan that remains reversible.

## Proposed Decision

- v1 must support **BOX NOW locker selection** for Greek shipments and persist the selected locker `locationId` with the order.
- v1 should prefer a **manual or thin-server fulfillment workflow** over full BOX NOW shipment automation unless Phase 4 review proves automation is worth the added complexity.
- Native commerce cutover should happen through a **reviewed, reversible rollout**, with the current external store path preserved until launch-readiness gates are met.

## Rationale

- Low order volume does not justify a heavyweight shipping platform on day one
- BOX NOW’s documented locker selection paths are enough to satisfy the core shipping requirement
- Brownfield store replacement should not be treated as a one-shot irreversible launch

## Consequences

- Shipping UX and order data must capture enough locker metadata for operators to fulfill paid orders
- The roadmap should defer deep fulfillment automation to v2 unless demand proves it necessary
- `/shop/` fallback and rollback criteria need explicit launch-readiness documentation

## Review Gate

Phase 4 is not complete until the team approves:

1. BOX NOW locker selection UX shape
2. Which locker metadata is mandatory in the order record
3. Whether v1 stops at manual fulfillment or includes a thin API-assisted step

Phase 5 is not complete until the team approves:

1. Cutover sequencing from Fourthwall to native commerce
2. Rollback conditions
3. Parallel-run or limited-catalog strategy, if used

## References

- [BOX NOW API Manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf)

