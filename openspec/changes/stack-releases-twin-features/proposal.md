# Proposal

## Why

On phones and desktop the two featured Releases records do not look alike: the first takes eight of twelve desktop columns with a large cover, while the second is capped at 15rem and becomes a 6.5rem thumbnail row on phones. The owner chose the stacked twin layout (canvas option A, version 10) after a design review, and asked to drop the visible Our Releases heading.

## What Changes

- Present the two featured records as identical stacked rows: the same cover size at every width (full width on phones, equal halves from 40rem, a 29rem cover from 64rem), with complete identity, listening, editorial and purchase content.
- Order each featured row as date, title, artist, Listen, summary, formats, status, shipping, price with the edition action, and a pre-order information link while a pre-order is open.
- Give remaining catalog tiles the same contained cover frame, Listen below the artist instead of over the artwork, the price beside the edition action, and the Store card Buy chrome with its record mark for an ordinary Buy.
- Show the current Store price beside physical actions from the listing read the page already makes.
- Replace the visible Our Releases heading with a visually hidden More releases heading after a hairline rule.
- Move featured summaries from mono to the body font, and include the release in the accessible names of the edition action and Listen.
- Export the Store record Buy mark so Releases reuses it without copying icon layers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: Featured records become stacked twin rows with equal covers; tier composition, copy order, summary typography, catalog tiles, Buy chrome, accessible names and the hidden catalog heading change, and Releases shows the current price beside physical actions.
- `module-boundaries`: `web-store` provides its record Buy mark to `web-editorial` through a declared entrypoint.

## Impact

Releases page markup (`apps/web/src/pages/releases/index.astro`, `ReleaseCard.astro`), release presentation hydration (`release-presentation.ts`), the shared Listen trigger (optional accessible context), `global.css`, `DESIGN.md`, the `web-store` boundary exports and contract note, the image-markup slot check, and the Releases unit and browser tests. No API, schema, content, dependency, publication or deployment change. Image `widths` are unchanged, so no new image transformations are requested.
