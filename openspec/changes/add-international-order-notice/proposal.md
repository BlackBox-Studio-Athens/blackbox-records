# Proposal

## Why

Online checkout ships within Greece only, and `shipping-fulfillment` keeps that scope closed. Shoppers abroad currently learn this only at checkout, with no way to order. The label wants to take those orders by email at `orders@blackboxrecordsathens.com` and arrange shipping and payment manually.

## What Changes

- Add one shopper notice in three variants: a strip on Store collection pages, a line beside the Store Item purchase action, and a card in the cart drawer and checkout shipping step.
- The notice states that online checkout ships within Greece only, for now, and offers "Email us to order" as a `mailto:` link to `orders@` with a prefilled subject and order template. Where the items are known (Store Item, cart, checkout), the template lists them.
- Show it only to shoppers outside Greece. The browser reads the visitor country from Cloudflare's same-origin `/cdn-cgi/trace`; Greece, unknown or failed lookups keep it hidden. No Worker, binding or setting is added.
- Keep the notice active for the lifetime of Greece-only online shipping. Isolate it for removal or replacement as part of the shipping expansion release; do not add an independent enable/disable flag. Partial expansion must retain an accurate email route for destinations that checkout still cannot serve.
- It stays quiet: no popup, dismissal or live region.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shipping-fulfillment`: Shoppers outside Greece are told the scope and given an email ordering route; shoppers in Greece are not shown it.

## Impact

Public web only: one notice component with a country gate, Store collection layout, Store Item page, cart drawer and checkout shipping step, plus their tests. No Worker, D1, Stripe, checkout payload, country validation, international rate, or contact-form change. No Cloudflare quota use. The closed shipping country scope is unchanged; email orders are handled manually outside the system.

## Design reference

[design.md](design.md) holds the owner's decisions, country gate, copy, tokens and placements. [design/](design/) holds PNG exports and their HTML sources, tied to canvas version 5 (https://claude.ai/artifact/MMtaHRBeRrdi5jHxZzfNBe). The mocks use placeholder headers, prices and inline styles; implement with the site's existing components and tokens.
