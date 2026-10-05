# Footer text in existing settings

## Decisions

Use `settings.footer_text`, an optional plain string. Label details already owns footer label name/year and supports singleton editing, autosave, preview, revision review and publication. A Footer text destination under Navigation & footer opens the same singleton, with no second editor or settings authority.

The public Footer reads only accepted settings. Missing, null or whitespace-only text retains `siteConfig.description`, preserving old snapshots and allowing staff to reset the default. EmDash draft validation accepts its native optional-column null; completeness validation normalizes known null fields and `publishedCollection` removes them before the portable settings schema, which intentionally accepts only a string or absence. Sentence wrapping, links, rights notice and layout remain unchanged. Label name and Year established remain editable alongside the new field.

Use the current shared text input rather than rich-text editing; this footer contains a short label description. Reuse the existing native schema setup to add the optional string field for existing databases. Generated initial schema follows the shared Zod schema. Field setup never replaces existing settings or promotes drafts.

## Acceptance

- Website → Navigation & footer exposes Footer text and opens existing Label details.
- Footer text updates only its settings field and uses normal private autosave and explicit Publish changes.
- Legacy, null and blank values remain valid; non-string values are rejected.
- Accepted snapshots preserve custom text; a private draft does not replace accepted copy.
- Native setup is safe to repeat and rejects an incompatible existing field.

## Rollout

The existing CMS schema preparation must run in each environment before editing. This task performs no hosted mutations. Parent owns final validation, graph refresh and combined browser/runtime acceptance.
