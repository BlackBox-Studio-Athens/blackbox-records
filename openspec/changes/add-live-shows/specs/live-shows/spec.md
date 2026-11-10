## ADDED Requirements

### Requirement: A Show carries the facts shoppers need

A published Show SHALL have a title, a calendar date, a venue name, a doors time, an HTTPS ticket link and a poster image with alt text. It SHALL list at least one Headliner. It MAY have up to four ticket prices as positive integer euro cents in display order, an HTTPS Facebook event link, a short billing line, and Opening acts. Each lineup entry SHALL be either a published Artist reference or a plain name, never both. A Headliner MAY link one published Release by that Artist.

#### Scenario: Showcase Vol. I is complete

- **WHEN** the Show has title BlackBox Showcase Vol. I, date 2026-12-05, venue AN Club, Athens, doors 20:00, prices €10 / €12 / €15, the More.com link, the 4:5 poster with alt text, Sidus (linked to LOTUS) and Afterwise (linked to Disintegration) as Headliners, and Hylas as an Opening act by plain name
- **THEN** publication completeness reports no issues

#### Scenario: A required fact is missing

- **WHEN** the date, venue, doors time, ticket link, poster, poster alt text or every Headliner is absent
- **THEN** publication is blocked with a field-scoped message naming the missing fact
- **AND** the private draft remains saveable.

#### Scenario: A link is not HTTPS

- **WHEN** the ticket or Facebook link is not an absolute HTTPS URL
- **THEN** draft saving and publication reject the field with a field-scoped message.

### Requirement: The site presents one upcoming show at a time

The public site SHALL select the published Show with the earliest date that is today or later in the Europe/Athens calendar, at render time. Ties SHALL use title order. A Show SHALL stop appearing in every placement once its date has passed in Europe/Athens. With no upcoming Show, no placement SHALL render, and no layout space SHALL be reserved.

#### Scenario: Vol. I is the next show

- **WHEN** Vol. I (5 December) and Vol. II (a later date) are published and today is 10 November in Athens
- **THEN** every placement shows Vol. I.

#### Scenario: The show day ends

- **WHEN** a page renders on 6 December 2026 in Athens
- **THEN** Vol. I appears in no placement
- **AND** Vol. II appears instead if it is published and upcoming.

#### Scenario: No show is upcoming

- **WHEN** no published Show is dated today or later
- **THEN** the header strip, Home Live section, Next show box and release-show line are absent.

### Requirement: A one-line strip announces the show above the header

The persistent header SHALL show a single-line strip linking to the ticket link. It SHALL contain, in order: Live with the weekday and date, the lineup (Headliners, then + Opening acts), the venue name, and Tickets. Below 40rem the lineup SHALL be omitted. The strip SHALL never wrap to a second line. Its accessible name SHALL include the show title, date and that it opens the ticket seller.

#### Scenario: Desktop strip

- **WHEN** Vol. I is upcoming on a 1440px viewport
- **THEN** the strip reads Live · Sat 05 Dec, Sidus / Afterwise + Hylas, AN Club, Tickets on one line.

#### Scenario: Phone strip

- **WHEN** the viewport is 390px wide
- **THEN** the strip reads Live · Sat 05 Dec, AN Club, Tickets on one line with no lineup.

### Requirement: Home presents the show with its full poster

Home SHALL show a Live section directly before News. It SHALL contain the poster, uncropped at its own aspect ratio, and beside it:

- the date and billing line
- the Show title
- the lineup, with each Headliner's linked Release title and Opening acts marked Opening
- the venue, doors and prices
- Get tickets, as the primary action, to the ticket link
- the Facebook event as a quiet link, when present

Below 48rem the poster SHALL stack above the facts.

#### Scenario: Desktop Home section

- **WHEN** Home renders at 1440px with Vol. I upcoming
- **THEN** the full poster sits left of the facts, and Get tickets opens the More.com link.

#### Scenario: Phone Home section

- **WHEN** Home renders at 390px
- **THEN** the full poster spans the content width above the facts, and the actions take full width.

#### Scenario: Lineup entries link to their Artists

- **WHEN** a lineup entry references a published Artist
- **THEN** its name links to that Artist's page
- **AND** a plain-name entry renders as text without a link.

### Requirement: Artist pages show the Artist's next show

Each lineup Artist's page SHALL show a Next show box after the profile, before the latest release. It SHALL show the date, "<title> release show" when the entry links a Release, the Show title, venue, other lineup entries with Opening acts marked, and doors. Its action SHALL be Tickets from <lowest price> (Get tickets without prices), plus the Facebook event as a quiet link when present. Artists outside the lineup SHALL show no box.

#### Scenario: Sidus page

- **WHEN** the Sidus page renders with Vol. I upcoming
- **THEN** it shows LOTUS release show, BlackBox Showcase Vol. I, AN Club, Athens · with Afterwise · Hylas opens · Doors 20:00, and Tickets from €10.

#### Scenario: An Artist outside the lineup

- **WHEN** the Ouranopithecus page renders
- **THEN** it shows no Next show box.

### Requirement: Linked Releases mention their release show

A Release linked by a Headliner of the upcoming Show SHALL show the line "Release show · <Sat 05 Dec>, <venue>" with a calendar icon, linking to the ticket link. It SHALL appear on its Releases listing entry, after the description. Purchase actions, price and availability presentation SHALL remain unchanged.

#### Scenario: LOTUS on Releases

- **WHEN** the Releases page renders with Vol. I upcoming
- **THEN** the LOTUS entry shows Release show · Sat 05 Dec, AN Club after its description
- **AND** its Pre-order vinyl action and price are unchanged.
