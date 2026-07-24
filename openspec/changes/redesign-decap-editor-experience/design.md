## Context

The current Decap editor already has the right authority boundary: it edits repository-owned content, publishes directly to `main`, and leaves price, stock, checkout, orders, and fulfillment outside the CMS. Its usability layer is the problem. The ready boot surface remains visible, nine runtime repairs depend on Decap 3.14.1 DOM details, fixed page sections are modeled as lists even though editors may not change their structure, and the largest collection is difficult to scan. These failures are most costly for the two to three non-technical editors whose main jobs are creating Store Items, adding product images, and creating Releases.

The redesign must stay inside Decap, support mobile editing, direct all editors to the shared label Google account through hosted DecapBridge PKCE, and retain direct-to-`main` publishing. Hosted DecapBridge owns its provider-selection page, so repository-owned copy and tests must not claim that Microsoft or password choices are suppressed. The implementation may change any repository-owned CMS, content, schema, preview, test, or documentation surface. Simplicity and native Decap behavior take precedence over preserving the current customization layer.

## Goals / Non-Goals

**Goals:**

- Remove the boot surface automatically when Decap is ready while retaining bounded loading, disabled, and failure states.
- Upgrade to one exact Decap runtime/proxy baseline in the same change.
- Make Store Item creation, Store Item image work, and Release creation the shortest and clearest editor paths.
- Replace fixed-layout section lists with content shapes that cannot expose invalid structural controls.
- Use supported Decap configuration and extension APIs before custom DOM or CSS behavior.
- Make the authenticated collection and entry views usable on mobile and desktop.
- Keep generated configuration and rendered behavior covered by deterministic tests and Browser Use checks.

**Non-Goals:**

- Replacing Decap or introducing another CMS, design tool, approval workflow, or editor role system.
- Moving commerce authority into content or changing direct-to-`main` publication.
- Redesigning the public BlackBox site.
- Adding a compatibility facade for the old fixed-section content shapes.
- Building a general admin design system or a new media library.

## Decisions

### Upgrade Decap in the redesign

The implementation will pin `decap-cms@3.15.1` and `decap-server@3.10.0`. Package metadata, lockfile, browser script URL, local proxy tooling, tests, and compatibility notes will move together. There will be no separate spike or dual-version support.

This keeps one compatibility target and lets the redesign remove patches that only existed for 3.14.1. Deferring the upgrade would require validating the brittle layer twice.

### Treat the boot surface and CMS mount as separate app-owned lifecycle UI

The admin document will provide a stable `<div id="nc-root"></div>` for Decap and a separate boot root. The boot controller will own exactly four states: loading, ready, disabled, and failed. Calling `CMS.init()` is not readiness because Decap 3.15.1 schedules its React render without returning a readiness promise.

After `CMS.init()`, one bounded child-list observer scoped only to `#nc-root` will wait for the mount to contain its first rendered child. If a child already exists, readiness is immediate. The observer disconnects on success, failure, timeout, retry, or disposal and never observes `document.body`. Entering ready will remove or natively hide the boot root so it contributes no layout, focus target, live-region announcement, or duplicate visible surface. `.blackbox-cms-boot[hidden]` will enforce `display: none` as a defensive invariant.

The controller will not wait for editor interaction. An empty `#nc-root` remains loading until the bounded timeout; failure and disabled states remain visible and useful.

### Treat shared Google sign-in as an operating rule, not a hosted-provider claim

Hosted authentication remains DecapBridge PKCE. BlackBox-owned loading, login guidance, documentation, and owner acceptance will tell editors to use the shared label Google account. The CMS presents one understandable action that continues to DecapBridge and never asks editors for repository URLs, branches, GitHub tokens, or a CMS-specific username and password.

The DecapBridge-hosted provider page may expose Google, Microsoft, or password methods. Automated tests will validate the BlackBox-owned guidance and safe hosted configuration, not claim provider exclusivity the repository cannot enforce. Self-hosting DecapBridge only to remove alternate providers is outside this change because it adds infrastructure without improving the confirmed editorial tasks.

### Reconcile every current repair before deleting the broad observer

Generated Decap configuration remains the source of truth for collection order, labels, summaries, sorting, groups, filters, field constraints, relation fields, image behavior, list presentation, and preview availability. Supported preview-template and media-resolver registration APIs remain valid custom extensions.

The current observer watches the whole body for the active CMS session, although its callback is animation-frame coalesced and cleaned up. The redesign will remove that broad lifecycle and the aggregate repair registry only after every existing behavior has the following disposition:

| Current repair                 | Redesign disposition                                                                                                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bounded-rerender-observer`    | Delete the body-wide observer. Use the one-shot `#nc-root` boot observer plus route-scoped bounded waits only for retained exceptions.                                                                                           |
| `decapbridge-login-surface`    | Prefer the native 3.15.1 login action. Retain one bounded semantic relabel only if the native action is not understandable in Browser Use; guidance says to use the shared Google account without claiming provider exclusivity. |
| `editor-scope-panel`           | Delete it. Put direct-to-`main`, content ownership, and commerce-boundary guidance in native collection descriptions, field hints, and warnings.                                                                                 |
| `empty-singleton-guard`        | Retain as a named no-native exception. Update it for canonical `site-pages` routes and Site Settings, activate it only on matching routes, and disconnect its bounded mount observer after loaded, failed, or abandoned state.   |
| `fixed-layout-section-actions` | Delete after Home, About, and Services use named objects. No structural list controls remain to repair.                                                                                                                          |
| `preview-auto-collapse`        | Delete. Do not synthesize preview clicks; use Decap's native initial state.                                                                                                                                                      |
| `preview-toggle-copy`          | Prefer the native 3.15.1 control. Retain a bounded semantic label/state adjustment only if the native control fails the specified accessibility acceptance.                                                                      |
| `saved-singleton-route-reload` | Characterize on 3.15.1 in the implementation slice. Delete it when the defect is absent; otherwise retain the smallest route-scoped guard with a focused regression test.                                                        |
| `top-level-media-hidden`       | Retain as a named semantic exception unless 3.15.1 provides a native omission. Target the stable Media route/action, not generated classes, and verify collection image widgets still work.                                      |

Any retained adjustment must target a stable semantic attribute, route, or app-owned element; run at a bounded lifecycle point; fail safely when its target is absent; and have one focused regression test plus a short compatibility comment. No document-wide session observer, generated-class contract, or timed synthetic editor action remains.

### Put routine work first and consolidate page singletons

The authenticated sidebar order will be:

1. Store Items — Distro & Merch
2. Releases
3. Artists
4. News
5. Site Pages
6. Advanced — Navigation
7. Advanced — Social Links
8. Advanced — Site Settings

`Site Pages` will be one native file collection with machine name `site-pages`. It contains the existing file identities `home-site`, `about-site`, `services-site`, `newsletter-site`, and `distro-page-site` in that order, without changing stored file locations. Their canonical editor routes become `#/collections/site-pages/entries/<file-id>`. File-specific preview registration continues to use each unchanged file ID. Singleton protection and smoke routes use the new collection name and exact entry IDs.

Each file entry receives one concise label and description through the existing YAML builder, which will gain explicit per-file `description` support. This reduces sidebar length without adding a custom navigation shell. Advanced labels communicate risk but do not imply permissions, because all editors use the same shared Google account.

### Model fixed pages as named objects

The fixed section arrays and their `type` discriminators will be replaced by named object fields:

- Home: `hero`, `news`, `artists`
- About: `hero`, `lead`, `story`, `quote`, `contact`, `stats`
- Services: `hero`, `services`, `process`, `inquiry`

The three committed JSON entries, Astro schemas, query helpers, page renderers, preview templates, and tests will change atomically. Repeatable content inside these objects remains a Decap list. No dual reader, migration script, or compatibility shape will be retained; Git history is the rollback path.

### Make Store Item and Release forms task-first

Store Item creation will expose identity, classification, image, alt text, and public summary before lower-frequency presentation metadata. The collection list will use native summaries, useful sort fields, group views, and filters for current Store Item groups. The create action will use a singular label and remain visible without scrolling through unrelated collections.

Release creation will place title, Artist relation, cover image, alt text, release date, formats, and public copy in task order. Closed values come from the same source as Astro validation. Required fields stay expanded; optional or repeatable details may use native collapsed summaries where that shortens the form.

No Store Item or Release field will expose commerce authority.

### Keep image work collection-owned and native

Collection image fields will use Decap's native image widget with one image per field and URL entry disabled. Editors can upload, select, replace, preview, and validate an image without understanding repository paths. Assets continue to save beside their owning content entries, and alt text remains a separate required field where the public schema requires it.

The global Media surface will be absent unless every asset it exposes can produce a valid collection-owned path. Existing preview media resolution and route safety remain.

### Replace deprecated options without changing stored prose formats

The configuration will use the current `logo` object instead of `logo_url`. Markdown-backed body fields will use Decap's current rich-text widget while preserving Markdown storage. Every committed Artist and News Markdown body present when the change is implemented must round-trip without destructive semantic changes before the deprecated widget is removed. Tests may accept harmless serializer normalization but must preserve headings, paragraphs, lists, links, emphasis, code, and other semantics present in each fixture. Native list `min` and `max` will only be used as a pair; ineffective limits will be removed or completed according to the public schema.

### Make mobile a supported editing surface

The implementation will start with Decap 3.15.1 responsive behavior, then add only scoped CSS needed for BlackBox branding and demonstrated defects. At 320 CSS pixels and wider, `document.documentElement.scrollWidth` must not exceed `clientWidth`; required navigation, fields, validation, image controls, preview controls, and publication actions must not be horizontally clipped. Primary workflow actions and standalone icon controls must have at least a 44 by 44 CSS-pixel target, an accessible name, and visible keyboard focus.

The native preview toggle remains the control surface. Store Item and Release editing width takes priority on narrow screens; preview may begin closed when the runtime supports that behavior without brittle automation.

### Validate contracts and real tasks

Generated YAML tests will cover exact versions, current options, canonical `site-pages` identity and file descriptions, collection order, filters, summaries, widgets, and absence of deprecated configuration. Content contract tests will cover the named fixed-page objects, all committed Markdown round trips, native list constraints, and every repair disposition. Boot tests will prove `CMS.init()` alone does not mark ready, the first `#nc-root` child does, and every observer/timer is cleaned up.

Local Browser Use checks will open the new Store Item and Release flows by semantic role/name, exercise selection of an existing collection image without saving or publishing, and verify the same routes at desktop and mobile widths. Local smoke records content-file hashes and `git status --porcelain` before and after the run and fails on mutation. UAT checks remain signed-out and read-only, validating shared-Google guidance on the BlackBox-owned admin surface, transition to hosted DecapBridge, boot dismissal, hosted configuration, and safe assets. Owner acceptance uses the shared Google account and remains no-publish.

## Risks / Trade-offs

- **Decap 3.15.1 may change undocumented DOM details.** Removing broad DOM coupling reduces this risk. Any unavoidable exception is isolated and tested.
- **The fixed-page schema migration is breaking inside the repository.** Changing content, schema, renderers, previews, and tests in one slice avoids a long-lived compatibility layer; `pnpm check` and `pnpm build` catch incomplete moves.
- **Hosted DecapBridge may show alternate provider methods.** The repository cannot enforce an exclusive Google provider UI on the hosted service. BlackBox guidance and owner acceptance require the shared Google account; self-hosting remains out of scope.
- **A shared Google account has no per-editor identity or role separation.** This is an accepted operating constraint. The UI will not claim individual attribution or permissions it cannot provide.
- **Direct publication leaves little recovery time.** Native validation, concise `main` warnings, protected deletion, and task-focused forms reduce mistakes; Git history remains the recovery mechanism.
- **Mobile Decap has upstream layout limits.** The plan requires functional mobile workflows, not a custom replacement shell. Scoped CSS is acceptable only for demonstrated defects.
- **Rich-text editing can rewrite Markdown.** Fixture round-trip checks gate the widget change.

## Migration Plan

1. Pin the new Decap runtime and proxy versions and update exact-version assertions.
2. Add the stable `#nc-root`, fix truthful boot readiness, and update shared-Google authentication guidance without provider-exclusivity claims.
3. Convert Home, About, and Services content and consumers to named object fields in one commit-sized slice.
4. Rebuild generated collection configuration for the new information architecture, task-first fields, native image options, filters, summaries, and current configuration keys.
5. Apply the repair-disposition table, removing the broad body observer and retaining only proven bounded semantic exceptions.
6. Update deterministic tests and no-write smoke checks, run Local Browser Use at desktop/mobile widths, then run repository gates.
7. Deploy the exact commit to UAT and run signed-out UAT smoke plus a shared-Google, no-publish owner walkthrough of the three top tasks.

Rollback is a Git revert of the implementation slice. There is no database or provider migration.

## Open Questions

None. Product constraints and editor priorities are confirmed.
