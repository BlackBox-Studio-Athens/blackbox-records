# Design

## Context

See proposal.md for the omission. The shared Release component serves the public route and overlay; private previews render those same routes. Store already uses the editorial renderer and shared track-grouping helper.

## Goals / Non-Goals

**Goals:** Restore existing editorial fields through one shared component, including private preview parity and empty-section handling.

**Non-Goals:** Change CMS fields, Store behavior, release-date selection, commerce eligibility or publication authority.

## Decisions

- Use `EditorialContent` instead of rendering description HTML directly. Its existing portable-text and legacy Markdown paths preserve formatting and safe links. Match Store's populated-body check so an explicit empty body remains authoritative.
- Call `tracklistGroups(release.data.tracklist, release.data.tracklist?.format)`. The authored format identifies the grouping; choosing a commerce format could suppress an upcoming or editorial-only release's tracks.
- Add description and tracklist cards between the hero and media. Reuse existing card typography and native grid rows with wrapping titles; leave Store markup and global styles alone.
- Extend the existing Local publication smoke rather than add a new fixture framework. Unsaved previews cover future/past dates and empty fields; its existing publication batches cover accepted future/past release details and restore changed drafts and published content.

## Risks / Trade-offs

- Empty portable text versus legacy Markdown → use the existing field-presence precedence rather than truthiness alone.
- Long titles or URLs → allow titles to wrap and use the existing prose styling; inspect desktop and 390px layouts.
- Local fixture changes → retain the smoke's restoration path, including the added description and date fields.

## Migration Plan

No data migration or content re-entry. Validate locally, then use the existing UAT/PRD code-promotion gates. Reverting the component restores prior presentation without changing accepted content.
