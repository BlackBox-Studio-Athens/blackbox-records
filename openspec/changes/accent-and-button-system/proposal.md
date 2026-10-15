# Proposal

## Why

The approved 15 October 2026 redesign gives public controls consistent size and meaning. The Local audit found seven rendered heights, route-specific pink accents and an amber Listen treatment that conflict with that direction.

## What Changes

- Replace Store Blood, Services Rose and Listen amber with fixed Sea Green, Violet and Slate roles; retain ink Veneer titles.
- Establish one 44px control family, with the 52px Browse the Store hero action as its only height exception, white labels except on neutral ink faces, and one visible focus treatment.
- Define filled purchase actions, outlined secondary actions, adjacent action pairs, existing Buy format icons, tags, kickers, navigation markers, date/catalog lines and labelled form errors.
- Update the conflicting public-control, listening, purchase-status and pre-order contracts and assign the corresponding DESIGN.md rewrite to Claude.

## Capabilities

### New Capabilities

- `accent-colour-roles`: public colour tokens and their semantic roles.

### Modified Capabilities

- `public-controls`: size, labels, focus, fixed accent roles and paired actions.
- `app-shell-and-player`: navigation accents, Listen session styling and hero CTA.
- `commerce-checkout`: consistent purchase geometry and Violet Sold Out and Only N left edges/surfaces.
- `release-catalog-presentation`: Violet Buy controls with format marks.
- `store-catalog-categories`: category control size/colour and availability edges.
- `store-listing-price-presentation`: filled Buy and shared availability tones.
- `store-preorders`: Sea Green resting purchase fills and plain status lines.

## Scope and Non-Goals

Themes T1–T2 cover public presentation and its regression tests. This planning pass writes only this change's artifacts. Implementation does not change commerce eligibility, prices, stock, content publication, player authority, Staff styling or provider configuration. Store layout belongs to `store-mobile-first-browse`; page composition belongs to `mobile-layout-rhythm`.

## Dependencies

No redesign prerequisite. Both sibling changes consume this foundation and must preserve its values. Existing catalog-number ordering and shell-history work remain in force; this change does not alter catalogue order or data. Coordinate shared-file edits before integration.

## Impact

Future edits reach shared public styles/primitives, music and shell controls, Store/cart/checkout, editorial and form consumers, DESIGN.md and UI tests. No new dependency, service, API or content migration is planned. The final combined rollout is UAT only; commits and pushes are tasks for the implementation phase, not this authoring pass.
