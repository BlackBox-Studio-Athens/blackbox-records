## Why

A label member reported that the phone Menu offers no way home; only the logo does. Inspecting the PRD site at 390 × 844 found related phone problems:

- Store always shows in its accent with a 2px left stripe, so it looks like the current page.
- The Menu's Close control is 16px tall.
- The footer sitemap is forced onto one clipped row: "Delivery information" is cut off, and its links are 30px tall.
- The Menu stays open after the window widens to the desktop layout, where its button is hidden.
- The Menu button is an unlabelled 16px icon, which the member called "three dots".

The cause is three separately coded and styled renderings of the same links. Also, the Menu borrows the desktop header list, which leaves Home out because desktop has the logo.

## What Changes

- Build one main navigation in which Home is structural and always first:
  - The phone Menu lists Home and the main-menu sections.
  - The desktop header lists the sections beside the logo.
- Render header, Menu and footer page links through one link model and one link style:
  - Shared attributes, accents and current-page state.
  - The existing desktop underline as the single current-page marker.
  - Accents only on hover, press or the current page.
  - No side stripes.
- Give Menu rows, Close and footer sitemap links 44px targets, and let the footer sitemap wrap instead of clipping.
- Show the word Menu beside the icon. Expose the Menu's dialog popup and expanded state, return focus to the button when the Menu closes, and close the Menu when the desktop layout starts.
- Reject a Home navigation entry shown in the main menu, and name the staff checkbox for both surfaces it controls.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: the main navigation is one model with Home first on phones, shared link states and phone-sized targets.
- `emdash-editorial-operations`: Home cannot be added to the main menu, and the main-menu checkbox names the phone Menu.

## Impact

Affected code:

- the `@blackbox/content-model` navigation schema
- `site-data.ts` and the `web-platform` URL helpers
- the header, footer, app shell and phone Menu
- `global.css`
- the staff navigation fields
- the runtime-performance Store selector

No new dependency, route, migration or Content Publication. Both hosted header lists already exclude Home, so no existing hosted entry fails the new rule.
