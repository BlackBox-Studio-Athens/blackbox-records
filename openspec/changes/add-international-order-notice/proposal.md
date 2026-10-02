# Proposal

## Why

Online checkout ships within Greece only, and `shipping-fulfillment` keeps that scope closed. Shoppers abroad currently learn this only at checkout, with no way to order. The label wants to take those orders by email and arrange shipping and payment manually.

## What Changes

- Add one shopper notice in three variants: a strip on Store collection pages, a line beside the Store Item purchase action, and a card in the cart drawer and checkout shipping step.
- The notice states that online checkout ships within Greece only, for now, and offers "Email us to order" as a `mailto:` link with a prefilled subject and order template. Where the items are known (Store Item, cart, checkout), the template lists them.
- Show it to every shopper. It is static text: no geolocation, popup, dismissal, live region, or stored state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shipping-fulfillment`: Shoppers outside Greece are told the scope and given an email ordering route.

## Impact

Public web only: one notice component, Store collection layout, Store Item page, cart drawer and checkout shipping step, plus their tests. No Worker, D1, Stripe, checkout payload, country validation, international rate, or contact-form change. The closed shipping country scope is unchanged; email orders are handled manually outside the system.

## Design reference

[design.md](design.md) holds copy, tokens and placements. [design/](design/) holds PNG exports of the accepted canvas (https://claude.ai/artifact/MMtaHRBeRrdi5jHxZzfNBe). The mocks use placeholder headers, prices and inline styles; implement with the site's existing components and tokens.
