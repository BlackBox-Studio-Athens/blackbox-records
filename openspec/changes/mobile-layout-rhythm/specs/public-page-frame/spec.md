## Purpose

Keep public BlackBox page content aligned to one responsive frame while preserving safe areas, readable reflow and the approved header and hero-media bleed.

## ADDED Requirements

### Requirement: Public content respects responsive gutters

Public page content SHALL use 16px gutters below 640px, 24px from 640px and 32px from 1024px, never smaller than the safe-area inset. Editorial, header and footer content SHALL retain the 72rem maximum and Store collections their existing 90rem maximum. Rules, backgrounds and media SHALL stop at the applicable content edges except for the named responsive bleed surfaces.

#### Scenario: Phone page frame renders

- **WHEN** Home, Store, Releases, Artists, News, Services or footer renders at 390 CSS pixels with no larger safe-area inset
- **THEN** its content and section rules lie between x=16 and x=374
- **AND** redundant nested insets do not displace chapter facts or swipe rows from the frame.

#### Scenario: Width or text size changes

- **WHEN** the viewport is 320px, 390px or desktop-sized, or text is enlarged
- **THEN** content reflows inside the frame without document horizontal overflow, clipped identities, clipped legal copy or reduced functional targets.

### Requirement: Named media surfaces may cross page gutters

Header and Home hero film, including its still fallback and shade, SHALL retain their bleed. Above 800 CSS pixels Home video/photo-backed pre-order chapters SHALL also span the viewport. Cover-only chapters and section links SHALL retain their current frame at every width. Hero copy/actions and dividers SHALL remain contained. Dialog backdrops MAY cover the viewport for interaction while dialog content and controls retain safe-area padding.

#### Scenario: Visitor scrolls beyond the hero

- **WHEN** Home chapters at 800px and below, section rows, Store categories or footer enter view
- **THEN** chapter photos/films, facts rules, row peeks, section bands and footer/meta rules stop at the frame
- **AND** no full-bleed chapter band or page divider remains.

#### Scenario: Hero has no playable film

- **WHEN** the hero displays its still fallback
- **THEN** the media keeps the approved hero bleed
- **AND** motto, Browse the Store and the hero divider retain the content frame.

#### Scenario: Approved desktop pre-order chapters render

- **WHEN** video or photo-backed Home chapters render above 800 CSS pixels
- **THEN** their media spans the viewport without horizontal overflow and facts/copy follow the accepted Thursday composition
- **AND** cover-only chapters, section links and unrelated surfaces retain their existing frame; at 800px and below the current frame is unchanged.
