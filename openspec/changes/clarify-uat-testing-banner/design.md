## Context

The user approved the permanent full-width yellow banner and production links, then requested English. Reuse `SHOW_REVIEW_SITE_MARKER` for public pages and `PUBLIC_STAFF_ENVIRONMENT === 'uat'` for Staff.

## Goals / Non-Goals

Make testing identity and data isolation immediately readable on both UAT surfaces, including narrow screens and while scrolling. Keep production and Local unchanged. Do not change data, payment authority, or publish/deploy anything.

## Decisions

- Exact copy: `UAT · TESTING ONLY` and `Data here is separate and does not transfer to or from the production site.`
- Link label: `Open production site`, targeting the corresponding production root in a new tab so Staff draft work remains open.
- Public banner belongs to the persistent header; use natural wrapping and measure its header height for existing mobile navigation offsets. Staff banner is a non-shrinking row in the existing viewport-height shell.
- Browser titles use `[UAT]`. Keep the existing final checkout warning.
- No image probes or mocks: the approved simple banner has no open visual direction. No dependencies or separate agent chats are needed.
- Final user refinement: reduce banner padding to 4px vertically and link height to 36px, giving a 44px desktop banner instead of 60px. Commit locally only.
- Pass the public UAT boolean explicitly to HeaderShell; Astro can retain a named slot even when its conditional content is empty. Keep the original 80px non-UAT header.

## Risks / Trade-offs

The taller public header changes available viewport space. Check narrow layouts, scrolling, navigation, and player continuity. Existing release marker checks must change in the same batch.

## Open Questions

None.
