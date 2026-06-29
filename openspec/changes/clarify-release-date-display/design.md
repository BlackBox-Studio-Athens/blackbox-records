## Context

`release_date` is already required for `releases` and optional for `distro`. Release cards and release detail currently render mostly the year, while distro cards render month/year when available. Decap exposes the field as a date-only `datetime` widget, but the release hint does not say where the date appears or that it affects ordering/latest logic.

## Goals / Non-Goals

**Goals:**

- Make `release_date` visible as quiet metadata outside editorial prose on release-facing public UI.
- Explain in Decap that Releases `release_date` is official release metadata used by the site for display and release ordering/latest behavior, while Distro `release_date` is optional known release metadata used for display only.
- Reuse the existing content field and formatting helpers where possible.

**Non-Goals:**

- Do not add a separate post date, publish date, or commerce availability field.
- Do not change checkout/catalog authority or buyable state.
- Do not redesign release cards or introduce a new design system pattern.

## Decisions

- Use existing `release_date` as the only source of truth.
  - Alternative considered: add `published_date` or `display_date`. Rejected because the current confusion is copy/presentation, not missing data.
- Add metadata presentation to existing release components instead of body copy.
  - Alternative considered: ask editors to type dates into summaries. Rejected because repeated body text will drift from structured metadata.
- Keep presentation delicate by using the existing small metadata language from cards/detail pages: muted text, tight spacing, and label/value form where space allows.
  - Alternative considered: prominent badges. Rejected because release date is supporting information, not a primary action or status.
- Update Decap hints only; keep widget type and date-only config unchanged.
  - Alternative considered: custom Decap preview/widget work. Rejected as unnecessary for this clarification.

## Risks / Trade-offs

- Dense cards may feel crowded with a full date → Use compact formatting on list/card surfaces and reserve fuller labeling for detail views.
- Editors may confuse release date with news publish date → Decap hint must say this is official release/item metadata, not a CMS post publish date.
- Future-dated releases may look like available releases → Do not change commerce buttons or availability language in this slice.

## Migration Plan

No data migration. Existing release and distro entries keep their current `release_date` values.

Implementation can ship as a static UI/CMS config change. Rollback is reverting the component and Decap hint edits.

## Open Questions

- Exact public date format can be decided during implementation, but detail views should expose the day-level date because Decap edits day-level data.
