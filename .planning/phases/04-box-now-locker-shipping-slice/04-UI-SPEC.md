---
phase: 4
slug: box-now-locker-shipping-slice
status: approved
shadcn_initialized: true
preset: blackbox-storefront-store
created: 2026-04-19
---

# Phase 4 — UI Design Contract

> Visual and interaction contract for the Greece-only BOX NOW locker-selection slice. This phase defines how shipping selection appears before payment without breaking the BlackBox storefront tone or the already-locked dedicated checkout flow.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | blackbox-storefront-store |
| Component library | radix via shadcn primitives |
| Icon library | lucide-react |
| Font | Bebas Neue for display, Inter for body, Geist Mono for utility/meta text |

**System rule:** Extend the Phase 2 storefront language. Do not introduce a separate courier portal aesthetic, bright utility-dashboard colors, or a generic checkout wizard look. The locker step must feel like part of the same BlackBox purchase flow.

---

## Experience Principles

1. Shipping selection is a calm pre-payment checkpoint, not a new product experience.
2. Greece-only shipping must be explicit and honest, never hidden in late validation.
3. The locker choice should feel decisive but lightweight: choose locker, confirm, continue to payment.
4. BOX NOW remains visually subordinate to the BlackBox storefront; it is a shipping method inside the site, not a co-branded takeover.
5. The flow must fail closed cleanly. If locker selection is unavailable, the shopper gets a clear stop state before payment.

---

## Flow Contract

### Locked flow shape

`Product Detail -> Buy Now -> Checkout Route / Shipping Step -> Locker Selected -> Payment Step -> Return / Cancel`

- The dedicated checkout route becomes a two-step surface:
  - `Step 1`: shipping / locker selection
  - `Step 2`: payment
- Stripe payment UI stays hidden or inactive until a valid locker is selected.
- There is no separate shipping-method chooser in MVP because the only shipping path is Greece-only BOX NOW.
- There is no non-Greece fallback path in MVP.

---

## Screen Contract

### Product detail shipping notice

- Purpose: set expectations before the shopper enters checkout.
- Placement: directly below the `Buy Now` CTA or inside the purchase panel support area.
- Content:
  - short shipping label: `Shipping`
  - message: `Greece only via BOX NOW lockers`
- Tone: informative, not apologetic.
- No shipping calculator, no country dropdown, no multi-method comparison.

### Checkout route — shipping step

- Purpose: collect a valid Greek locker before payment begins.
- Layout:
  - Desktop: 2-column split
    - main column: locker-selection surface
    - side rail: product summary + shipping summary
  - Mobile: product summary first, shipping step second
- Required header block:
  - Eyebrow: `Shipping`
  - Title: `Choose your BOX NOW Locker`
  - Supporting line: `Available for Greece orders only`
- Step indicator:
  - `1. Locker`
  - `2. Payment`
- The payment step should be visible as upcoming, not active.
- Primary action after selection: `Continue to Payment`
- Secondary action: `Back to Product`

### Locker picker state

- The official BOX NOW widget/picker should live inside a contained dark panel, not free-floating on the page.
- The surrounding page should provide:
  - short instruction line
  - visible selected-locker summary outside the widget
  - clear continue button only after a valid selection
- Do not surround the widget with dense explanation blocks.
- Do not place payment UI beside an unconfirmed locker picker state.

### Selected locker confirmation state

- Once selected, show a compact confirmation card above the continue action.
- Required fields shown to the shopper:
  - locker label/name
  - `Greece`
- Optional support line:
  - `You can change this before payment`
- No expanded address dump by default, since v1 stores only the thinnest operational data set.

### Payment-ready step

- Once a locker is selected, the checkout route transitions into the payment state.
- Layout:
  - Desktop: main column becomes Stripe embedded Checkout, side rail retains product + selected locker summary
  - Mobile: selected locker summary sits above the Stripe surface
- The selected locker summary remains visible during payment.
- Heading:
  - Title: `Checkout`
  - Supporting line: `Secure payment powered by Stripe`
- The shipping step should remain reachable through a low-drama `Change Locker` action.

### Non-Greece blocked state

- Purpose: stop non-Greek shipping before payment.
- Placement: on the checkout route before payment activation.
- Heading:
  - `Shipping limited to Greece`
- Body:
  - `This launch currently ships only to Greece through BOX NOW lockers.`
- Actions:
  - `Back to Product`
  - optional low-emphasis `Return to Store`
- No waitlist, no email capture, no fake “coming soon” checkout continuation.

### Locker lookup / widget failure state

- Purpose: fail closed if BOX NOW locker selection cannot complete.
- Heading:
  - `Locker selection unavailable`
- Body:
  - `We couldn’t load BOX NOW locker selection right now. Payment is unavailable until a locker can be selected.`
- Actions:
  - `Try Again`
  - `Back to Product`
- Do not expose the Stripe payment step behind this error.

### Return and cancel states

- Return and cancel states stay consistent with Phase 2 and remain non-authoritative for payment success.
- Return state should now include the selected locker summary block if available.
- Return heading remains:
  - `We’re confirming your payment`
- Cancel heading remains:
  - `Checkout canceled`
- Locker details may be shown as informational context, not as fulfillment proof.

---

## Component Contract

### Shipping eligibility note

- Compact inline block within the product purchase panel.
- Use muted text with one small uppercase label.
- Should not visually compete with price or `Buy Now`.

### Locker picker shell

- Dark bordered container that frames the third-party BOX NOW picker.
- Minimum content around the picker:
  - heading
  - 1 short instruction line
  - widget area
  - selected-locker summary
  - continue action
- No ornamental illustrations or courier-themed graphics.

### Selected locker summary card

- Small dark summary card.
- Use one strong row for locker label/name.
- Secondary row may show `Greece`.
- Keep the card compact enough to remain visible above payment on mobile.

### Shipping status banner

- Used for non-Greece blocked state and widget failure state.
- Neutral/dark first; accent only for action emphasis.
- Do not use danger-red error styling unless the action is actually destructive.

### Step header

- A small two-step progress strip is allowed.
- It should feel editorial and restrained, not SaaS-onboarding-like.
- Completed/active step emphasis should use the existing store accent sparingly.

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline separators and indicator gaps |
| sm | 8px | Tight metadata and status spacing |
| md | 16px | Default component spacing |
| lg | 24px | Card padding and section spacing |
| xl | 32px | Step transitions and rail spacing |
| 2xl | 48px | Major section breaks on checkout route |
| 3xl | 64px | Desktop page-level breathing room |

**Spacing rule:** The shipping step should feel calmer than the product grid. Give the widget and selected-locker summary enough vertical space that the route reads as a checkpoint, not a cramped form.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.65 |
| Label | 12px | 500 | 1.3 |
| Heading | 32px | 400 | 1.05 |
| Display | 56px | 400 | 0.96 |

Additional rules:

- Major route headings use `Bebas Neue`.
- Body and support copy use `Inter`.
- Step labels, shipping metadata, and locker helper text may use `Geist Mono`.
- Shipping and failure states should stay concise; do not let courier copy expand into paragraphs.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0d0d0d` | Background and canvas |
| Secondary (30%) | `#141414` | Panels, widget shell, summary cards |
| Accent (10%) | `#922f3f` | Continue action, active step, selected emphasis |
| Warning / blocked neutral | `#6b6b6b` | Blocked-state framing and subdued warnings |

Approved supporting tokens:

- Hover accent: `#b4465a`
- Active accent: `#cf6b80`
- Accent surface wash: `rgba(146, 47, 63, 0.14)`
- Border: `#262626`
- Muted foreground: `#b3b3b3`

**Color rule:** Do not give BOX NOW its own bright branded palette inside the route. If partner branding appears inside the widget, the surrounding page chrome must remain BlackBox-native.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Shipping note on product detail | `Greece only via BOX NOW lockers` |
| Shipping step title | `Choose your BOX NOW Locker` |
| Shipping step support line | `Available for Greece orders only` |
| Continue CTA | `Continue to Payment` |
| Change action | `Change Locker` |
| Blocked geography heading | `Shipping limited to Greece` |
| Widget failure heading | `Locker selection unavailable` |
| Widget failure body | `We couldn’t load BOX NOW locker selection right now. Payment is unavailable until a locker can be selected.` |

Copy rules:

- Tone stays direct, calm, and operational.
- No logistics jargon such as `voucher issuance`, `parcel orchestration`, or `origin/destination`.
- Do not imply a second shipping method exists.
- Do not imply payment can continue without a valid locker.

---

## Interaction Contract

- `Buy Now` does not jump straight into active payment anymore; it enters the shipping-first checkout route state.
- `Continue to Payment` stays disabled or unavailable until a locker selection is valid.
- `Change Locker` must return the user to the locker-selection state without abandoning the route.
- Non-Greece shoppers must never reach active payment.
- Widget failure must block payment and offer retry/back actions only.
- Return/cancel pages may show the selected locker context, but never treat it as fulfillment proof.

---

## Responsive Behavior

- Mobile-first layout is mandatory.
- On mobile:
  - product summary appears first
  - locker picker fills the main flow width
  - selected locker summary sits directly above the continue/payment action
  - payment step keeps the locker summary above the Stripe surface
- On desktop:
  - main column contains shipping or payment step
  - summary rail remains visible for product + locker context
- No horizontal scrolling.
- Minimum tap target for actions remains `44px`.

---

## Accessibility Contract

- A visible text heading must sit above the BOX NOW picker.
- Selected locker details must be rendered as text outside the widget so the choice is understandable without interacting with the embedded picker again.
- Failure and blocked states must use explicit headings and action labels, not color alone.
- Step progression must be readable without relying only on accent color.
- `Continue to Payment` must expose a clear disabled/inactive state when no valid locker is selected.

---

## Motion Contract

- Motion stays restrained:
  - light route-state transition between shipping and payment
  - subtle emphasis on the selected locker summary
  - no map-pop animation theatrics, no courier-tracker gimmicks, no progress-wizard bounce

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | `card`, `button`, `badge`, `alert`, `separator`, `skeleton` | not required |
| third-party registries | none | shadcn view + diff required before use |
| external embedded surface | official BOX NOW picker/widget shell only | wrap in local container, do not inherit third-party page chrome |

---

## Non-Goals

- No non-Greece shipping path
- No shipping-method comparison
- No courier-rate selector
- No fuller locker-address profile by default
- No label generation UI
- No internal fulfillment dashboard
- No payment continuation without valid locker selection

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-19
