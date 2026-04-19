# Phase 4: BOX NOW Locker Shipping Slice - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 04-box-now-locker-shipping-slice
**Areas discussed:** Locker selection timing, Stored locker data, Fulfillment depth, Failure and fallback behavior, Greek-only gating

---

## Locker selection timing

| Option | Description | Selected |
|--------|-------------|----------|
| Before payment | Shopper selects locker in the site-owned flow before entering payment | ✓ |
| During checkout | Locker selection is mixed into the dedicated checkout route itself | |
| After payment | Shopper pays first and chooses locker later | |

**User's choice:** Recommended option.
**Notes:** The user accepted pre-payment locker selection.

---

## Stored locker data

| Option | Description | Selected |
|--------|-------------|----------|
| Thinnest | `locker_id`, `country_code`, and one human-readable locker label snapshot | ✓ |
| Safer minimal | Add address and postal-code fields on top of the thinnest set | |
| Fuller snapshot | Persist a richer BOX NOW locker snapshot | |

**User's choice:** Thinnest possible storage that is still operationally correct.
**Notes:** The user explicitly asked for the least amount of stored data needed for correct operations.

---

## Fulfillment depth

| Option | Description | Selected |
|--------|-------------|----------|
| Manual partner-portal fulfillment only | Operator completes fulfillment manually in BOX NOW tools | ✓ |
| Thin server-assisted API fulfillment | Minimal backend help around parcel creation | |
| Fuller automation | Build a more complete BOX NOW automation layer | |

**User's choice:** Recommended option.
**Notes:** The user accepted manual partner-portal fulfillment as the MVP path.

---

## Failure and fallback behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed | No payment can proceed without a valid locker selection | ✓ |
| Soft fallback | Allow another path temporarily if locker selection fails | |
| Resolve later | Collect payment first and sort shipping manually afterward | |

**User's choice:** Recommended option.
**Notes:** The user accepted fail-closed behavior for BOX NOW shipments.

---

## Greek-only gating

| Option | Description | Selected |
|--------|-------------|----------|
| Greece only | MVP native commerce shipping is Greece only | ✓ |
| Greece plus later non-Greece path | BOX NOW only for Greece, but another path is also planned | |

**User's choice:** Greece only.
**Notes:** The user explicitly said BOX NOW should be used only for people buying from Greece and chose a Greece-only MVP shipping posture.

---

## the agent's Discretion

- Exact country-gating moment in the flow
- Exact naming for the stored locker label field
- Exact widget embedding or handoff mechanics
- Exact copy for non-Greek and failed-locker states

## Deferred Ideas

- Non-Greece shipping
- BOX NOW API automation
- Richer locker snapshots
- Multi-carrier shipping
