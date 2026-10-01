# Design

## Placement

Buy sits at the right of the price, in the card's purchase row; status text takes its place when the item cannot be bought. Listen keeps its 52px row under the artwork, so its 112 × 44px design and row alignment do not change. The placement was chosen with the label on 2026-10-01.

- Rejected: Buy beside Listen. Two 44px actions need about 190px, while two-column phone cards have 132 to 147px inside their padding, so the pair would wrap or Listen would shrink. It would also offer Buy before the shopper sees the price.
- Rejected: Buy as a link to the item page. The whole card already links there, and redundant `View Item` labels were removed in July 2026.

## Control

Large (44px), labelled Buy, in the button family's filled primary face: Control Ink with Primary Inverse text, the face of Checkout and the item page's Add To Cart. The first build used the store-toned outline, whose Store Blood edge read like the outlined Sold Out status. On 2026-10-01 the label compared four treatments rendered on the real cards (ink outline with the cart's bag icon, ink filled, Store Blood filled, and a price tag joining price and Buy) and chose ink filled. Store cards therefore become the documented exception to one filled primary per view, and Buy never shares a status's look. The 4.5rem minimum width fits Adding and Added, so the label can change while working without changing the width. `ml-auto` keeps Buy right-aligned when a long price wraps it to its own line.

## Card link cue

With Buy adding directly, shoppers need to see that the rest of the card opens the item page. Chosen with the label on 2026-10-01: the title takes the site's text-link underline (1px, 30% ink, 4px offset), which turns full ink when the card link is hovered or focused; on hover-capable devices the card's border and surface lift to the control hover tokens. The cue is visible at rest, so it works on phones, adds no element and costs no width. Buttons sit above the card link, so hovering Buy or Listen leaves the card at rest and keeps them visibly separate.

- Rejected: a `Details` text link (a third control that needs its own line on phones and repeats the removed `View Item`), making only the cover and title links (reverses the single card link and shrinks the target), an arrow after the artist (reads as a button), and hover-only cues (invisible on phones).

## Coverflow

The active Coverflow card shows its purchase row. At 40rem and up the stage grows by 1.25rem, the purchase row's extra height, as it grew when the sold-out change added that row. Phone Coverflow sizes the active card as a fixed square, so Buy there would shrink the cover from about 122px to 103px; the label chose to keep that card exactly as before, with price and status but no Buy. Shoppers buy from the Grid, desktop Coverflow or the item page.

## Authority

- The listing projection decides only whether Buy is shown (`presentationState: 'ready'` and `availabilityState: 'stocked'`). It is not cart, checkout, stock or payment authority.
- Pressing Buy reads the Worker Store Offer through the item page's `loadStoreItemPurchaseActionState`, builds the cart line from the authoritative offer and dispatches the existing StoreCart add event. The shell's cart bridge adds the line, opens the drawer and confirms, as it does for Add To Cart. Checkout revalidates identity, availability, stock and price.
- An offer that is no longer buyable, or a failed read, adds nothing. Buy leaves the card, the row shows the offer's status, and focus moves to the card's Store Item link.

## Performance

Cards remain free of islands (`catalog-containment.test.ts`). The seed the cart line needs (title, artist, option, image and variant) is server-rendered as JSON on the button, about 0.3 KB per card. The presenter attaches one listener per button and imports the purchase module on the first press, so the shell's initial chunk gains no React component, zod or API client code. Reserving the price row's height avoids layout shift when the projection arrives.

## Accessibility

Buy is a native button inside the card's labelled group, a sibling of the single card link and above its hit area. While working it is marked busy and reads Adding. The cart drawer returns focus to Buy when it closes. Status stays text, never a disabled button.
