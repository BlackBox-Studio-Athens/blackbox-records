# Design

## Context

`listArtistProfiles()` sorts by name and also serves non-roster callers. Home takes its first three records. EmDash stores native booleans as integers and absent optional fields as null. The implemented `restore-artist-roster-cards` change replaces the obsolete crate-index presentation; this change adds an independent ordering requirement without rewriting that pending delta.

## Goals / Non-Goals

Keep activity as an editorial Artist property and retain draft privacy. Activity affects Home and Artists ordering, not profile visibility or release/commerce availability.

## Decisions

- Use `is_active: z.boolean().default(true)` in the shared schema. Normalize native 0/1 during validation and published projection; missing/null values project as active. Reject other supplied types rather than coercing strings.
- Add the optional boolean field idempotently in `prepareCatalogSchema`. Fresh schemas derive it from the existing generator. Do not bulk-update old records, drafts or revisions.
- Reuse the existing native checkbox with `role="switch"`, visible focus and a 44 px label target, below Artist name. Its stable label is Active artist; secondary text says Active or Inactive and explains that inactive artists appear last after publication. Opening an old entry does not save a default.
- Add `listArtistRosterProfiles()` in the existing catalog entrypoint and call it only from Home and Artists. Preserve `listArtistProfiles()` for other callers. Sort a copy by published activity then existing name comparison; Home still slices the first three, including inactive entries if fewer than three artists are active.
- Set the retained Chronoboros Local fixture inactive. Existing hosted content defaults active until staff publishes the reviewed activity change. The desired four-profile order is Afterwise, Ouranopithecus, Sidus, Chronoboros.

## Risks / Trade-offs

- Native zero must remain false through draft, snapshot and runtime reads; regression checks cover all representations.
- Old snapshots remain valid. Changing a private flag must not affect accepted public content before publication.

## Migration Plan

Use the existing Local/UAT/PRD schema preparation before the matching CMS release. After the release supports the field, set Chronoboros inactive and confirm Sidus active through the normal editorial review/publication flow. Hosted promotion and Content Publication retain their separate gates. To restore alphabetical display, mark every profile active and publish; no count-based automatic reset is added.

## Approved UI direction

The user's implementation request confirms the switch's position, labels and existing visual treatment. Product and Design context were loaded; staff uses the product register. Visual probes and north-star mocks are skipped because this is one existing control reused in an established form, with no open composition or new assets.
