# Phase 9 BOX NOW Shipping Contract

## Scope

Phase 9 implements Greece-only BOX NOW locker selection before payment. The first version is intentionally narrow: shoppers select a Greek locker, the Worker validates the checkout input before starting payment, and paid orders retain only the minimal locker snapshot needed for manual fulfillment.

Non-Greece shipping, carrier choice, automated label creation, voucher management, and production cutover are out of scope for this milestone.

## Checkout Gate

- Payment must not start until a valid BOX NOW locker has been selected for Greece.
- The allowed country code is `GR`.
- Local/mock testing must use the BOX NOW FAQ test locker: `locker_id = 4`, `country_code = GR`, and `locker_name_or_label = ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234`.
- If locker selection is unavailable, invalid, or incomplete, the checkout flow fails closed and keeps payment unavailable.
- The browser may hold temporary selected-locker UI state, but the Worker owns checkout preflight, order persistence, and all authoritative decisions.

## Thin Locker Snapshot

Future order persistence may store only these v1 BOX NOW fields:

| Field                  | Meaning                                              |
| ---------------------- | ---------------------------------------------------- |
| `locker_id`            | BOX NOW locker identifier selected by the shopper.   |
| `country_code`         | ISO country code for the locker; v1 must be `GR`.    |
| `locker_name_or_label` | Human-readable locker label copied at checkout time. |

The v1 order model must not persist raw BOX NOW widget/API payloads, full locker addresses, coordinates, postal codes, parcel dimensions, voucher IDs, label URLs, tracking automation state, or partner-portal credentials.

## Secret Boundary

- BOX NOW account credentials, API credentials, webhook credentials, partner-portal credentials, and operational tokens are Worker runtime secrets or out-of-band operator credentials.
- No BOX NOW credential may be placed in Astro `PUBLIC_*` env, Cloudflare Pages public build variables, generated frontend clients, static content, or committed seed files.
- Any future browser-visible BOX NOW widget configuration must be explicitly non-secret and documented in the task that introduces it.
- Exact Worker binding names are deferred until the API/widget integration task; this contract locks the boundary, not account-specific values.

## Manual Fulfillment

After payment is confirmed, operators fulfill Greek orders manually through the BOX NOW partner portal using the paid order, selected locker identifier, and label snapshot. Automated BOX NOW delivery request creation is deferred to a future milestone unless low-volume manual operations become insufficient.

## Validation Rules

- `rg` checks must find the approved fields: `locker_id`, `country_code`, and `locker_name_or_label`.
- Docs must keep Greece-only language explicit.
- Docs must keep BOX NOW credentials out of browser/public env.
- No runtime code, D1 migration, API route, generated client, or checkout UI change is part of `09-01`.
