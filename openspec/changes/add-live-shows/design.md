# Design

## Context

All public content comes from the accepted CMS snapshot. The model registers collections in `cmsContentSchemas` and `sourceCollectionNames` (`packages/content-model/src/emdash-content.ts`). Snapshot validation checks references, for example "Missing published Artist." for News and Releases. `apps/web/src/content.config.ts` loads each collection through `publicContentLoader`. Public pages are server-rendered from the accepted snapshot, and their HTML is edge-cached for up to 60 seconds.

Existing stores gain fields through `prepareCatalogSchema` (`apps/backend/src/cms/catalog-schema.ts`). New databases use the generated seed (`apps/backend/scripts/generate-cms-seed.ts`). Staff sections live in `apps/staff/src/lib/content-sections.ts`, and each collection's form lives in `ContentFields.tsx`.

The shell swaps only `<main>`. The header persists, and `--header-height` offsets `<main>`.

The approved visuals are the captured C screens on the Design canvas (see proposal.md).

## Goals / Non-Goals

**Goals:**

- One Show collection that Staff can fill in for Vol. I and Vol. II without a developer.
- Placements that appear and disappear with the show date, with no publication needed after the show.
- Reuse the existing autosave, preview, review, publication and media paths unchanged.

**Non-Goals:**

- Ticket sales, ticket inventory or prices as commerce authority.
- A past-shows archive, an iCal file, or a Live route.
- Changing the shell cache contract.

## Decisions

1. **A new `shows` collection, not News fields or a settings block.** Shows have their own lifecycle, can run several at once, and expire. A settings block would allow only one show. News fields would mix shows into the News feed, and the owner discarded that direction.

2. **Lineup as an embedded JSON list.** Each entry is `{ role: 'headliner' | 'opening', artist?: <Artist id>, name?: string, release?: <Release id> }`, following the tracklist and partner-links pattern. A native reference field holds one reference only.
   - Draft validation: exactly one of `artist` or `name`; `release` only on a Headliner with an Artist, and owned by that Artist.
   - Snapshot validation: every referenced Artist and Release is published, matching the existing News rule.
   - Projection: Artist ids become slugs, and Release ids become slugs, as releases already map `artist`.

3. **Date and doors as text, with Europe/Athens as the deciding calendar.** The date is an ISO date (`2026-12-05`) and doors is `HH:MM`. Selection compares the ISO date with today's date in Europe/Athens, using `Intl.DateTimeFormat` with `timeZone: 'Europe/Athens'`, at render time. This avoids any UTC-midnight edge on the show night. One pure selector in `apps/web/src/lib` returns the upcoming Show or null. It is unit-tested with fixed clocks around 4–6 December.

4. **Prices as up to four positive integer euro-cent amounts.** The public projection retains cents; the formatter displays `[1000, 1200, 1500]` as `€10 / €12 / €15`. These prices carry no commerce meaning.

5. **Poster as CMS media, shown whole.** The poster uses the existing image field, snapshot media and `/_image` delivery. The Home section renders it at its intrinsic aspect ratio, with no `object-fit: cover`. The strip and other placements use no image.

6. **Strip inside the header, with a height token.** (As built: the strip uses the header's existing banner slot, whose ResizeObserver already sets `--header-height` from the measured header; `:root:has([data-show-strip])` reserves 80px + 36px before that script runs, so no separate `--show-strip-height` token was needed.) The header component adds the strip only when a Show is upcoming and sets `--show-strip-height` (36px). `--header-height` includes it, so `<main>`, sticky offsets and the Home hero keep aligning. The strip is one `<a>` with `white-space: nowrap`. Below 40rem it hides the lineup span. The same-session shell keeps the header, and a strip that expires mid-session disappears on the next full load. Shell caches are same-session UI caches, so this is acceptable.

7. **Placement components.** The work adds:
   - `ShowStrip`, `HomeShowSection`, `ArtistNextShow` and `ReleaseShowLine` Astro components in `apps/web/src/components/shows/`
   - CSS in a route-split stylesheet
   - styles from the existing tokens and `site-button` variants

   Get tickets uses the neutral primary face, Show details is dropped because no Live page exists, and the Facebook link uses the quiet text action.

8. **Staff editor.** The work adds:
   - Shows under Website in `contentSections`
   - list ordering by date
   - a `LineupFields` component modeled on `TracklistFields`, with Move up/Move down, an Artist picker using the existing `EditorialPicker`, and a Release choice filtered to the chosen Artist
   - a preview destination of Home

   The Staff form's visual design needs owner approval before it is built.

9. **Ownership.** Codex implements the content model, validation, snapshot projection, CMS seed, schema preparation, publication review and preview selection, plus their tests. Claude implements the Staff form, the public components and styles, the e2e checks and the visual acceptance. The agreed interface is the Show data shape in decision 2 plus the projected public entry.

## Risks / Trade-offs

- [Hosted CMS stores lack the collection until preparation runs] → The release runbook already runs `cms:catalog-schema`. The UAT release comes first. Content entry starts only after preparation succeeds.
- [Edge cache shows an expired show for up to 60 seconds after midnight in Athens] → Accepted; the show is over by then.
- [The strip makes the fixed header taller on every page] → Kept to one 36px line. The owner can drop it on phones later by removing one breakpoint rule.
- [A Release unpublished later breaks a published Show's link] → Snapshot validation rejects that candidate, so staff must update the Show in the same review.
- [5 December deadline] → Vol. I placements depend on UAT and PRD releases plus content publication. Those steps need separate owner authorization.

## Migration Plan

1. Release code to UAT. `cms:catalog-schema` prepares the `shows` collection. Staff enter and publish Vol. I in UAT, and the owner accepts it.
2. PRD promotion, with separate authorization. Preparation runs, then Staff enter and publish Vol. I in PRD.
3. Rollback: revert the code release. The prepared collection and Show drafts stay in the CMS, unused, and accepted snapshots without Shows remain valid.

## Open Questions

- Do the €10 / €12 / €15 tiers need labels such as presale, regular and door? The spec allows adding labels later without changing placements.

## Agreed data shape

The public Show entry has an `id` equal to the Show slug. Its `data` has `title`, `date` (a `YYYY-MM-DD` string), `doors`, `venue`, `prices` (an ordered `number[]` of integer euro cents), `ticketUrl`, optional `facebookUrl`, optional `billing`, `poster`, `posterAlt`, and `lineup`. Each lineup item has `role: 'headliner' | 'opening'` and either an `artist` slug or a plain `name`; an Artist Headliner may also have a `release` slug. The `poster` uses the same projected image shape as other collections.

EmDash stores the three camel-case fields as `ticket_url`, `facebook_url`, and `poster_alt` because its field slugs require lowercase. Both public snapshot readers project them to the public names above.
