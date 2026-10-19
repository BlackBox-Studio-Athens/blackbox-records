# Design

## Context

The owner explicitly approved Flowing links and Codex implementation on 19 October 2026. See proposal.md for the motivation. Approved reference: `C:/Users/SVall/.codex/visualizations/2026/10/18/01a15120-081a-7292-9956-b5d82122195d/footer-compact-redesign.html`, variant **Flowing links**. Its measured normal-text heights were 336px at 390px, 354px at 320px and 222px at wide desktop.

## Goals / Non-Goals

Keep the reference hierarchy, existing content authority and shell-owned navigation with server-rendered HTML and CSS. No canvas controls, copied fonts, new dependencies, content publication or deployment.

## Decisions

- Restructure the existing Footer.astro into identity, navigation and metadata areas. Reuse its helpers and primitives rather than introduce another component or a client island.
- Preserve CMS browsing order; move configured delivery to the support tail, followed by withdrawal and conditionally available privacy, deduplicating destinations. Support styles use destination roles, not child positions.
- Use the shared page frame and tokens. Flex wrapping at all widths replaces the phone grid; the approved internal changes are near 460px and 720px. Logo is 56px on desktop and 44px below 720px. Links remain at least 44px tall. Typography uses rem so text enlargement grows the layout without JavaScript.
- Preserve the global Flint current-page indication. Only footer hover and focus take the approved amber; native link semantics and shared data-nav-link attributes keep shell synchronization.
- Keep the entire Staff paragraph. Metadata is sentence case at 12px minimum, with a divider above copyright and the exact disclosure beneath it. The existing 200px/four-column prescription is superseded by this approval.
- Reuse existing browser suites and meaningful data/render coverage. Reference height ceilings apply only to the unchanged committed fixture at normal text size.

## Risks / Trade-offs

- Variable CMS content changes height: wrap naturally and exclude such content from reference-height ceilings.
- A minimized iframe player can obscure bottom actions: verify hit targets and iframe identity on the real Local shell before accepting the change.
- Local results do not certify hosted rendering or third-party playback: record those boundaries explicitly; release and publication remain separate operations.

## Migration Plan

No schema migration. Implement on main without modifying unrelated work. Reconcile pending mobile-layout-rhythm footer requirements with this change, retain historical receipts, and record new source-bound Local evidence here.
