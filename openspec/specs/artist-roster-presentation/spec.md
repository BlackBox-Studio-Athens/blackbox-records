# artist-roster-presentation Specification

## Purpose

Define how the Artists roster, artist detail lead media, and Home featured roster present artist identity and imagery, so that every artist photo shows whole in a uniform 3:4 frame over a blurred copy of itself, with names below the photo and no black bars or text over photos.

## Requirements

### Requirement: Artist photos are uniform without a scrim

Artist cards on the Artists roster and the Home featured roster SHALL show each artist photo whole inside a uniform 3:4 frame. Space the photo leaves in the frame SHALL show a blurred, darkened copy of the same photo instead of a solid fill. The genre and name SHALL render below the photo, and no gradient or other scrim SHALL cover the photo. The artist detail lead image SHALL use the same blurred fill inside its own frame.

#### Scenario: Square light artwork renders

- **WHEN** an artist image is square with a light background, such as the Chronoboros logo
- **THEN** its card frame matches the size of every other artist card
- **AND** the whole image is visible, with a blurred copy of it filling the space above and below
- **AND** no black bar, band, or gradient appears near the artist name

#### Scenario: Landscape and portrait photos render

- **WHEN** an artist image is landscape or portrait
- **THEN** the whole photo is visible inside the same 3:4 frame, with the blurred copy filling any remaining space
- **AND** the genre and name render below the frame on the card background

#### Scenario: Blurred fill stays decorative

- **WHEN** a card or the artist detail frame renders the blurred fill
- **THEN** the fill image has empty alt text, is hidden from assistive technology, has no high fetch priority, and ignores pointer input
- **AND** only the main photo carries the artist's alt text and responsive width ladder

### Requirement: Artist rosters prioritize published activity

Home and Artists SHALL order active Artists before inactive Artists, alphabetically by name within each group. Missing or null activity SHALL mean active. Home SHALL show the first three ordered profiles. Inactive profiles and their releases SHALL remain accessible.

#### Scenario: Active Sidus precedes inactive Chronoboros

- **WHEN** Afterwise, Ouranopithecus and Sidus are active and Chronoboros is inactive
- **THEN** Artists shows Afterwise, Ouranopithecus, Sidus, Chronoboros
- **AND** Home shows Afterwise, Ouranopithecus and Sidus.

#### Scenario: A roster has one activity group or no profiles

- **WHEN** all profiles have the same activity or the collection is empty
- **THEN** profiles retain alphabetical order or the roster remains empty
- **AND** Home shows at most three profiles without removing inactive profiles from eligibility.

#### Scenario: Private activity changes are not public

- **WHEN** staff change an Artist's activity in a private draft
- **THEN** the accepted public order remains unchanged until that revision is published
- **AND** private listing preview can show the selected draft's ordering.
