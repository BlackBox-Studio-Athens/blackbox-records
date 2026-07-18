## Why

The About page exposes three useful email addresses as plain text in an undifferentiated list, making the correct contact path harder to scan and impossible to activate directly. The selected visual direction should turn that content into a clear, brand-consistent contact directory without expanding the content model or introducing client-side behavior.

## What Changes

- Recompose the About contact block so General is the primary inbox and Demo Submissions and Press are secondary inboxes.
- Render each email row as a full-area native `mailto:` link with a small existing mail icon, visible focus, and a usable touch target.
- Preserve the authored title, intro, labels, addresses, and item order while adding responsive wrapping and narrow-screen stacking.
- Keep the redesign inside the existing BlackBox monochrome, hard-edged About-page surface without nested cards, extra copy, new dependencies, or JavaScript.

## Capabilities

### New Capabilities

- `about-contact-presentation`: Defines the About-page contact hierarchy, email-link behavior, responsive layout, and accessibility contract.

### Modified Capabilities

None.

## Impact

- About page rendering in `apps/web/src/pages/about/index.astro`.
- Contact-specific styling in `apps/web/src/styles/global.css`.
- One focused source/CSS contract test under `apps/web/src/styles/`.
- Existing About content, content schema, Decap fields, app-shell behavior, and dependencies remain unchanged.
