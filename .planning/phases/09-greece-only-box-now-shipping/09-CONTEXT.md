# Phase 9: Greece-Only BOX NOW Shipping - Context

**Gathered:** 2026-04-29  
**Updated:** 2026-05-17
**Status:** Revised

<domain>
## Phase Boundary

Phase 9 establishes the Greece-only BOX NOW shipping boundary and the shipping-mode decision for native commerce.
The static Astro frontend may render shopper-facing shipping state, but the Worker remains responsible for checkout
preflight, order persistence, secrets, and any future automation boundary.

Phase 9 chose the manual-address end state for current v1 work:

- **Manual-address fulfillment (default):** paid orders expose the Greek delivery address and any required
  recipient/contact data needed for a human to create a BOX NOW shipment manually.
- **Automated BOX NOW fulfillment (future reopen-only):** if the project later automates BOX NOW, it must do so through the
  dedicated `C:\Users\SVall\WebstormProjects\boxnow-js` repository rather than a one-off in-repo integration.

This phase does not expand shipping beyond Greece, does not move BOX NOW credentials into browser-visible
configuration, and does not allow a bespoke BOX NOW client inside this repo that bypasses `boxnow-js`.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** v1 shipping remains Greece-only through BOX NOW.
- **D-02:** Phase 9 is closed on manual-address fulfillment for current v1 work. Automated BOX NOW fulfillment via
  `boxnow-js` is future reopen-only work.
- **D-03:** Manual-address fulfillment is the default baseline and does not require BOX NOW locker selection or BOX NOW
  API/widget automation.
- **D-04:** Manual-address fulfillment needs only the delivery address and any required recipient/contact data needed
  for a human to create the shipment; it must not invent extra BOX NOW-specific persistence without a concrete reason.
- **D-05:** If automation is chosen, `C:\Users\SVall\WebstormProjects\boxnow-js` is the mandatory integration base.
- **D-06:** BOX NOW credentials belong only in Worker runtime secrets or out-of-band operator tooling, never Astro
  `PUBLIC_*` env.
- **D-07:** The browser is not shipping, payment, or order authority in either path.
- **D-08:** If the automated path needs BOX NOW-specific order persistence, the approved ceiling stays
  `locker_id`, `country_code`, and `locker_name_or_label` until a later decision expands it.
- **D-09:** The current locker-first sandbox implementation is an automation-oriented prototype branch, not the only
  acceptable final Phase 9 end state.
- **D-10:** Plan `09-07` chooses manual-address fulfillment as the live Phase 9 checkout path. Stripe Checkout collects
  Greek shipping address/contact details; the repo does not collect browser BOX NOW locker data for new checkout starts.

</decisions>

<specifics>
## Specific Ideas

- Keep the product decision explicit: do not leave Phase 9 half-manual and half-automated.
- If the project stays manual, capture only the address/contact data that operators need to create a BOX NOW shipment
  manually; do not fake future automation requirements.
- If the project later automates BOX NOW, keep browser/widget code non-secret and keep server-side BOX NOW API access
  behind the Worker or approved operator tooling, using `boxnow-js` as the integration base.
- Keep the checkout flow fail-closed only for the chosen shipping-mode requirements; do not preserve a locker-first
  requirement if the final path is manual-address fulfillment.
- Treat the current locker-first local implementation as useful prototype evidence, but not as the only acceptable
  release contract.
- Preserve old nullable locker readback only as legacy/prototype interpretation until a separate cleanup decision removes
  that persisted shape.

</specifics>

<canonical_refs>

## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/UBIQUITOUS_LANGUAGE.md`
- `.planning/adrs/ADR-003-boxnow-and-cutover.md`
- `.planning/phases/09-greece-only-box-now-shipping/09-BOX-NOW-CONTRACT.md`
- `C:\Users\SVall\WebstormProjects\boxnow-js\README.md`

</canonical_refs>

---

_Phase: 09-greece-only-box-now-shipping_  
_Context gathered: 2026-04-29; revised: 2026-05-14_
