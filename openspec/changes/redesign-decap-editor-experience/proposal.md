## Why

The current Decap editor makes routine work difficult for two to three non-technical editors: the ready boot surface remains visible, core screens depend on brittle DOM repairs, fixed page structures look removable or reorderable, large Store Item lists are hard to scan, and mobile use is unreliable. Acceptance review of the in-progress redesign also found manual Artist slug entry, malformed composite selects, unreadable dark actions, weak header branding, and inconsistent local asset origins. Store Item creation, product photography, Artist creation, and Release creation need a direct, safe workflow while Decap remains the CMS and continues publishing directly to `main`.

## What Changes

- Upgrade the supported baseline to `decap-cms@3.15.1` and `decap-server@3.10.0` as part of implementation, then update package metadata, lockfile, runtime URLs, tests, and compatibility documentation together.
- Mount Decap in an app-owned `#nc-root`, make the boot surface disappear only after that mount renders, and keep bounded loading/failure/disabled states without waiting for editor interaction.
- Direct editors to the shared label Google account through DecapBridge PKCE without claiming the repository can remove provider choices owned by hosted DecapBridge.
- Replace the broad body observer and version-specific DOM repair layer with Decap-native configuration, widgets, collection options, and supported extension APIs wherever possible; reconcile every current repair as removed, natively replaced, or retained as one bounded named exception.
- Reorder and consolidate collection navigation around the highest-frequency work: Store Items first, Releases next, then other routine editorial work, with page singletons grouped in canonical `site-pages` routes and advanced site-wide controls kept last.
- Improve Store Item discovery with native summaries, sorting, grouping, and filters; optimize Store Item creation and image selection/replacement for non-technical editors.
- **BREAKING (internal content schema):** replace fixed-layout Home, About, and Services section arrays with named object fields, migrate existing content, and update Astro schemas, queries, previews, and tests so fixed sections never expose list structure controls.
- Simplify Release creation, relation selection, image handling, validation, labels, hints, and field order.
- Generate each new Artist public slug once from the Artist title through the existing shared slug library, keep the stored slug hidden from editors, preserve existing slugs across title edits, and leave explicit overrides to source-level maintainers.
- Replace deprecated Decap configuration and widgets, including `logo_url`, ineffective list limits, and Markdown widgets, while preserving every committed Artist and News Markdown body through round-trip tests.
- Keep the light Decap header but use the existing BlackBox horizontal wordmark as a legible dark mark, remove the native document icon from the text-only Contents route, and keep local branding assets on the same loopback origin as the admin page.
- Replace blanket admin input, link, and button overrides with scoped semantic styling so composite widgets retain their native structure and every required action has readable contrast in default, hover, focus, and disabled states.
- Make collection and entry screens usable at mobile widths with measurable 44 CSS-pixel workflow targets, visible focus, no clipped required actions, and no page-level horizontal overflow.
- Preserve direct-to-`main` publishing, collection-owned media, stable content identities, shared-Google-account operating access, and the existing separation between editorial content and commerce authority.
- Expand deterministic config tests and rendered Local/UAT browser checks to cover truthful boot dismissal, hosted-auth boundaries, canonical Site Pages routes, top editor tasks, read-only image interaction, repair dispositions, fixed structures, native collection controls, and desktop/mobile layouts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `decap-editorial-operations`: Redesigns boot behavior, authentication copy, collection information architecture, Store Item, Artist, and Release workflows, fixed-page content shapes, media editing, header branding, action contrast, responsive behavior, supported Decap versions, and the boundary for custom admin code.
- `tooling-validation`: Adds deterministic Artist slug coverage, scoped-style regression checks, and rendered desktop/mobile acceptance coverage for the redesigned Decap editor and upgraded runtime.

## Impact

- Decap runtime/config generation under `apps/web/src/lib/admin/` and `apps/web/src/pages/admin/`
- Admin runtime and styling under `apps/web/public/admin/`
- Shared slug generation under `apps/web/src/lib/slugs.ts`, Artist collection contracts, and existing Artist identity checks
- Existing BlackBox brand assets and the standalone local CMS launcher
- Home, About, and Services content schemas, content files, query helpers, page rendering, and preview templates
- Store Item, Release, Artist, News, page, navigation, social, newsletter, and settings collection builders
- Decap package versions, lockfile, local proxy scripts, and CMS smoke commands
- Local and UAT browser validation, generated-config tests, collection contract tests, content migration checks, and repository documentation
- No shopper-facing commerce authority, Stripe, D1 stock, checkout, order, or fulfillment ownership moves into Decap
