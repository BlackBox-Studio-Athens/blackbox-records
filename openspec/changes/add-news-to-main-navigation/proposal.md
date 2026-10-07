# Proposal

## Why

Visitors can find News on Home but cannot return to its listing from the main menu. The existing `/news/` route should be reachable beside the other public sections on every page.

## What Changes

- Show the existing News navigation entry last in the desktop header and phone Menu, after Who we are.
- Keep the shared link appearance, current-page state, keyboard focus and same-document routing.
- Update the retained navigation JSON and publish only the matching Local CMS entry.
- Cover News navigation, article overlays, player continuity and the 320, 390, 1024 and 1440 px layouts.
- Replace the agent guidance that requires hiding News from primary navigation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: News is the final main-menu section on desktop and mobile, using the existing listing and shell navigation.

## Impact

The existing navigation content, shell navigation e2e checks and agent reference change. No new page, API, schema, dependency, footer entry or commerce behavior is required. Local Content Publication selects only News navigation; UAT and PRD publication remain separate operations.
