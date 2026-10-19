# Proposal

## Why

The approved 15 October 2026 redesign gives public controls consistent size and meaning. The Local audit found seven rendered heights, route-specific pink accents that conflict with that direction; the owner chose the pre-redesign amber Listen treatment on 16 October 2026. The 16 October 2026 revision uses Flint cool gray for buying and labels to preserve the monochrome character, with a separate error red reserved for international restriction notices.

## What Changes

- Replace Store Blood, Services Rose and the superseded purchase accent with fixed Sea Green, Flint and amber roles; extend Flint to muted information and neutral edges, retain ink Veneer titles, use --listen-bars/--listen-edge: var(--amber-500) (#e3b56c), --listen-text: var(--amber-300) (#f0d7b0 In player label), and --amber-surface rgba(227, 181, 108, 0.16) for focus rings, Listen hover and In player surfaces.
- Reserve error red for the non-Greek buyer's item page notice, Store strip, cart drawer and checkout card; keep form-error text Flint 300 and never use red as a control face.
- Establish one 44px control family, with the 48px Browse the Store hero action as its only height exception (owner-approved 16 October 2026; commit 3e8ee282), white labels except on neutral ink faces, and one visible focus treatment.
- Define filled purchase actions, outlined secondary actions, adjacent action pairs, existing Buy format icons, tags, kickers, navigation markers, date/catalog lines and labelled form errors.
- Add the owner's 19 October 2026 Soft edge refinement to Home pre-order actions only: a stationary Sea face with a finite centre-out hairline, 700ms desktop motion and animated 220ms touch presses with a 180ms retreat. Preserve native navigation and shared touch targets.
- Update the conflicting public-control, listening, purchase-status and pre-order contracts and assign the corresponding DESIGN.md rewrite to Claude.

## Capabilities

### New Capabilities

- `accent-colour-roles`: public colour tokens and their semantic roles.

### Modified Capabilities

- `public-controls`: size, labels, focus, fixed accent roles, paired actions and the Home-only Soft edge timing exception.
- `app-shell-and-player`: navigation accents, Listen session styling, hero CTA and reliable Home showcase hydration on cold shell entry.
- `commerce-checkout`: consistent purchase geometry and Flint Sold Out and Only N left edges/surfaces.
- `release-catalog-presentation`: Flint Buy controls with format marks.
- `store-catalog-categories`: category control size/colour and availability edges.
- `store-listing-price-presentation`: filled Buy and shared availability tones.
- `store-preorders`: Sea Green resting purchase fills, plain status lines and approved Home Soft edge interaction.

## Scope and Non-Goals

Themes T1–T2 cover public presentation and its regression tests. This planning pass writes only this change's artifacts. Implementation does not change commerce eligibility, prices, stock, content publication, player authority, Staff styling or provider configuration. Store layout belongs to `store-mobile-first-browse`; page composition belongs to `mobile-layout-rhythm`.

The approved 19 October Home motion slice applies to video, photograph and cover-only showcase chapters. Store and Releases pre-order actions retain their existing behavior. It ships no preview controls, new dependencies, scroll listeners or continuous motion. The owner's explicit instruction assigns this slice's UI, DESIGN.md update and UI tests to Codex, overriding the standing Claude default for this task. This slice authorizes local implementation and acceptance only, with no staging, commit, push, UAT/PRD deployment or publication; earlier release permissions recorded below do not extend to it.

## Dependencies

No redesign prerequisite. Both sibling changes consume this foundation and must preserve its values. Existing catalog-number ordering and shell-history work remain in force; this change does not alter catalogue order or data. Coordinate shared-file edits before integration.

## Impact

Future edits reach shared public styles/primitives, music and shell controls, Store/cart/checkout, editorial and form consumers, DESIGN.md and UI tests. No new dependency, service, API or content migration is planned. The final combined rollout is UAT only; commits and pushes are tasks for the implementation phase, not this authoring pass.
