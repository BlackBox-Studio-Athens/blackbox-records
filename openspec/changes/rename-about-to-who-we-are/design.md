## Context

Navigation and About content are CMS-owned; retained JSON fixtures do not overwrite an existing accepted snapshot. The browser title currently hardcodes About. See proposal.md for motivation.

## Decisions

- Update existing label fields and shell display text; retain all route and record identities. Derive the browser title from `hero.section_label` rather than duplicating the chosen label.
- Publish only the navigation and About label changes in Local through the existing revision-aware review and publication flow. Inspect draft differences first so unrelated saved changes are not published.
- Keep existing typography and The Label heading. No UI component or naming abstraction is needed.

## Risks / Trade-offs

- Existing Local CMS content can retain About after fixture changes: update and verify the accepted Local snapshot separately.
- Port 4321 belongs to another worktree's preview: preserve that process and use the documented isolated Local verification ports with a separate Worker registry if needed.

## Migration Plan

Prepare on main and verify locally. UAT/PRD code promotion and content publication remain separate operations. Reversing the display label uses the same ordinary content publication flow; no route migration is required.
