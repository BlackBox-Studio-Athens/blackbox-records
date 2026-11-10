# Proposal

## Why

Staff editors ask label members to type values the system already knows: dates, door times, prices, links to known services, genres, formats, credit roles and counts. About 159 of 216 content fields are free text today. Typed values then travel as raw strings and numbers, and some storage carries hidden conventions (euro floats beside integer cents, country names, a `#` link meaning hidden, `1` for true). On 10 November 2026 the owner asked for every Staff page to be intuitive, with no free text where avoidable and no primitive obsession. The owner chose direction B, grouped task cards with live summaries, and approved its design detail the same day.

## What Changes

- Every Staff editor (Artist, Release, Distro & merch, News, Show, each Website page, Navigation, Social links, Label details) becomes an ordered stack of task cards. A card shows a state (done, required and missing, optional, problem, each with text) and a one-line plain-language summary of its values. Only one card is open at a time. Publish changes opens the first card that blocks publishing and focuses its first problem field.
- A shared Staff field kit replaces free text wherever a value set or format is known:
  - Money (euro, integer cents), date, 24-hour time of day, track duration.
  - Provider links that check the service host as you paste (Bandcamp, Tidal, YouTube, Facebook, Instagram and the other standard artist and social services).
  - Known-choice chips with an Other entry (genres, release formats, credit roles, product types, used venues, section labels, contact labels).
  - Segmented choices for two to four options, count steppers, and one shared switch.
- Stock and Orders keep their workflows, and their inputs move to the kit: Money for prices, steppers for counts, a segmented Add or Remove control, a 10-digit parcel number field, and the BOX NOW locker picker.
- Titles, prose, bios, alt text and legal wording stay text inputs, with character counters where a limit exists.
- Stored values become typed in the shared content model. A one-time content migration converts existing data, and the converted data is published through the normal review.
  - **BREAKING** (stored form): Show ticket prices become integer cents. This amends the unreleased `add-live-shows` change.
  - Artist countries are stored as ISO country codes. Public labels are unchanged.
  - A hidden social link is stored as an explicit visible flag instead of the `#` URL.
  - Distro's format description, group and tracklist format collapse into one format choice, with an optional display override.
  - Editorial flags are stored as true or false only.
  - Service ids are generated from the service title and editable behind Change.
- Delivery order: the field kit and the Show editor ship first, before the 5 December 2026 Vol. I entry. The other editors follow in slices.
- Out of scope: new content types, public-site presentation changes, a calendar dependency (dates keep the native picker with a Today shortcut), and structured postal addresses (address fields stay text).

## Capabilities

### New Capabilities

- `staff-structured-editing`: the card layout, card states and summaries, the Publish-to-first-gap behavior, and the typed Staff field kit with its value types, across every Staff editor.

### Modified Capabilities

- `module-boundaries`: a new closed `staff-fields` module holds the field kit; it uses only `staff-ui`, and the orders, shell, stock and content modules may use it.
- `emdash-editorial-operations`: stored editorial values become typed (cents, ISO countries, visible flags, a single distro format, boolean flags, generated service ids). Existing content is converted by an idempotent migration, and the converted content is published through the existing review.

## Impact

- **Shared content model** (`packages/content-model`): value types and parsers for Money, IsoDate, TimeOfDay, Duration, provider URLs, CountryCode, Genre and the other known sets. Schema, validation and snapshot projection change for prices, countries, socials, distro format, flags and service ids.
- **CMS** (`apps/backend`): an idempotent migration over existing CMS records, schema preparation for changed fields, and publication of the converted content.
- **Staff** (`apps/staff`): the card shell for every editor, field-kit components, summaries, and replacement of free-text controls in `ContentFields`, the item setup wizard, product safety, tracklist, lineup, stock, price and order editors.
- **Public site** (`apps/web`): it reads the projected values only. Rendering is unchanged, apart from formatting prices in cents and country labels from codes.
- **Coordination:** the `add-live-shows` price contract changes from euro amounts to cents before its release. The Staff design reference (`docs/backoffice-design.md`) records the accepted direction.
- No new paid service, Cloudflare resource or dependency is planned.
