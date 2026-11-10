# Design

## Context

Staff edits EmDash records through `apps/staff/src/components/content/ContentFields.tsx`, one large component that branches per collection. It uses three helpers:

- `field()` for text
- `choice()` for `NativeSelect`
- `rows()` for ordered rows

Sub-editors cover tracklists, lineups, product safety, Bandcamp and catalog numbers. The item setup wizard, the price and stock editors, and order detail use their own bare inputs. Validation comes from shared Zod schemas in `packages/content-model`, mapped to field paths by `getContentValidation`. Drafts autosave after 1.5 seconds. Publish changes reviews an exact revision. The read-only inventory found about 240 editable fields: about 55 free-text fields can become structured, and about 115 stay text.

The owner approved direction B on 10 November 2026: grouped task cards with live summaries. The design detail is on the "Staff inputs" page of the Design canvas (StaffB board): the Release editor on desktop, the Show editor on a phone, the problem state, card stacks for every editor and the behaviour rules.

## Goals / Non-Goals

**Goals:**

- One card shell and one field kit, used by every editor, so new editors cost configuration rather than code.
- Typed values from parse to storage, with a single parser and formatter per type in the shared model.
- Preserve autosave, conflict handling, preview, review, publication and the existing validation messages.
- The Show editor first, before the Vol. I content entry for 5 December 2026.

**Non-Goals:**

- Changing public rendering, routes or content types.
- A date-picker library or any new dependency.
- Structured postal addresses.
- Changing Stock and Orders workflows beyond their inputs.

## Decisions

1. **Card configuration per editor.** Each collection declares `cards: { id, title, fields: path[], summary(data) }[]`. A shared `EditorCards` renders the stack, and owns the open card (local UI state only, never draft state) and keyboard handling. Card state comes from field metadata (required or optional) plus `validation.byPath` restricted to the card's paths. The existing `field()`, `choice()` and `rows()` helpers render the open card's body, so `ContentFields` loses its long linear JSX but keeps its data flow (`data`, `onChange`, `validation`). Alternative rejected: one component per card per editor. It duplicates layout, and summaries drift.

2. **Value types live in `packages/content-model`.** Branded types with `parse` and `format` pairs, like the existing `CatalogNumber`:
   - `Money` (EUR cents)
   - `IsoDate`
   - `TimeOfDay`
   - `DurationSeconds`
   - `HttpsUrl` and `ProviderUrl<Service>`
   - `YoutubeVideoId`
   - `CountryCode`
   - `Slug`

   The Zod schemas use them, so Staff, the backend and the web share one definition. Staff components take and emit the typed value; text drafts stay inside the component until they parse. This keeps today's "invalid input stays visible" behaviour.

3. **Field kit components** in `apps/staff/src/components/fields/`:
   - `MoneyInput`
   - `DateField` (native date plus Today)
   - `TimeOfDayField` (hour and minute steppers)
   - `DurationField`
   - `ProviderUrlField`
   - `ChoiceChips` (Popover and Command with Other)
   - `SegmentedChoice` (ToggleGroup)
   - `CountStepper`
   - `Switch`, which replaces the three copied switch tracks

   All are built on the existing shadcn primitives, with 16 px inputs and 44 px targets. Known value sets come from the content model (`genreSuggestions`, `DISTRO_GROUP_VALUES`, credit roles and product types gathered from current content) plus "used before" values read from the collection list.

4. **Publish-to-gap** reuses the existing `focusFirstInvalid`. It maps the first invalid path to its card, opens that card, then focuses the field.

5. **Stored-value migration** extends the existing idempotent preparation pattern (`prepareCatalogSchema`) with a content step that runs explicitly in each environment (`cms:migrate-typed-values`). It runs separately from schema preparation, writes drafts only, and reports unconvertible values. The converted live content then goes through normal review and Content Publication. Readers accept both forms during the transition window:
   - countries: names or codes
   - socials: `#` or the visible flag

   Shows are unreleased: their prices use cents directly, with no dual read or Show price migration.

   A follow-up removes the dual read after PRD migration.

6. **Delivery slices.** Each slice is releasable:
   1. Value types, field kit, `EditorCards` and the Show editor, including the cents amendment to `add-live-shows`.
   2. Release and Distro, with the distro format consolidation and product safety.
   3. Artist and News, with ISO countries.
   4. Website pages, Navigation, Social links and Label details, with the visible flag and service slugs.
   5. Item setup wizard, Stock, Price and Orders inputs.
   6. The migration and the removal of the dual read.

7. **Ownership.**
   - Codex: value types, schemas, projection, migration, backend preparation and their tests.
   - Claude: `EditorCards`, the field kit, every editor's cards and summaries, and the Staff tests and browser checks.

   The agreed interface is the value-type module plus each collection's stored shape.

## Risks / Trade-offs

- [The largest Staff change to date] → It ships in slices behind the same editors. Each slice keeps autosave and validation tests green, and is captured at 390 and 1440 pixels for owner review.
- [Data migration on live content] → The migration is idempotent and draft-only, with a dual read during transition. Content Publication stays explicit and owner-authorized per environment.
- [Show prices change shape before the Vol. I release] → Slice 1 updates `add-live-shows` before either change is released, so PRD never stores euro floats.
- [The Staff overview bundle budget is tight; one icon exceeded it] → The field kit loads with the editor chunk, not the shell. Bundle checks run on every slice.
- [Summaries can misstate values] → Each summary is a pure function of the stored data, with unit tests per editor.
- [Value sets drift from real content] → "Used before" suggestions come from the collection, and Other stays available where new values are valid.
