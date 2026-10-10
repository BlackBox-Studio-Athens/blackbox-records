# Design

## Placement

Buy sits at the right of the price, in the card's purchase row; status text takes its place when the item cannot be bought. Listen keeps its 52px row under the artwork, so its 112 × 44px design and row alignment do not change. The placement was chosen with the label on 2026-10-01.

- Rejected: Buy beside Listen. Two 44px actions need about 190px, while two-column phone cards have 132 to 147px inside their padding, so the pair would wrap or Listen would shrink. It would also offer Buy before the shopper sees the price.
- Rejected: Buy as a link to the item page. The whole card already links there, and redundant `View Item` labels were removed in July 2026.

## Control

Large (44px), labelled Buy, in the button family's filled primary face: Control Ink with Primary Inverse text, the face of Checkout and the item page's Add To Cart. The first build used the store-toned outline, whose Store Blood edge read like the outlined Sold Out status. On 2026-10-01 the label compared four treatments rendered on the real cards (ink outline with the cart's bag icon, ink filled, Store Blood filled, and a price tag joining price and Buy) and chose ink filled. Store cards therefore become the documented exception to one filled primary per view, and Buy never shares a status's look. (Superseded for Buy on 7 October 2026; see below.) The 4.5rem minimum width fits Adding and Added, so the label can change while working without changing the width. `ml-auto` keeps Buy right-aligned when a long price wraps it to its own line.

On 7 October 2026 the designer wrote: "Στο store, το listen κουμπί είναι πιο ωραίο από το buy, να έχει και αυτό το ίδιο περίγραμμα και εικονίδιο" (Listen looks nicer than Buy; Buy should get the same outline and an icon). Four options were rendered on the real cards: filled ink as shipped, the outline variant with the Store Blood edge, the Listen chrome with a neutral icon, and the Listen chrome with a Store Blood icon. The label chose the Listen chrome with a neutral icon: dark face, 48% white hairline edge and inset shadow at rest; on hover and keyboard focus, Listen's highlight with the Store Blood hover edge instead of amber; the Store Blood active edge on press. Busy and disabled read as rest, the footprint stays fixed and the family's 2px focus ring stays. Icon study: a Lucide shopping bag at 18px was rejected as too big and too literal; the Lucide plus was liked; of eight GPT vinyl concepts, all solid discs, "01 Rim add" was chosen and redrawn on the 18-unit grid: disc centre (7.5, 7.5) radius 7, a 3px spindle hole, a 1.5-unit groove arc, a square notch and a 6 by 6 plus at 12..18, 146 px² of ink. It renders at 18px, the large button's icon size, so the arms and hole stay pixel-aligned; 16px and 14px were rasterized and rejected because every edge went grey. The mark is static, decorative (`aria-hidden`) and inherits the text colour (`StoreBuyIcon.tsx`); the label sits in its own span so Adding and Added keep the mark. Format icons, 8 October 2026: the label preferred realistic renders, so the mark became one per format (vinyl, CD, cassette; clothes and other goods keep the record), chosen from `getStoreDistroFormatGroup`. Each is a stack of full-canvas SVG layers from `components/store/buy-icons/` (5 to 10 KB per format): a still base with all light, one spin layer per turning part (vinyl and CD print, the two cassette reels) and a still top with the plus. Light never turns, as on a real turntable. Images keep each layer's gradient ids private. Motion is a single flick (one turn, 1 s, `cubic-bezier(0.2, 0.6, 0.35, 1)`) on press, mouse entry or keyboard focus: the presentation script sets `data-store-card-buy-flick` and clears it on `animationend`, and `global.css` plays the turn only without reduced motion. Home sat 6 Brotli bytes under its eager budget and the flick costs 79, so Home's budget grew 1 KiB (105 KiB) rather than trading the flick for CSS-only hover, which snaps back when the pointer leaves mid-turn. A slow hover turn was built and dropped for the flick; continuous motion was rejected because a grid of moving marks competes with the covers. The flick starts at speed because the phone bag covers the card about half a second after the tap. Reduced motion shows the still stack. A first single-file realistic record (113 KB) was cut apart by hand and replaced by these purpose-drawn layers. Pre-order stays unchanged: the filled primary face with its Sea green base line and no mark, so the two purchase states stay distinct.

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
