# Proposal

## Why

Public-site buttons come from four competing sources (the shadcn primitive, `@layer components` classes, inline utility strings and unlayered overrides), so heights run 36 to 56px, corners mix square, rounded and pill, focus has five treatments and the header menu toggle has none. The Listen study (docs/design-inspiration.md, 2026-09-23/24) was run to inform this redesign; the user chose the Quiet direction with Bebas Neue labels and a compact scale on the BlackBox Button Family canvas (https://claude.ai/artifact/C5Lmv5FNLdqCRPnSFJtVGi, iteration 4, 2026-09-30).

## What Changes

- One button family for `apps/web`: square, charcoal or ink faces, Bebas Neue caps labels, one focus ring, finite tonal motion. Sizes S 32 / M 36 / L 44 with a transparent 44px hit area on coarse pointers. The shadcn `Button` becomes the single source; raw `<button>` and `<a>` controls move onto it and superseded CSS is deleted.
- Tone follows the route: store and services sections declare a tone once and outlined buttons inside inherit Store Blood or Services Rose; no per-button accent classes.
- Listen keeps its face, border, amber equalizer and 820ms motion; only its label moves to Bebas and its contents are re-centred. Standalone Listen drops from 48 to 44px so it shares a row with L actions.
- Header cart control: shopping-bag icon at the family icon size with the round count bubble; present only when the cart has items or the route is a store route. Focus returns to the trigger, or to the main landmark when the trigger is not rendered.
- Feedback in place: Add to cart shows Added for four seconds; Remove leaves a six-second Undo line; Stop asks once in place before destroying the session; the Pay control fills from charcoal to ink when the shipping quote arrives; the cart's Checkout control carries the subtotal.
- Information, not controls: purchase status (Sold Out, Out of Stock, unavailable) renders as a non-interactive status in the purchase slot; roster filter chips show their match counts; text actions inside list rows recede to 60% until the row is hovered or focused; buttons that open another site carry a small mono ↗ mark.
- 404 page buttons join the family and the Home link's leftover Jekyll href is fixed.
- Removed: unused `secondary` and `destructive` button variants, dead button CSS (`.store-coverflow-actions__toggle`, `.artist-detail-action--primary`, listen `__indicator`, unused Listen modifiers).

## Capabilities

### New Capabilities

- `public-controls`: shared behaviour of public-site buttons, chips, icon controls and text actions: sizes and touch targets, focus visibility, label form, loading and disabled behaviour, status-versus-control distinction, route tone inheritance, external-link marking and reduced motion.

### Modified Capabilities

- `app-shell-and-player`: the header cart control is rendered only with items in the cart or on store routes, keeps its label behaviour otherwise; drawer close returns focus; Stop in the floating player arms for one press before ending the session; Listen keeps its equalizer while its label face changes.
- `commerce-checkout`: cart convenience state gains an in-place Added confirmation and an Undo window after Remove; the cart Checkout action shows the subtotal; the Pay control's pending state is charcoal with a written reason and fills when the quote is ready; the non-buyable purchase status is a status element in the purchase slot at the family's L geometry (44px high, 14rem wide), compatible with the active `clarify-store-sold-out-presentation` change.

## Impact

- `apps/web/src/components/ui/button.tsx` (rewrite), `apps/web/src/styles/global.css` (tone rules, hit halo, deletions, cascade fixes), every public component and page that renders a button (store, cart, checkout, services, newsletter, artists, releases, shell, player, header, footer, 404).
- `apps/web/src/components/app-shell/view/ShellPortalOutlets.tsx` (cart visibility), `AppShellRoot.tsx` (drawer focus return), `ShellPlayerSurface.tsx` (armed Stop).
- Tests: component tests for the touched components, `music-listen-trigger-css.test.ts`, `app-shell-code-splitting.test.ts` strings kept; e2e player specs press Stop twice. `apps/backend/scripts/smoke-content-preview.mjs` stops using the header Cart button as its hydration check on non-store pages.
- Docs: DESIGN.md §5 Buttons, DESIGN.json button components, docs/design-inspiration.md study entry. No new dependency; Cloudflare Free tier unaffected.
