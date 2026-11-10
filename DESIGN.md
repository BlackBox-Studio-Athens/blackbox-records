---
name: BlackBox Records
description: Current visual contract for the BlackBox Records public site and storefront.
---

# Design System: BlackBox Records

## Scope and identity

**The Working Distro Table:** black record sleeves, photocopied show listings, practical service notes, music imagery and a curated distro shelf. Keep the public site dark, direct, editorial and label-operated. Commerce and service inquiries share that identity.

[PRODUCT.md](PRODUCT.md) owns users, purpose, voice and anti-references; [Staff guidance](#staff-workspace) routes internal surfaces. This file records current public visual rules. Research/history belongs in [design decisions](docs/design-inspiration.md) and the relevant OpenSpec change.

## Colors

Monochrome grounds, off-white titles and quiet body text carry the page. Accent clarifies meaning; no route has its own accent, and accents never wash ordinary pages or recolor public titles. Store Blood, Services Rose, Violet and Slate are retired public accents.

### Palette and roles

- **Void** (`#0d0d0d`): Body, page ground and footer
- **Ink** (`#f5f5f5`): Primary text, public titles and shared focus ring
- **Black Card** (`#0f0f0f`): Popovers, panels and framed bases
- **Charcoal** (`#141414`): Catalog cards and repeated editorial surfaces
- **Hover Surface** (`#161616`): Tonal hover/focus-within lift
- **Soft Muted** (Flint 400, `#abb5b8`): Secondary text, credits, dates, counts, status and inactive header links; 9.3:1 on Void, 8.8:1 on Charcoal
- **Borders** (Flint 900 `#212729`; 850 `#262c2e`; 950 `#1a2022`): Hard Border: token/input strokes and Store tab line. Deep Border: frames/dividers/control edges. 950: quiet edge
- **Control Ink / Primary Inverse** (`#e8e8e8` / `#090909`): Neutral filled action and its dark label; face becomes Ink on hover
- **Flint** (700 `#626e72`; 800 `#4d595c`; 500 `#889396`; 300 `#c1cbce`; surface `rgba(98,110,114,.16)`): Buy/Add to cart faces; browse edges; tags, kickers, artist links, selected filters, current underlines, Store Sold Out/Only N left and form errors
- **Amber** (500 `#e3b56c`; 300 `#f0d7b0`; surface `rgba(227,181,108,.16)`): Listen edges/bars, In player, date/catalog marks, dots, format marks, hover underlines, input focus edges and footer meta/Est. 2026; never a control face or title
- **Sea Green** (700 `#2d766a`; 800 `#256258`; 500 `#4ca999`; 300 `#7cc7b9`; surface `rgba(45,118,106,.16)`): Pre-order actions and information, including a pre-order cart's Checkout. Never ordinary stock or page washes
- **Error red** (700 `#bc4945`; 500 `#e4706a`; surface `rgba(188,73,69,.16)`): International restriction icon/edge/text, plus the editorial Releases Sold out edge below. Never a control face; form errors remain Flint 300

Flint's cool-gray hue (OKLCH h215, C .012–.016) reads as a neutral. Informational neutral tints use C .008–.012 while preserving lightness; grounds and Ink remain unchanged. Store search and Grid/Crate frames use Flint 700. Flint 700 with an Ink label is 4.8:1; Flint 500 on Charcoal is 5.8:1. Sea 700 with an Ink label is 4.9:1; Sea 500 on Charcoal is 6.5:1. Error 500 on Charcoal is 6.0:1.

Runtime tokens live in [global.css](apps/web/src/styles/global.css): `--flint-*`, `--amber-*`, `--sea-*`, their `--*-surface` tokens and `--error-700/500`. `--preorder-accent`, `--preorder-accent-active` and `--preorder-accent-surface` remain Sea aliases. This table describes the approved palette, not a second token implementation.

## Typography

Veneer gives public content a physical, letterpress character. Bebas Neue keeps controls and dense UI compressed and clear. Inter carries reading text; Geist Mono supplies existing technical-feeling, public-safe metadata.

- **Brand display:** Veneer, Bebas Neue, Impact, sans-serif. 900; line-height .98.
- **UI display:** Bebas Neue, Impact, sans-serif. Navigation, buttons, prices, cart/checkout chrome, totals, controls and dense operational labels.
- **Body:** Inter, Helvetica Neue, Arial, sans-serif. 400; .95rem; line-height 1.7; normal tracking.
- **Label:** Inter, Helvetica Neue, Arial, sans-serif. 500; .72rem; line-height 1; .22em tracking.
- **Mono:** Geist Mono, Courier New, monospace. 400; .74rem; line-height 1.35; .12em tracking.

Brand sizes: Display `clamp(2.35rem, 8.5vw, 4.15rem)`, .04em tracking; Headline `clamp(1.7rem, 6vw, 2.65rem)`, .04em; Title `clamp(1.55rem, 4.6vw, 2.05rem)`, .035em. Display serves heroes and major features; Headline serves sections/groups; Title serves public content names. Surface-specific scales below take precedence.

**Public titles:** Veneer owns artist, release, Store/distro, service and editorial titles, including cart/checkout item names. Bebas remains the UI display face. A public content title containing Greek uses self-hosted Inter 600 for its entire text, including Latin words in a mixed title. Latin-only titles retain Veneer. Preserve casing, size, wrapping, links and layout; credits, prices, controls and Staff keep their treatment ([Greek title decision](openspec/changes/fix-greek-public-titles/design.md)).

**Store listing scale:** artwork → actual format → title → artist/label → lifecycle → price/action. Format is plain ink Inter semibold 13/16px capitals, without a leading mark. Titles are source-cased Veneer 900 at 20–24px. Credits use Inter medium, 16px phone/17px desktop: muted “by”, ink name, Flint underline only for verified independent artist links. Prices are Bebas 20px phone/24px desktop. Apply across All, BlackBox Releases, Distro and populated Merch; item pages, cart and checkout retain their own scale.

Keep metadata subordinate to content names. Long prose reads near 65–75 characters per line. News articles use a 46rem card at 16px; About's text column stops at 46rem. Running paragraphs in both stop at 34rem, about 70 characters.

## Page frame, cards and depth

Header, editorial routes and footer share `.layout-container`: `--page-max-width: 72rem`, with gutters 16px below 640px, 24px from 640px and 32px from 1024px, never smaller than the safe-area inset. Store collections raise only the maximum to 90rem. Modules add no second gutter; News cards pad 16px.

Header and Home hero film/still/shade may bleed. Home video/photo chapters span the viewport above 800px. Cover-only chapters, all chapters at 800px and below, swipe rows, section/footer rules and the hero divider stop at the frame. Veils over the fixed hero photo may span the page without a visible edge.

Cards are square, flat, image-led frames on Charcoal or Black Card, with artwork on Void. Use Deep Border for explicit frames and Hard Border for token primitives. Padding is normally 1–1.5rem, or .75rem in dense metadata. Hover may change border/background and subtly scale an image; it does not lift or move the card. Use complete square catalog artwork. Avoid rounded ecommerce cards, decorative icon grids, side-stripe accents, gradient text and default glass effects.

Heavy shadows identify floating UI only: overlay `0 28px 90px rgba(0,0,0,.56)`; mini player `0 14px 30px rgba(0,0,0,.32)`. Repeated cards have no shadow.

Artist roster photos preserve the complete 3:4 frame. Columns: one below 360px, two from 360px, three from 1280px. Phones use 16px row/12px column gaps, 12px copy padding and 20px titles. Count stacks above Latest with a top hairline on phones; otherwise the Bebas 28px count/12px tracked label sits beside Latest, separated by a hairline, with Flint Latest and an amber date. Keep the rendered count wording and wrapping under enlarged text.

## Shared controls

Use [button.tsx](apps/web/src/components/ui/button.tsx) and its `.site-button` rules. Controls are square, flat and typographic, behind the artwork. Default action height is 44px, Bebas 16px capitals, .06em tracking, 1px baseline adjustment, 16px horizontal padding and 112px minimum action width. The hero is the sole 48px height exception. Icon controls and text-action rows retain 44px targets.

- **Neutral:** Control Ink with Primary Inverse label; Ink hover. Pay/Continue to Payment, Subscribe, Show N items, Send inquiry and hero at rest
- **Buy:** Flint 700 with Ink label; hover/press Flint 800 and Flint 500 edge
- **Pre-order:** Sea 700 with Ink label; hover/press Sea 800 and Sea 500 edge; Home Soft edge exception below
- **Inverse/browse:** Charcoal, Flint edge, Ink label: Read News, View Full Roster, Continue shopping
- **Outline:** Charcoal, Deep Border edge, Ink label; tonal hover. Icon controls use a quieter neutral edge with no accent
- **Listen:** Charcoal, Amber 500 edge/bars, Ink label; hover uses amber surface with the same edge
- **In player:** Disabled amber status, Amber 300 text on amber surface; identifies the shell session, including a paused provider, without claiming verified playback
- **Filter chip:** Charcoal, quiet edge, muted label; selected: Flint edge/surface, Ink label and check mark. Pre-orders selects in Sea. May show result count
- **Text/quiet action:** Inter 13/500 in a 44px row; hairline underline, amber hover. Store Clear filters: Inter 700, 16px (15px phone), 2px underline and leading ×

Ordinary adjacent action pairs use one filled control and its outlined twin at equal height. Price is text, so one filled action may sit beside it. The Home phone/cover-only Pre-order/Listen pair follows its scoped composition below.

Hover is tonal on hover-capable devices; press darkens without shifting geometry or labels. Focus is a 2px Ink outline with 2px offset; inputs additionally take an amber edge. Disabled opacity is 45%. Loading keeps width, sets `aria-busy` and changes the label. Tags such as News genres use a Flint edge/text and compact tracked type, not decorative pills.

Feedback stays in place: Add to cart becomes Added; Remove leaves Undo; Stop ends the player on its first activation; Pay fills when the quote is ready. Do not add toasts or confirmation dialogs for those actions.

**Icons and action meaning:**

| Surface            | Label and icon                                                                                                   | Activation                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Store Grid/Crate   | Buy for every format, static 18px Disc3; retain it for Adding/Added. Pre-order keeps its truthful label/Sea face | Read live offer, add one copy and open cart |
| Editorial Releases | Buy vinyl/CD/cassette or corresponding Pre-order; vinyl uses static Disc3, CD/cassette retain StoreBuyIcon       | Native edition navigation                   |
| Store item page    | Add to cart and existing icon treatment                                                                          | Existing cart action                        |

Intrinsic Store/Release listing controls use at least 112×44px, 16px padding, 18px icon and 8px icon/text gap, without growth. Labels may wrap under enlarged text. Below 40rem Store Buy/Pre-order takes its own full-width line under price, 12px padding and no minimum width; height stays 44px. Reserve 88px for the purchase row; price without Buy sits on its bottom line. From 40rem retain the side-by-side row and right-aligned Buy.

The Listen mark is five amber bars, shared by controls, modal heading and mini player. Hover/focus and modal entry run two brief cycles then settle; reduced motion is static. Preserve the dark face, Player Ready and shell lifecycle. There is no continuous catalog-wide animation or inferred playback.

## Availability and pre-order components

Status is information, not a disabled-looking action. Do not expose raw provider identifiers, runtime details or stock counts except the staff-enabled Only N left notice.

| State                      | Store/item/cart/checkout              | Editorial Releases               |
| -------------------------- | ------------------------------------- | -------------------------------- |
| Stocked, ready             | Buy/Add to cart; optional Only N left | Format-aware Buy                 |
| Open pre-order with copies | Sea action and plain Sea status       | Format-aware Sea Pre-order       |
| Coming Soon / Repressing   | Static dashed neutral status          | Static dashed Flint status       |
| Sold Out                   | Static solid Flint status             | Static red edge, as scoped below |
| Technical pause / unknown  | No status/Buy; ready-price rule below | Same; no invented fallback       |
| Pending without projection | No asserted purchase facts            | No state, price or Buy           |

Stocked items have no routine stock label. Static zero-stock statuses occupy the purchase slot. Paused/unknown offers retain price only under existing ready-price rules. Editorial Releases Sold out uses a solid 1px Error 700 edge, pale text and transparent/near-black interior on cards and direct/overlay purchase blocks only.

Staff chooses the zero-stock lifecycle. Out of Stock, Currently Unavailable and shopper “Unavailable” labels are retired. A pre-order with no remaining copies uses the ordinary zero-stock state, with no pre-order status or action; ended pre-orders use ordinary Buy without a pre-order marker. Digital availability never establishes physical stock.

Item-page Coming Soon/Repressing adds a 14px disc/circular-arrow icon and “First pressing on its way”/“More copies being pressed”, followed by “· Expected Month YYYY” only while that month has not passed. Sold Out has no icon or explanatory line.

**Only N left:** show only when Staff enabled Show copies left and the real online count is 5 or fewer. Store cards place it beside Buy in the status chip's box, with Flint edge/surface. Item pages use a 28px tab fused to Add to cart's top edge, matching width, square 1px border and display type. No pulses, dots, countdowns, fake urgency or color-only meaning.

**Notify me:** Coming Soon/Repressing may show the quiet mail action “Email me when it lands”. It opens an inline Email field, unticked one-off consent, Send and Cancel. Errors use visible Error plus Flint 300 text beneath the relevant control; success replaces the form inline. No modal or toast.

Pre-order components reuse shared controls/cards and [global.css](apps/web/src/styles/global.css):

- `.store-item-card__preorder` / `.preorder-badge`: plain Inter 13/20 Sea 500 text, left-aligned below identity/format; retain Only N left if present. Only approved Home video/photo backplates above 800px use boxed status. `.store-item-card__release-status` is the Soft Muted Digital out now twin on surfaces that retain it.
- `.preorder-facts`: Sea outline, Inter label/value rows, at least 4.5:1 text contrast.
- `.preorder-notice` / `.preorder-rail`: outlined tinted ships-together panel; solid Today step and dashed estimated-arrival step.
- `.preorder-edge`: 2px Sea top edge on the return panel.
- `.store-preorder-filter` / `.store-preorder-notes`: 44px filter with Sea count/selected edge/surface/check mark, plus a three-note strip with Sea top edge.

## Store browsing and item pages

Collections have a visually hidden H1 (All/category), category links first and one 44px toolbar row. No visible Store/category introduction or side pane. The compact purchase note follows the grid or empty state at every width, then the international restriction strip.

Below 1024px: Search Store and one Filter chip, with a reserved box and applied-choice count in Flint. Its bottom sheet orders Formats, Availability (Pre-orders), View (Grid/Crate), Artists, then neutral Show N items; it owns one Back entry. From 1024px: Search, Formats menu, Artists menu, Pre-orders, Grid/Crate and result count. Native desktop popovers add no history entry.

Formats retain Distro links/counts; phone options wrap as square chips, selected in Flint with check marks, never a horizontal scroller. Without JavaScript, Formats/Filter open the native Formats menu so links remain reachable. The multi-artist checkbox filter has counts, no All artists choice, Find an artist to narrow unticked names, and ticked names pinned under Selected · N with artists-only Clear. Moving a checkbox preserves focus; the desktop Artists · N chip gains the Flint selected edge.

Grid is continuous and default: five columns from 1280px, four from 1024px, three from 640px, two from 360px and one below; gaps are 20px desktop/16px phone. At 1440px cards are 259.2px. Preserve readable wrapping and the stable bottom price/action row rather than clipping to force equal content.

Crate requires explicit selection and one format: 12-inch vinyl crate, flipping CD bin or spine-out tape rack. A format needs at least seven items; All formats is always Grid. The 44px Grid/Crate switch appears only for a Grid format with a bin: two glyph segments (2×2 grid/stacked crate), Flint 700 frame, pressed segment in Ink. It stays below the desktop header; phone View lives in Filter, which closes before Crate opens.

The bin has A–Z dividers and a logo back board; its item-in-hand card sits beside it on desktop/below on phones, keeping purchase row and Buy visible. Keep the letters rail/counter. A drag past the tipping point drops a sleeve onto the pile; one drag, flick or wheel notch turns one sleeve. Search, artist or pre-order filtering uses Grid. In Crate, format links move between bins and All formats returns to Grid.

**Order and membership:** All contains BlackBox releases in ascending catalog-number order, then Distro by displayed artist/band or label credit A–Z, then title/slug (`sortAllStoreCollectionEntries`). Pre-orders get no sorting priority and there is no Sort control. Grid, bins and artist/text filtering preserve that sequence. BlackBox Releases, Merch and Home retain their own ordering. Distro contains only Distro sources in band A–Z order; release-sourced BlackBox items belong to All/BlackBox Releases. Format links filter cards in place with artist/text filters; on All they open the corresponding Distro group. Do not add a New release row to the lifecycle card composition.

A native card link covers the card; independent artist, Listen and Buy actions retain their own targets. Title underline is faint at rest and full on card-link hover/focus; card border/surface lift only on hover-capable input. Hovering Buy/Listen leaves the card at rest.

Store Listen sits bottom-left on artwork only when a source exists: icon-only 44×44px below 40rem, named “Listen, <title> by <artist>”; labelled 112×44px from 40rem. Only its button intercepts input. The Crate item-in-hand keeps Listen in flow. Source-less items omit it without changing the bottom purchase row. Reopen/Stop remain in the floating player, with 44px phone controls; Stop/source switching resets previous Listen controls.

Item pages use complete artwork capped at 26rem beside purchase information on desktop; phone order is identity, artwork, purchase information. Info and populated format-matching Tracklists share the next row. Preserve More views and listening actions. Item titles remain Veneer (Greek exception applies), credits Inter and prices Bebas.

**Phone buy bar:** below 40rem, while the inline purchase action is still below the viewport, show the same price, item's Sea status or Only N left, and 44px purchase action with Adding/Added/cart behavior. Use Black Card, Deep Border top edge, no blur/shadow. Rise in 300ms `cubic-bezier(.16,1,.3,1)`; leave in 195ms `cubic-bezier(.7,0,.84,0)`, transform/opacity only with explicit resting values. It is present without entrance motion at first paint; reduced motion switches instantly. After reaching the inline action it stays absent below it, returning only above it; hidden means `inert`. Mini player lifts above it. No bar for status-only items, item checkout or widths from 40rem.

## Editorial Releases

Releases uses the page frame without an outer box or visible section labels. Preserve two stacked featured rows, complete square covers, equal cover/copy halves with 1.5rem gaps from 640px and 29rem covers from 1024px. Catalog is one/two/three columns with 1.5rem gaps. Editorial source order/roles never change because of live offers.

Cards share this DOM/visual order at every width:

1. Title/band, separated by 4px.
2. Purchase/status, optional Listen, then existing price in one wrapping row, 12px after identity with 16px gaps.
3. Formats 4px after the action row; supplied shipping/applicable terms 8px after facts.
4. Digital date/catalog 12px after the final group, then summary/Read more.

Catalog scale: Veneer 32/36 title, Inter 16/24 artist, 13/20 format/helper, Bebas 24/28 price, 12/18 metadata. Preserve larger featured/detail headings and featured prices. Price is plain centered text after Listen, with no far-edge auto margin. Controls/price wrap in DOM order; missing Listen adds no placeholder. Detail retains its purchase block, copy/date positions and no-price policy.

Use the shared intrinsic controls and availability rules above. Remove routine In stock, Digital out now, duplicate badges, generic View details and bracketed edition presentation from these surfaces. Complete artwork and native purchase actions retain their existing edition destination; title links reach release detail. Listen stays independent in the action row below identity, never over artwork.

Physical format text is an underlined native link with at least 44×44px target only to verified existing destinations. Announced may link to release detail; unmapped formats stay plain. Preserve modified clicks and external target/rel; never invent a CD route.

Metadata reads “Digital release · [date]” plus catalog, with semantic time. Offers never rewrite it. Without a date, omit only the digital fragment and retain catalog. Detail uses its existing date position, with no duplicate purchase metadata; omit the entire digital label/date/separator when dateless. Never put catalog numbers over artwork or add a badge/stamp/row.

Shipping remains independent of digital timing; pre-order terms are conditional with no reserved blank row. Preserve SSR projections on failed reads, disposal/navigation cancellation and cache reset. When a successful live read removes the focused Buy, transfer focus to its existing mapped format link, falling back to the existing title destination. Do not focus static status, invent a visible link or steal focus elsewhere.

The geometry and 44px targets are approved BlackBox choices, not a universal empirical ratio or an AA claim. Research and acceptance live in the [quiet-release change](openspec/changes/simplify-release-purchase-presentation/design.md).

## Home pre-order chapters

Chapters follow the introduction and precede News. Use accepted original artwork, never sampled screenshots; film posters never repeat a sleeve. Keep the artist link, ink public title, truthful lifecycle, Bebas format/price, purchase/Listen, shipping once and a clearly spaced Pre-order & delivery information link. Omit repeated payment/whole-parcel prose. Artwork is noninteractive; accepted artist paths are subtle profile links, otherwise plain text. Down-arrows link to the next chapter with descriptive accessible names.

**Released chapters.** Staff can keep a released item on Home after its pre-order closes (Show on Home). Open pre-orders come first, then kept releases, newest first. Media, Listen and Watch full video are unchanged; only the purchase block reads the offer. In stock: the Flint Buy action (Buy vinyl with the disc icon, Buy CD, Buy cassette, otherwise Buy), a muted Out now, no shipping line and a Delivery information link. Sold out: the static Flint Sold out status in place of the action. Sea belongs to open pre-orders only. The closing link reads All pre-orders while a chapter is a pre-order, otherwise Visit the Store.

### Responsive composition

Below 48rem, each chapter is a film strip within 16px gutters: clean 16:9 media band; then 96px sleeve beside artist/title/format-price; status; paired Pre-order/Listen; shipping/international lines; then terms and, if available, Watch full video as a 44px text link. Facts/summary stay on the Store item page. A video chapter always gets a band: prepared silent film, otherwise clip poster, otherwise artist photograph. Without a video use the artist photograph; without either video or photo, start with a 160px sleeve beside identity/price, without an empty band.

From 48rem through 800px retain the intermediate one-column layout. At 800px and below, and in cover-only chapters, format/price share a row, then Sea Pre-order/amber Listen share the next, half each with 16px gap.

Above 800px, video chapters span the viewport with centered 780px/88% copy, dark status backplates, a complete 220px sleeve and a 920px minimum scene that grows with content. Listen joins Watch at lower-right. Photo chapters contain the full photograph in a 520px band over blurred same-photo fill: sleeve left, identity/status/Listen right; facts across below; summary left and purchase/terms right. Pre-order/Listen are 168×44px at default text size and grow with enlarged text. Use CSS placement with one visible/focusable Listen. Cover-only chapters and section links retain their existing frame. Other surfaces retain their own Veneer/Bebas sizes.

### Media and interaction

Native silent footage plays only while at least 15% of its chapter is visible, the tab is visible, no shell music session exists and full video is closed. Reduced motion and data saving retain the complete poster experience. No visible background play/pause icon or caption.

Click/tap the exposed native film to pause/resume, retaining its frozen frame. A descriptive native keyboard control supports Enter/Space and visible keyboard focus. Manual intent is per chapter/clip and survives visibility, music/full-video suspension and responsive-source changes. Drag/cancel, text selection and sibling actions do not toggle it; no captured scrolling. Disabled motion, missing/failed/refused footage provides no active toggle. The hero and full-video provider retain their separate behavior ([approved film interaction](openspec/changes/preorder-background-tap-pause/design.md)).

Only explicit Watch mounts a centered full-video player and Close below the film: full width within phone gutters, capped at 65rem desktop, without duplicate sleeve/details. Close removes it and returns visible focus to Watch. Preserve source IDs, shell synchronization and media lifecycle. Every viewport uses ordinary flow: no competing audio, intercepted scrolling, sticky spacer, scrubbing or additional motion library.

### Home purchase motion

Home's Soft edge is the scoped exception to the general 250ms hover limit. Keep the 44px box and stationary label. Hover/keyboard focus fades to Sea 800 in 385ms and reveals a center-out 1px Sea 500 line in 700ms, inset 6px each side and 4px above bottom, transparent ends, 72% final opacity. Ease `cubic-bezier(.22,.61,.36,1)`; exit 455ms; desktop press immediate.

Touch/coarse/non-hover press enters over 220ms and retreats over 180ms. Hold quick-tap decoration until 220ms from pointer down without delaying native navigation. Reduced motion removes transitions and hold. Preserve shared focus/touch halo. Apply to video/photo/cover-only Home actions only; Store and Releases retain their treatment. [Current Home/palette delta](openspec/changes/accent-and-button-system/specs/store-preorders/spec.md) owns the accepted treatment where baseline prose is older.

## Home hero and motto

Hero montage is the owner's session footage, silent and looped, with high-contrast grayscale baked into files. Every crop excludes the source's BlackBox Studio logo. Use a 9:16 center crop for portrait and landscape for wider screens; no runtime grayscale filter. Play only with at least half the hero visible, visible tab and no music session. No pause/resume icon.

On eligible visits, load film while parsing and retain the dark ground until playback; show no still flash before film or between orientation crops. Fade the playing film in. Show the still immediately without JavaScript, under reduced motion/data saving, on failed source/refused autoplay, or after 2.5 seconds without playback. Film-only shade darkens behind the header/tagline; preserve the motto, ghost fade and scroll cue.

Browse the Store: 48px high, Bebas 18px, 22px start/18px end padding, trailing arrow, neutral face/dark label. Hover/focus raises Flint from the base in 240ms, makes label Ink and moves arrow 6px within the box; reduced motion switches instantly. Place 2.5rem below tagline on phones, 3rem from 48rem, 1.25rem on sideways phones without increasing their hero height.

When the Staff motto ends in Records, Art or Noise, cycle from the written word in that order: first hold 1.2s, later holds 2.3s, scrub 1.1s. A thin white playhead crosses the old word into the new word's length; new text is behind it, old text ahead. During the first two thirds, random horizontal tears and fragments of a filled mirrored session-clip waveform stay clipped within that word; each settles cleanly. No color or effects on preceding words. Keep the rest of the hero's single fade-rise entrance. Reduced motion keeps the written word; pause offscreen/hidden tabs.

## Navigation, footer and player

One shell-owned link model and `.site-nav-link` style serve header, phone Menu and footer sitemap; surfaces change only size. Header labels are 12px uppercase with wide tracking. Current page/tab underline is Flint 500 across sections; ordinary navigation hover is Ink. Footer hover/focus follows its amber exception. Phone Menu starts Home, then main-menu sections; desktop logo links Home. The header control says Menu beside its icon. Touch menu rows, Close and footer links are at least 44px; sitemap wraps without clipping.

Home News/Artists swipe below 40rem within the gutters, with about 42px of the next card peeking. Each dot is a 44×44px button with a small amber current mark.

The header bag appears when the cart has items or the shopper is on a Store route; reserve its box so navigation does not shift. Use the ghost icon, no permanent rectangle on ordinary pages/checkout; keep count, supplementary Cart label, 44px target and keyboard focus.

**Flowing links footer:** desktop 56px logo beside the full Staff-owned description and existing 44px social controls. Below 720px logo is 44px; below 460px logo/socials share row one, with 12px description after. Sitemap flows in DOM order: browsing links, then configured Delivery information, withdrawal and available privacy. Use 44px targets/13px Inter labels, muted support links, amber hover/focus and Flint current underline. Copyright/amber Est. precede the exact AI assistance disclosure with an inset separator; both rules align to the frame. Normal reference height ceilings: 380px at 320px, 360px at 390px, 285px at 768px, 245px at 1440px; longer content/enlarged text grows naturally, without clipping ([footer decision](openspec/changes/redesign-footer-flowing-links/design.md)).

The embedded player belongs to the persistent shell. Retain its modal/mini-player lifecycle, compact readable controls and keyboard access; the mini player appears only after real embed intent. Top-level, Store item and information navigation must preserve the same iframe session through shell handling. Checkout remains native. Reopen/Stop belong to the floating player. Do not move player state into page scripts. Detailed routing, focus, cache and loading contracts live in the [shell/player spec](openspec/specs/app-shell-and-player/spec.md).

## Forms and purchase information

Inputs use Void/near-black, Hard Border, off-white text and muted placeholders, with the existing .225rem field radius. Keep visible focus, disabled noninteraction, textual errors and associations; never color-only meaning. Newsletter order is email, consent, Subscribe at every width, with consent error directly beneath its checkbox. Services General shows no extra-details field and must not submit stale details; other services retain adaptive prompts. Send inquiry uses the neutral ink face.

Item purchase information follows the action as one short shipping note plus Delivery & returns. Authoritative pre-order facts stay above the action without repeated prose below. Cart/checkout show costs before delivery and conditional ships-together information. Pending cart quotes retain Items/Delivery/Total rows; Items shows the cart's fixed-price subtotal and pending amounts use “…”. A cart with pre-orders uses Sea Checkout with a light label; ordinary carts use Ink.

Continue to Payment uses the neutral ink face, with the official white Powered by Stripe badge centered beneath it. Keep address/locker clarification before payment; secondary policy/help and existing legal-guarantee disclosure follow the handoff. Preserve full accepted policies, contextual privacy, optional newsletter consent, global withdrawal access, product safety, artwork, type, columns and responsive layout. Provider/publication authority belongs to its operational contracts, not this visual guide.

## Staff workspace

Staff is a separate dark sans-serif product surface using EmDash APIs, blue actions and its own semantic palette. Public accent/type rules do not override it. [Backoffice design](docs/backoffice-design.md) owns shell/navigation, exact Office stamp artwork, editor/preview, publication review, Overview and current Stats patterns. [Daily brief requirements](openspec/changes/implement-staff-daily-brief/specs/site-analytics/spec.md) define dates, filters and honest source coverage; [current Staff change](openspec/changes/redesign-staff-around-stats/design.md) records later decisions. Private drafts, explicit publication and immediate stock retain separate authority.

## References and maintenance

Use [design decisions](docs/design-inspiration.md) for research/choices, the [pattern guide](docs/ui-design-patterns-guide.md) for local IDs and the personal [Design Library](C:/Users/SVall/.codex/design-library/README.md) for shared references. Historical studies do not override current decisions.

[Agent workflow](docs/agent-workflow.md) owns validation/evidence; [frontend contracts](docs/frontend-agent-contracts.md) own implementation routing. Verify rendered changes, preserve reduced motion and keyboard/focus behavior, and tie acceptance to source. Record decisions in the relevant OpenSpec change, then reconcile current rules here instead of appending conflicting versions.
