# Phase 9: Greece-Only BOX NOW Shipping - Context

**Gathered:** 2026-04-29
**Status:** Active

<domain>
## Phase Boundary

Phase 9 adds the approved Greece-only BOX NOW locker gate before payment and keeps fulfillment intentionally thin. The static Astro frontend may render the shopper-facing locker step, but the Worker remains responsible for checkout preflight, order persistence, secrets, and later fulfillment integration decisions.

This phase does not expand shipping beyond Greece, does not automate BOX NOW fulfillment, and does not move BOX NOW credentials into browser-visible configuration.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** v1 shipping is Greece-only through BOX NOW lockers.
- **D-02:** Payment must stay blocked until a valid Greek locker is selected.
- **D-03:** The approved locker snapshot is limited to `locker_id`, `country_code`, and `locker_name_or_label`.
- **D-04:** `country_code` must represent Greece as `GR`; non-Greece shipping paths are out of scope for this milestone.
- **D-05:** BOX NOW credentials belong only in Worker runtime secrets or out-of-band operator tooling, never Astro `PUBLIC_*` env.
- **D-06:** Fulfillment remains manual through the BOX NOW partner portal for v1.
- **D-07:** Browser-selected locker data is checkout input until the Worker validates and persists it; the browser is not shipping, payment, or order authority.
- **D-08:** Local/mock BOX NOW testing uses the BOX NOW FAQ test locker: `locker_id = 4`, `country_code = GR`, and `locker_name_or_label = ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234`.

</decisions>

<specifics>
## Specific Ideas

- Keep the checkout flow fail-closed: if locker selection is unavailable or invalid, do not start payment.
- Keep the shopper UI simple: one Greece-only BOX NOW choice, selected locker summary, and clear blocked-state copy if the locker picker cannot be used.
- Persist only the minimum data needed for low-volume manual fulfillment; do not store raw BOX NOW payloads, full addresses, coordinates, parcel labels, voucher IDs, or automation state in v1 unless a later task proves a concrete need.
- Keep future BOX NOW API/widget setup separate from this contract step. Exact binding names and account-specific values are deferred until the integration task that needs them.
- Treat Phase 9 implementation as independent from real Stripe account access until final sandbox validation. Stripe remains the payment provider, but the shipping contract can be documented and locally tested without Stripe keys.

</specifics>

<canonical_refs>

## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/UBIQUITOUS_LANGUAGE.md`
- `.planning/adrs/ADR-003-boxnow-and-cutover.md`
- `.planning/archive/v1.0-pre-sandbox-planning/phases/04-box-now-locker-shipping-slice/04-UI-SPEC.md`
- `.planning/phases/09-greece-only-box-now-shipping/09-BOX-NOW-CONTRACT.md`

</canonical_refs>

---

_Phase: 09-greece-only-box-now-shipping_  
_Context gathered: 2026-04-29_
