# Design

## Context

NewsCard is shared by Home and News. Artist genre already lives in the Artists collection. Native Artist references are projected from EmDash relation edges into selected revision data; accepted snapshots map native IDs to Astro reference slugs. Those paths currently handle Releases only. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:** Carry one optional News Artist identity through those existing paths and derive its genre at render time.

**Non-Goals:** New genre taxonomy, duplicated genre fields, title matching, new routes, new artwork, commerce changes or hosted publication.

## Decisions

- Extend the shared News schema with the same injected Artist reference type used by Releases. Absent, null native columns and empty native relation selections mean no Artist. Reject invalid nonempty values. Do not infer relationships from titles or article body links.
- Extend existing native reference/revision projection and accepted-snapshot mapping to News. A supplied Artist must exist in the candidate's accepted or explicitly reviewed records, so unrelated drafts cannot supply public genres.
- Reuse EditorialPicker with `required` defaulting to true and optional clearing. News alone opts out of required selection; existing callers keep their current behavior.
- Resolve Artist data in the shared NewsCard through the request-scoped content reader. Use a wrapping flex metadata row, the existing fonts and colors, and a thin border around the genre. No client JavaScript or clickable filter is needed.
- Add the nullable reference through the seed and explicit catalog-schema preparation, rather than changing schema during ordinary reads. Retained News fixtures use Artist slugs already recognized by the source inventory.

## Risks / Trade-offs

- Native relation snapshots can override stale scalar columns: cover both selection and clearing in the existing revision checks.
- Optional references must not become missing-reference import anomalies: inventory records only populated optional relationships.
- A populated CMS does not reimport retained fixtures: linking its existing News remains an explicit editorial draft/review action.

## Migration Plan

Prepare the optional native News field before saving linked articles on an initialized CMS. Populate retained source fixtures for Local/file builds. Hosted schema preparation, content linking/publication and code promotion use their existing separate environment gates. Removing a News Artist restores its previous card presentation; retain the harmless optional field on rollback.
