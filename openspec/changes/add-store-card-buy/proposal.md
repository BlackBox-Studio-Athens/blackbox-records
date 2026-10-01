# Offer Buy on Store cards

## Why

The label asked for a Buy button on Store cards next to Listen ("Στο store, να υπαρχει και το κουμπι buy, εκτος απο το listen."). Cards offer only Listen, so buying a record means opening its item page and pressing Add To Cart there. `refine-store-browsing-and-item-information` deliberately added no quick-buy action; this change reverses that decision for stocked items.

## What changes

- Each Store collection card whose Store Item has a sellable variant renders a hidden Buy button beside its listing price. The shell's Store listing presenter shows it when the listing projection reports a ready price and stocked availability. Sold Out, Out of Stock, Currently Unavailable and unknown availability keep their status text in Buy's place.
- Pressing Buy reads the authoritative Worker Store Offer, adds one unit to StoreCart and opens the cart drawer, as the item page's Add To Cart does. Buy reads Adding while the offer is read and Added for the existing confirmation period. An offer that is no longer buyable adds nothing and shows its status on the card.
- The price row reserves Buy's 44px height, so cards do not move when Buy appears.
- Because Buy adds directly while the card itself opens the item page, the card title reads as that link: a faint text-link underline at rest, full when the card link is hovered or focused, with a border and surface lift on hover-capable devices. Hovering Buy or Listen leaves the card at rest.
- Desktop Coverflow keeps Buy in the active card, with a stage 1.25rem taller for the taller purchase row. Phone Coverflow (below 40rem) keeps its compact card without Buy; its cover opens the item page.
- The item page keeps Add To Cart. Listen keeps its row under the artwork.

## Scope

Public web storefront only. Worker, API, cart storage, checkout and stock behavior are unchanged; the listing projection still decides presentation only, and checkout revalidates everything. Cards stay free of client islands: the button is server-rendered and the existing shell-connected presenter handles it, loading the purchase code on the first press.

## Acceptance

On a Store collection, a stocked card shows Buy beside its price and a sold-out card shows Sold Out without Buy. Pressing Buy opens the cart with that item, and closing the cart returns focus to Buy. Unit tests, the store-cart Playwright spec, strict OpenSpec validation and `pnpm validate` pass, and a browser pass covers phone and desktop widths and Coverflow.
