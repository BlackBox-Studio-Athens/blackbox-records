# ADR-003: BOX NOW Shipping Scope And Production Cutover Boundary

**Status:** Revised  
**Date:** 2026-04-19  
**Last revised:** 2026-05-14  
**Decision owner:** Approved during archived milestone v1.0, revised during Phase 9 replanning

## Context

Greek shipments still need a thin BOX NOW-compatible fulfillment path. The earlier locker-first decision was a useful
first sandbox slice, but it overfit one implementation shape. The repo now needs a decision that distinguishes
between:

- a low-volume manual shipping path that needs shopper address/contact data so an operator can create the BOX NOW
  shipment manually
- an automated BOX NOW path that should reuse the dedicated `C:\Users\SVall\WebstormProjects\boxnow-js` codebase
  instead of growing an ad hoc client in this repo

The project still needs a shipping scope that stays thin in v1 and a clear boundary between sandbox implementation and
production launch work while the native `/store/` contract is introduced.

## Decision

- v1 shipping remains Greece-only.
- Phase 9 must choose one explicit shipping mode before closure:
  - **manual-address fulfillment (default):** operator creates the BOX NOW shipment manually from paid order state plus
    the required delivery address/contact data
  - **automated BOX NOW fulfillment (optional):** any BOX NOW widget/API automation must be built on
    `C:\Users\SVall\WebstormProjects\boxnow-js`
- If manual-address fulfillment is chosen, Phase 9 does not require BOX NOW locker selection or BOX NOW-specific order
  persistence.
- If automation is chosen and BOX NOW-specific persistence is needed, the approved ceiling remains `locker_id`,
  `country_code`, and `locker_name_or_label` until a later decision expands it.
- BOX NOW secrets remain server-only or out-of-band operator credentials.
- Production cutover is a future milestone. Sandbox implementation must not silently turn into live rollout work.

## Rationale

- Low order volume still does not justify a heavyweight shipping platform on day one.
- Manual address-based portal fulfillment may be enough for the real operating shape, so Phase 9 should not lock the
  repo into a locker-first requirement unless that path is explicitly chosen.
- If automation is later justified, the project already has a dedicated `boxnow-js` codebase that should own the BOX
  NOW client/widget boundary instead of duplicating that logic here.
- The project should not mix shipping MVP work with production launch risk.

## Consequences

- Checkout blocking rules now depend on the chosen shipping mode.
- If the project stays manual, Phase 9 must prove the paid order exposes the delivery address/contact data needed for
  operator portal shipment.
- If the project automates BOX NOW, that work must route through `boxnow-js` and keep browser code non-secret.
- The current locker-first sandbox slice is useful prototype evidence, but it is not the only acceptable final Phase 9
  requirement.
- Go-live planning must define production cutover and emergency disable behavior separately from the sandbox milestone.

## References

- [BOX NOW API manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf)
- [BOX NOW partner portal](https://boxnow.gr/en/diy/eshops/partner-portal)
- `C:\Users\SVall\WebstormProjects\boxnow-js\README.md`
