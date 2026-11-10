# Proposal

## Why

BlackBox is running label live shows. Showcase Vol. I (Sidus and Afterwise, with Hylas opening, AN Club, Saturday 5 December 2026) was announced on 9 November, and Vol. II will follow. The site has nowhere to put a show. Staff need to publish one the way they publish News, and shoppers should meet it where they already browse.

## What Changes

- Add a **Show** content type to the Staff CMS. Staff create, autosave, preview and publish it through the existing editorial and Content Publication operations. A Show holds:
  - title and date
  - venue and doors time
  - ticket prices and the external ticket link
  - an optional Facebook event link
  - the full poster image with its description
  - an ordered lineup: Artist references or plain names, each a Headliner or an Opening act
  - an optional linked Release for each headliner's album
  - an optional short billing line
- Show the soonest upcoming published Show on the public site in four places. These are the owner-approved direction C with Home image option 2b, approved on 10 November 2026:
  1. A one-line strip above the site header on every page. On phones the lineup is left out.
  2. A Live section on Home, before News. The full 4:5 poster sits beside the title, lineup, facts and Get tickets on desktop, and above them on phones.
  3. A Next show box on each lineup Artist's page.
  4. A release-show line on each linked Release's entry on the Releases page.
- A Show leaves every placement automatically after its date. Its record is not deleted. No public page lists past shows.
- Prepare the new collection idempotently for existing CMS stores (Local startup, UAT and PRD releases). New databases get it from the seed. No populated content is created by software release.
- Out of scope: a dedicated Live page (direction B), the News-post presentation (direction A), ticket sales on the site, show archives and calendar files.

## Capabilities

### New Capabilities

- `live-shows`: the Show record contract, upcoming-show selection and expiry, and the public placements that present a show.

### Modified Capabilities

- `emdash-editorial-operations`: CMS editing, draft rules, preview, publication completeness and schema preparation now cover the Show collection.
- `app-shell-and-player`: the persistent header can carry the one-line show strip without breaking shell navigation, overlay or player continuity.

## Impact

- **Shared content model** (`packages/content-model`): Show schema, collection registry, draft and publication validation, snapshot media and references.
- **CMS** (`apps/backend`): seed schema, idempotent collection preparation in `cms:catalog-schema`, publication review and snapshot export, preview selection.
- **Staff** (`apps/staff`): new Shows section, Show editor form and preview destination.
- **Public site** (`apps/web`):
  - the `shows` content collection and its selection logic
  - the header strip, Home section and artist page
  - the release listing and detail pages
  - CSS and e2e checks
- **Operations:** the Show collection must be prepared in each hosted CMS before Staff can enter Vol. I. UAT and PRD rollout, content entry and publication stay separate, owner-authorized steps.
- No new Cloudflare resource, KV, D1 table or paid service. Ticket purchase stays on More.com.
