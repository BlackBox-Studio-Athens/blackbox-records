# Proposal

## Why

Desktop hover makes release artwork move and changes card controls before the visitor interacts with them. Keep the Releases page steady and make its detail affordance visible without hovering.

## What Changes

- Keep Latest, Upcoming, and Our Releases artwork at its resting crop on desktop, including keyboard focus.
- Remove card-hover frame emphasis and keep View release visible, including during Listen interaction.
- Restrict Listen feedback to the button itself while preserving keyboard focus, active-session status, and the persistent player.
- Preserve mobile and artist-discography behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: Desktop artwork and catalog cards remain steady while their links and controls retain accessible interaction feedback.

## Impact

The change is limited to route-scoped desktop CSS in the public web frontend. No API, type, content schema, dependency, commerce, publication, or deployment changes are needed.
