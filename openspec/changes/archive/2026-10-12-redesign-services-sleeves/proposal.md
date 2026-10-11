# Proposal

## Why

The Services page stacks a patterned gradient intro, three tall alternating image panels with overlaid titles, process cards and a long inquiry block. It reads heavier than the rest of the site's flat, image-led sections. The approved "Sleeves" direction presents the same content as one short, square-tiled page.

## What Changes

- Replace the patterned intro with a plain intro: the existing `What We Do` label, `Services` title, intro copy and one filled `Start an inquiry` action.
- Present the three services as equal square-image tiles with index, title, summary, partner link, bullets, a muted contact note and an `Ask about <Service>` action.
- Move `Share your demo` into one full-width Demos strip between the tiles and the process; it remains the only link of that name.
- Present How We Work as three numbered steps on a rule, and centre the existing inquiry form in a bordered panel with sentence-case labels, keeping its colours and behaviour.
- Remove the obsolete Services page styles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `section-page-identity`: The Services intro no longer requires a pattern; the label, title, copy and inquiry action remain.

## Impact

Services page markup and its global styles, the build image-markup check's Services class, and this change's evidence. No content schema, inquiry API, form behaviour, shell, player, dependency or hosted operation changes. `ui/grid-pattern.astro` stays as an unused ui-foundation primitive.
