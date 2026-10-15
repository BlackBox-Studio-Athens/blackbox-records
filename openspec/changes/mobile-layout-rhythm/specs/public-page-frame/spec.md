## Purpose

Keep public BlackBox page content aligned to one responsive frame while preserving safe areas, readable reflow and the approved header and hero-media bleed.

## ADDED Requirements

### Requirement: Public content respects responsive gutters

Public page content SHALL use 16px gutters below 640px, 24px from 640px and 32px from 1024px, never smaller than the safe-area inset. Editorial, header and footer content SHALL retain the 72rem maximum and Store collections their existing 90rem maximum. Rules, backgrounds and media SHALL stop at the applicable content edges except for the two named bleed surfaces.

#### Scenario: Phone page frame renders

- **WHEN** Home, Store, Releases, Artists, News, Services or footer renders at 390 CSS pixels with no larger safe-area inset
- **THEN** its content and section rules lie between x=16 and x=374
- **AND** redundant nested insets do not displace chapter facts or swipe rows from the frame.

#### Scenario: Width or text size changes

- **WHEN** the viewport is 320px, 390px or desktop-sized, or text is enlarged
- **THEN** content reflows inside the frame without document horizontal overflow, clipped identities, clipped legal copy or reduced functional targets.

### Requirement: Only the header and hero film cross page gutters

The header surface and Home hero film layer, including its still fallback and shade, SHALL be the only full-bleed page surfaces. Hero copy/actions and dividers SHALL remain contained. Dialog backdrops MAY cover the viewport for interaction while dialog content and controls retain safe-area padding.

#### Scenario: Visitor scrolls beyond the hero

- **WHEN** Home chapters, section rows, Store categories or footer enter view
- **THEN** chapter photos/films, facts rules, row peeks, section bands and footer/meta rules stop at the frame
- **AND** no full-bleed chapter band or page divider remains.

#### Scenario: Hero has no playable film

- **WHEN** the hero displays its still fallback
- **THEN** the media keeps the approved hero bleed
- **AND** motto, Browse the Store and the hero divider retain the content frame.
