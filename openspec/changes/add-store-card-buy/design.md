# Design

## Placement

Buy sits at the right of the price, in the card's purchase row; status text takes its place when the item cannot be bought. Listen keeps its 52px row under the artwork, so its 112 × 44px design and row alignment do not change. The placement was chosen with the label on 2026-10-01.

- Rejected: Buy beside Listen. Two 44px actions need about 190px, while two-column phone cards have 132 to 147px inside their padding, so the pair would wrap or Listen would shrink. It would also offer Buy before the shopper sees the price.
- Rejected: Buy as a link to the item page. The whole card already links there, and redundant `View Item` labels were removed in July 2026.

## Control

Outline, large (44px), labelled Buy. The store surface's `data-tone` gives outlined controls the Store Blood edge. A filled primary is reserved for one action per view, and a grid of filled buttons would read as a marketplace. The 4.5rem minimum width fits Adding and Added, so the label can change while working without changing the width. `ml-auto` keeps Buy right-aligned when a long price wraps it to its own line.

## Authority

- The listing projection decides only whether Buy is shown (`presentationState: 'ready'` and `availabilityState: 'stocked'`). It is not cart, checkout, stock or payment authority.
- Pressing Buy reads the Worker Store Offer through the item page's `loadStoreItemPurchaseActionState`, builds the cart line from the authoritative offer and dispatches the existing StoreCart add event. The shell's cart bridge adds the line, opens the drawer and confirms, as it does for Add To Cart. Checkout revalidates identity, availability, stock and price.
- An offer that is no longer buyable, or a failed read, adds nothing. Buy leaves the card, the row shows the offer's status, and focus moves to the card's Store Item link.

## Performance

Cards remain free of islands (`catalog-containment.test.ts`). The seed the cart line needs (title, artist, option, image and variant) is server-rendered as JSON on the button, about 0.3 KB per card. The presenter attaches one listener per button and imports the purchase module on the first press, so the shell's initial chunk gains no React component, zod or API client code. Reserving the price row's height avoids layout shift when the projection arrives.

## Accessibility

Buy is a native button inside the card's labelled group, a sibling of the single card link and above its hit area. While working it is marked busy and reads Adding. The cart drawer returns focus to Buy when it closes. Status stays text, never a disabled button.
