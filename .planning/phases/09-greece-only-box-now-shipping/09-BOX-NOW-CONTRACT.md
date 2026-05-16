# Phase 9 BOX NOW Shipping Contract

## Scope

Phase 9 no longer assumes a locker-first implementation is the only valid BOX NOW outcome. It locks the Greece-only
shipping boundary and closes current v1 work on manual-address fulfillment:

1. **Manual-address fulfillment (current v1 path)**
2. **Automated BOX NOW fulfillment through `boxnow-js` (future reopen-only path)**

Non-Greece shipping, carrier choice, ad hoc in-repo BOX NOW clients, and production cutover are out of scope for this
milestone.

## Shipping Mode Decision

### 1. Manual-address fulfillment (current v1 path)

- The checkout/order flow must expose the Greek delivery address and any required recipient/contact data needed for a
  human to create a BOX NOW shipment manually.
- This path does not require BOX NOW locker selection, a BOX NOW widget, or BOX NOW API calls from this repo.
- The operator source of truth remains Worker-owned paid order state plus the approved address/contact surface
  available to operations.

### 2. Automated BOX NOW fulfillment (future reopen-only)

- If the project later automates BOX NOW, the integration base must be `C:\Users\SVall\WebstormProjects\boxnow-js`.
- Browser-side BOX NOW code may use only non-secret widget or locker state.
- Server-side BOX NOW API use, credentials, and automation remain Worker-owned or approved operator tooling.
- If this path needs BOX NOW-specific order persistence, the approved ceiling remains the thin locker snapshot:
  `locker_id`, `country_code`, and `locker_name_or_label`. Any expansion needs a new decision.

## BOX NOW-Specific Persistence Ceiling

If the automated path is chosen and BOX NOW-specific order state is required, future persistence may store only these
approved v1 BOX NOW fields:

| Field                  | Meaning                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `locker_id`            | BOX NOW locker identifier selected by the shopper.             |
| `country_code`         | ISO country code for the locker; v1 must stay `GR`.            |
| `locker_name_or_label` | Human-readable locker label copied at checkout or widget time. |

The repo must not persist raw BOX NOW widget/API payloads, unapproved address or locker payload dumps, coordinates,
postal codes, parcel dimensions, voucher IDs, label URLs, tracking automation state, or partner-portal credentials
unless a later milestone explicitly opens that scope.

## Secret Boundary

- BOX NOW account credentials, API credentials, webhook credentials, partner-portal credentials, and operational
  tokens are Worker runtime secrets or out-of-band operator credentials.
- No BOX NOW credential may be placed in Astro `PUBLIC_*` env, Cloudflare Pages public build variables, generated
  frontend clients, static content, or committed seed files.
- Any future browser-visible BOX NOW widget configuration must be explicitly non-secret and documented in the task that
  introduces it.
- Exact Worker binding names are deferred until the automation task that needs them; this contract locks the boundary,
  not account-specific values.

## Current Implementation Note

The historical local Phase 9 implementation followed the automation-oriented locker-first branch. It remains useful
prototype evidence only. Plan `09-07` chooses the manual-address path for new checkout starts: Stripe Checkout collects
the Greek shipping address/contact details, and operators create BOX NOW shipments manually from paid order/payment
tooling. Legacy nullable locker readback may remain for old/prototype rows, but new manual checkout starts must not
require browser-selected locker data.

## Validation Rules

- Docs must keep Greece-only language explicit.
- Docs must name the chosen shipping path instead of silently mixing manual and automated assumptions.
- Docs must keep BOX NOW credentials out of browser/public env.
- Any approved BOX NOW automation must point to `boxnow-js` rather than a bespoke client in this repo.
- No runtime code, D1 migration, API route, generated client, or checkout UI change is part of `09-01`.
