## Context

See proposal.md - Why. The UAT deploy job already has direct D1 access (Cloudflare token, `getPlatformProxy`) and runs `cms:catalog-schema` after migrations. It has no staff Access credentials, so it cannot use the staff HTTP API. `backfillReleaseCatalogNumbers` already stages catalog numbers as private drafts through `ContentRepository.updateDraftAware`, but only as an explicit operator step, and it throws on an unknown slug or invalid number.

## Decisions

- **Extend the existing script, not a new tool.** A `--stage-publish-required --apply` flag on `prepare-cms-catalog-schema.mjs`, accepted for `uat` only, runs one function. The workflow gains one command after schema preparation.
- **Reuse the backfill; skip instead of throw.** The backfill gets a `skipUnknown` option. The explicit operator mode keeps its strict behavior. A shared helper reads each record's saved revision so both paths use one reading loop.
- **Condition default New, UAT only.** `requiresProductCondition` decides which records need it (distro items and releases with a non-digital format). A release that needs a condition only through a Store binding is not detected because the step has no commerce access; the README records this.
- **Drafts only.** Publication stays a staff action, so the deploy never changes what shoppers see.

## Risks / Trade-offs

- [Staged drafts show as pending changes] → Intended; publishing them is what staff want.
- [A deploy during an edit] → Draft-aware staging preserves pending fields; UAT only.
- [The default New may not match a real item] → UAT is for testing; staff can change it and the step never overwrites it.
