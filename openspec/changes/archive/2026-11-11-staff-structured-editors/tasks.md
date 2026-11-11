# Tasks

## 1. Value types and Show slice

- [x] 1.1 [Codex] Add branded value types with parse/format pairs to `packages/content-model`: Money (EUR cents), IsoDate, TimeOfDay, DurationSeconds, HttpsUrl, ProviderUrl per known service, YoutubeVideoId, CountryCode, Slug. Use them in the Zod schemas. Verify with content-model unit tests: round trips, bad input messages, Greek-locale independence for TimeOfDay, and the service host checks.
- [x] 1.2 [Codex] Change Show ticket prices to integer cents in the schema, snapshot projection and local Vol. I fixture, and update the `add-live-shows` spec and design to match. Verify `pnpm test:content`, `pnpm test web-content-files` and the live-show helper test, which shows €10 / €12 / €15 from 1000/1200/1500.
- [x] 1.3 [Claude] Build the field kit in `apps/staff/src/components/fields/`: MoneyInput, DateField, TimeOfDayField, DurationField, ProviderUrlField, ChoiceChips, SegmentedChoice, CountStepper and a shared Switch. Replace the three copied switch tracks. Verify with unit tests per component (typed value in and out, kept invalid draft, 44 px targets, keyboard use) and `pnpm test staff-content`.
- [x] 1.4 [Claude] Build `EditorCards`: card config, four states with text, summaries, one open card, Enter/Space/Escape, and Publish opening the first blocking card through `focusFirstInvalid`. Verify unit tests for state derivation, summaries and focus handling.
- [x] 1.5 [Claude] Move the Show editor onto cards (Title, When, Where, Tickets, Lineup, Poster, Links). Use the field kit: date, 24-hour doors steppers, used-venue chips, Money chips, ProviderUrl for ticket and Facebook links, segmented lineup role and act kind. Verify ContentFields/LineupFields tests, the Staff browser capture at 390 and 1440 px on the full Local stack, and owner result review.
- [x] 1.6 Update `docs/backoffice-design.md` with the accepted B direction, the card rules and the field kit. Verify `pnpm agent:check` and `pnpm openspec -- validate staff-structured-editors --strict`.

## 2. Release and Distro slice

- [x] 2.1 [Codex] Consolidate distro format into one format plus an optional display override. Derive the tracklist format, and store the track duration as seconds. Verify content-model and storefront-catalog tests, and that public Distro labels and filters are unchanged.
- [x] 2.2 [Claude] Release editor on cards (Basics, Artwork & photos, Formats, Listening, Tracklist, Credits, Text, Home & ordering, Product safety):
  - segmented stage and condition
  - format and credit-role chips
  - ProviderUrl for singles, Tidal and clips
  - DurationField
  - CountStepper for priority
  - product safety with segmented role, establishment and status, a product-type chip set, and an Email or web address toggle

  Verify ContentFields tests and Staff captures with owner review.

- [x] 2.3 [Claude] Distro editor on cards (Basics, Image & photos, Listening, Tracklist, Text, Display, Product safety) with the single format choice and a used-eyebrow chip set. Verify tests and captures.

## 3. Artist and News slice

- [x] 3.1 [Codex] Store artist countries as ISO codes, with an unchanged public label projection. Verify content and web tests showing identical public country text.
- [x] 3.2 [Claude] Artist editor on cards (Basics, Photo, Links, Videos, Story) with genre chips, the existing country picker, host-locked profile links and YouTube thumbnails. Apply the same changes to the new-artist flow. Verify tests and captures.
- [x] 3.3 [Claude] News editor on cards (Basics, Image, Text) with DateField and a used-section-label chip set. Verify tests and captures.

## 4. Website slice

- [x] 4.1 [Codex] Store a social visible flag instead of `#`, booleans as true/false, and service ids as generated slugs. Verify content and web tests, and that the public footer, navigation and services render as before.
- [x] 4.2 [Claude] Home, Who we are, Services, Distro page, Buying & delivery and Newsletter on cards per section:
  - page pickers
  - unused-stat choices
  - contact-label chips with Email fields
  - generated service ids behind Change
  - DateField with Today for the terms revision
  - segmented publication state

  Verify tests and captures.

- [x] 4.3 [Claude] Navigation, Social links and Label details on cards with Switches, ProviderUrl per platform, a year CountStepper and HttpsUrl. Verify tests and captures.

## 5. Selling, stock and orders inputs

- [x] 5.1 [Claude] Item setup wizard, price editor and pre-order control: MoneyInput, CountStepper, segmented kind and part, Switch. Verify the existing stock and item tests plus `node --import tsx scripts/test-content-workspace.mjs --selling --mobile-preorders`.
- [x] 5.2 [Claude] Stock operations and order detail: segmented Add/Remove, CountStepper with the online ≤ counted bound, a 10-digit parcel number field and the BOX NOW locker picker. Verify the orders and stock tests and captures.

## 6. Migration and integration

- [x] 6.1 [Codex] Add `cms:migrate-typed-values`: idempotent and draft-only, reporting unconvertible values. Add dual reads for countries and socials during transition. Show prices use cents only and require no migration. Verify backend worker tests for the first and repeat run, an unconvertible country, and preserved revisions.
- [x] 6.2 Run `pnpm validate`, strict OpenSpec validation and `graphify update .`. Run the Staff browser acceptance at 390, 768, 1280 and 1600 px in Chromium and Firefox. Record source-bound evidence in validation.md.

## Workflow follow-up

- Owner authorizes each UAT release, `cms:migrate-typed-values` in UAT, review and publication of the converted content, then UAT acceptance.
- Owner authorizes the PRD promotion, the PRD migration and publication. After that, remove the transition dual reads in a follow-up change.
- Archive after PRD acceptance.
