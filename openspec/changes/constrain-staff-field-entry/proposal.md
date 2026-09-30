## Why

Several staff fields accept free text although only a closed or structured set of values works on the site. For example, an About fact key other than `artists`, `releases`, `countries` or `year` renders an empty number, and hiding a social link requires typing `#`. Staff should not be able to enter those values at all.

## What Changes

- Replace closed-set text inputs with choices:
  - About fact keys.
  - Social platforms.
  - Internal page links in Navigation and Home.
  - The Settings country.
- Parse pasted input into canonical values: Bandcamp embed code or player src, and YouTube URLs.
- Add a Hide this link switch to Social links, so staff no longer type the `#` sentinel.
- Require About contact values to be email addresses.
- Normalize service link names as they are typed.
- Bound row counts where the schema already requires them.
- Ignore tracklist duration and EUR amount keystrokes that cannot lead to a valid value.
- Prevent duplicate tracklist side letters.
- Limit stock inputs and search boxes to the server's bounds.
- Tighten the shared content schemas and the stock-change API contract, so the Worker rejects the same illegal values.

Open-set labels stay free text: genre, release formats, credit roles, the news section label, and the Distro small heading and format description.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `emdash-editorial-operations`: closed-set editorial values use choice controls, and the schemas validate them as closed sets.
- `staff-item-management`: price, stock and reason inputs accept only values the commerce commands accept.

## Impact

Affected code:

- the shared `@blackbox/content-model` schemas and constants
- the staff content editor, including the tracklist and country pickers
- item setup, the price editor and the stock workspace
- the internal stock-change OpenAPI contract, with regenerated client types

No new dependency, route, migration, hosted deployment or content publication. Existing hosted entries whose values fall outside the new sets must be corrected before their next publication.
