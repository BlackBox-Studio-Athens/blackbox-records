# Backoffice design reference

The staff interface is built on EmDash's APIs, not a second CMS or a replacement admin backend. EmDash owns content, private drafts, revision conflict checks, references, media, and the reused Portable Text editor. Label-specific forms and publication review coordinate these APIs with the existing commerce services. The native full admin screens are not the staff navigation foundation.

Living document · reviewed 2026-09-17 · audience: content editors and label members.

This is the design reference for the **staff workspace**. The public site's expressive music identity remains in [DESIGN.md](../DESIGN.md); staff work needs quieter typography, predictable actions, and accurate operational state. Update this document in the same change as a backoffice behavior or pattern change.

## Decision states and maintenance

- **Proposed**: researched recommendation, not implementation authority.
- **Accepted**: explicitly approved behavior awaiting delivery.
- **Implemented**: verified behavior, with evidence linked below.

For each change record the date, affected task, before/after screenshot, rationale, acceptance evidence, and any remaining limitation. Use browser screenshots of the real implementation, not generated mockups. Keep private customer/order information out of committed evidence.

## Record-label workspace — accepted 2026-09-17, implementation under verification

This decision supersedes the Content landing dashboard, persistent staging queue, manual refresh controls, separate Items navigation, and closed-by-default desktop preview described in the historical research below. The accepted implementation plan is tracked in [the change checklist](../openspec/changes/redesign-staff-workspace/tasks.md). Do not treat old research screenshots as evidence for the redesign.

Use one dark workspace: **Overview**; **Catalog** (Artists, Releases, Distro & merch); **Website** (Pages, News, Navigation & footer, Label details); **Images**; **Stock**; **Orders**. The root and logo open Overview. Existing content and variant links remain supported. Navigation describes members' work, while editorial, price, stock and publication authorities remain separate.

Overview starts with Edit a page, Add to the catalog, and Update stock. Recent private drafts and actionable website/order problems follow as ordinary rows. No fabricated totals or workflow tutorial. Website Pages opens Home, About, Services, Distro introduction and Buying & delivery directly. Buying & delivery retains its wording approval.

Editors save private drafts after 1.5 seconds without typing. Unfinished fields may be saved; structural, size, security and supplied-reference checks still apply. Publication completeness is checked separately. One save runs at a time; newer typing survives older responses. Failure and conflict retain local input. Navigation must finish saving or offer recovery. Closing a browser is never a save guarantee.

Publish changes reviews an exact saved version and its destination. New typing remains private. Optional list selection uses the existing twenty-entry limit; the old persistent staging step is removed, and old retained selections are recovered for explicit review. Per-entry website state comes from the accepted snapshot, not the latest global publication. Prices and stock always require explicit confirmation.

Releases and distro/merch use Details, Selling and Stock. Creation follows Details → Price & starting stock → Review; a website-only release skips selling. A sold-out title is a valid state. The stock workspace offers Add or remove copies and Count stock, preserves entered quantities when background reads change, and requires reassessment of a changed count baseline. Orders searches the complete server result set with cursor pagination. Email delivery never means parcel dispatch.

Use sans-serif text, 16 px inputs, 44 px targets, restrained headings, blue actions, and semantic states with text. At 1280 px and above, editors start beside a resizable preview; visibility preference is remembered. Smaller widths use Edit/Preview tabs. Public components retain their own design. Images stays flat, with contextual selection, placement-owned alt text, search and grid/list views.

### Staff navigation and identity, approved 2026-09-17

The selected A direction supersedes the all-in-one global sidebar. At widths of at least 1440 px, use a 72 px dark header with six equally prominent labeled icons: Overview, Catalog, Website, Images, Stock and Orders. Muted gray, violet, blue, sage, copper and teal icon backgrounds identify these areas; filled backgrounds and stronger text identify the active area. Blue remains the primary action color. Navigation adds no reads or counters.

Catalog opens Releases and shows Artists, Releases and Distro & merch in a 256 px contextual sidebar. Website opens Pages and shows Pages, News, Navigation & footer and Label details. Sidebars stay visible while editing, with an optional hide control remembered per area. Other areas use the full content width. Below 1440 px, a compact header names the current area and opens a labeled Menu drawer containing the same destinations and contextual links. Existing draft-save interception protects navigation; menus do not dismiss a failed save.

Add opens existing Artist, Release, Distro and Merch creation flows. View website opens the matching Local, UAT or PRD public homepage in a new tab. Preserve the UAT indicator and existing URLs, Back behavior and editor state.

The user selected logo C, Office stamp, after three image-generated concepts using the original logo as reference. The available built-in image model was explicitly approved instead of an unverifiable GPT Image 2.5 selection. Following the user's fidelity correction, production uses the selected C artwork extracted directly from the approved concept image, with its dark background removed and edge transparency reconstructed. Do not substitute an HTML badge or regenerate the lettering. The transparent 686 × 162 PNG preserves the selected composition and replaces only the staff logo asset. The accessible logo name is BlackBox Records Staff and it links to Overview. Public branding is unchanged. The reference image remains in the local generated-image evidence, not the shipped assets.

Verify the shell at 390, 768, 1280, 1439, 1440 and 1600 px in Chromium and Firefox, including menu focus, pending saves, selection, contextual visibility, logo readability and overflow. Browser evidence remains under ignored validation artifacts.

### Automatic updates

| View                              | Policy                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| Catalog, pages, images            | Entry, confirmed changes, stale return/reconnect; search after 300 ms                |
| Visible orders and selected stock | 60 seconds, plus entry and stale return/reconnect                                    |
| Pending publication               | 2 seconds during the first minute, then 30 seconds; stop at settlement or 30 minutes |
| Open preview                      | Existing 750 ms typing debounce; immediate opening/context change                    |

Pause hidden/offline background reads, deduplicate simultaneous reads, retain useful results, and offer contextual Retry. A publication timeout says Update not confirmed and offers Check status. Editor buffers are never query-cache state.

### Evidence and rollout

Run repository and editor gates against the final tree, browser acceptance at 390/768/1280/1600 px in Chromium and Firefox, and the real shared-template preview smoke. The fixture preview is intentionally simplified and cannot establish public-template fidelity. Screenshots and logs remain under ignored `.codex-artifacts/`. Measure request/database-read costs locally before the bounded UAT pilot required by [the Free-tier rule](cloudflare-free-tier.md). This redesign does not authorize payment launch, public-site redesign or fulfillment automation.

## Research ledger

Reviewed official documentation and product UI examples on 2026-09-16. This is a reference study, not authenticated usability testing of all twelve products. Ghost's publishing example also received direct browser visual review. Adopt the task pattern, not a product's branding or its larger feature set.

| Reference                                                                                                          | Useful observation                                                     | Application / boundary                                                                |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Sanity preview and page building](https://www.sanity.io/docs/user-guides/preview-and-page-building)               | Editing benefits from clear visual context.                            | Locate the edited section in preview; keep our iframe non-interactive.                |
| [Contentful live preview](https://www.contentful.com/help/content-preview/live-preview/)                           | Side-by-side content and appearance reduce context switching.          | Preserve our optional editor/preview split.                                           |
| [Payload live preview](https://payloadcms.com/docs/live-preview/overview)                                          | Preview widths support reviewing actual layouts.                       | Keep real Desktop/Mobile iframe widths.                                               |
| [Strapi Content Manager](https://docs.strapi.io/cms/features/content-manager)                                      | Collection records and singleton settings are different editing tasks. | Singleton settings should open directly; collections retain selection.                |
| [Ghost publishing](https://ghost.org/help/publishing-content/)                                                     | Preview and publish have clear positions and deliberate steps.         | Stable sticky actions and distinct draft/publication states.                          |
| [Directus file library](https://docs.directus.io/user-guide/file-library/files)                                    | Central asset management connects to field-level selection.            | One image library, with the calling field's context preserved.                        |
| [Shopify product views](https://help.shopify.com/en/manual/products/searching-filtering)                           | Search, filters and views organize operational lists.                  | Start with existing fields and truthful result coverage, not a new query platform.    |
| [Medusa Admin](https://medusajs.com/admin)                                                                         | Product, inventory and order tasks share an admin vocabulary.          | Make cross-workspace handoffs consistent; do not import unsupported commerce actions. |
| [Stripe Dashboard search](https://docs.stripe.com/dashboard/search)                                                | Search leads to identifiable operational records.                      | Keep useful order identifiers searchable/copyable, with details grouped by task.      |
| [Linear views](https://linear.app/docs/custom-views)                                                               | Repeated list patterns reduce relearning.                              | Shared toolbar, selection and status hierarchy across staff workspaces.               |
| [Notion views, filters and sorts](https://www.notion.com/help/views-filters-and-sorts)                             | Different representations can use the same underlying records.         | Image grid/list density can change without changing asset authority.                  |
| [Airtable interface designer](https://www.airtable.com/guides/collaborate/getting-started-with-interface-designer) | Interfaces can prioritize the operator's task over raw fields.         | Group relevant details and reduce persistent implementation copy.                     |

Operational detail references: [Shopify stock adjustments](https://help.shopify.com/en/manual/products/inventory/adjusting-inventory/adjusting-inventory-quantities) and [order details](https://help.shopify.com/en/manual/fulfillment/managing-orders/managing-order-details).

## Historical proposals — superseded where they conflict with the accepted redesign

Effort is relative: Small uses existing data and components; Medium changes a multi-step interaction. These are recommendations for the next UI slices, not permission to add commerce capabilities.

| Workspace | Proposal                                               | Benefit                                                                  | Effort / acceptance                                                                                            |
| --------- | ------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Content   | Open singleton settings directly.                      | Removes a one-record list and extra selection.                           | Small: direct entry, deep links and unsaved-change protection still work.                                      |
| Content   | Consistent field sections and sticky actions.          | Long forms use the same hierarchy and action position.                   | Medium: required fields/errors remain visible; only optional groups collapse.                                  |
| Content   | “Show section in preview” action.                      | Makes an edited footer/newsletter/page section easy to find.             | Medium: parent scrolls to a known section; no links/scripts enabled in iframe.                                 |
| Images    | Compact grid/list view choice.                         | Grid supports recognition; list supports comparing dimensions and names. | Small: same records/search/selection; no duplicate fetch pipeline.                                             |
| Images    | Consistent metadata and crop inspector.                | Dimensions and suitability are visible together.                         | Medium: reuse existing metadata and crop guidance, no invented crop editor.                                    |
| Images    | Preserve picker return context.                        | Members return to the same field and library position.                   | Medium: retain search, selected image, scroll and focus; no extra confirmation step.                           |
| Items     | Align headings, field groups and actions with Content. | Item creation feels like part of the same app.                           | Small: existing creation locks/recovery remain intact.                                                         |
| Items     | Actionable readiness summary.                          | Shows what still prevents setup/publication.                             | Medium: derived only from current authoritative fields, with links to fix each blocker.                        |
| Items     | Clear related-content and stock handoffs.              | Members move to the next task without searching again.                   | Small: preserve selected item and back destination; retain ownership boundaries.                               |
| Stock     | Explicit Adjust stock / Count stock tabs.              | Separates a known movement from a physical recount.                      | Small: both existing operations retain validation and confirmations.                                           |
| Stock     | Before/after quantity beside submission.               | Makes the intended stock effect easier to check.                         | Small: advisory calculation only; server freshness/revision guards remain authoritative.                       |
| Stock     | Compact movement history.                              | Quantity, reason and time can be scanned together.                       | Small: use existing history, loading and failure states; do not imply complete data beyond its limit.          |
| Orders    | Compact filter toolbar.                                | Active filters and reset are easy to understand.                         | Small: use current statuses and preserve the existing latest-record coverage warning.                          |
| Orders    | Prioritize order identity, items and state in rows.    | Common triage needs fewer detail opens.                                  | Medium: payment and fulfillment remain separate; no invented status.                                           |
| Orders    | Group payment, delivery and notification details.      | Members can find the next operational fact quickly.                      | Medium: retain copyable IDs and chronological facts from actual timestamps; no new refund/shipping automation. |

## Historical reliability decisions — subject to the accepted redesign

- Publication requests start the existing dispatcher immediately; scheduled dispatch is recovery.
- Register workflow identity before release validation. Failed/cancelled runs must not remain Pending indefinitely. A deployment receipt still requires verification before Live.
- Refresh publication status directly from the top bar. Poll only while visible: 15 seconds initially, 30 seconds after two minutes, stop automatic polling after thirty minutes or settlement. Returning to the tab checks immediately; manual refresh remains available.
- Preview starts closed on desktop, remembers that preference, and renders current unsaved input when opened. Narrow screens start in Edit.
- “Preview up to date” belongs only to the current displayed generation. Failed updates retain a visibly outdated previous rendering.
- Respect the public site's optional-font fallback. A browser choosing its fallback after an optional font's display deadline is valid rendering; required font, stylesheet and image failures remain actionable errors. See [font-display behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display).
- Diagnostics contain correlation IDs, numeric generations and failure stages, never draft text or credentials. An unconfirmed browser bug stays documented as unconfirmed.

## Review checklist and evidence

Review Content, Images, Items, Stock and Orders at 390, 768, 1280 and 1600 px. Exercise keyboard navigation, focus return, touch targets, reduced motion, contrast, empty/loading/error states, and unsaved-change protection. Check cross-workspace terminology before adding a new component.

Current evidence and unresolved hosted acceptance are recorded in [preview validation](../openspec/changes/improve-content-workspace-previews/validation.md) and the [publication status refresh validation](../openspec/changes/publication-status-and-backoffice-refresh/validation.md). Fixture screenshots are local under `.codex-artifacts/content-workspace/`; they are not proof of hosted production behavior.

## Second research round — 2026-09-16

This round focused on safe editing and the existing Content / Images slice. The sources below describe patterns that fit the current app; they do not authorize new permissions, autosave, or a new component library.

| Reference                                                                                             | Useful observation                                                                                                              | Application now                                                                                                             |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [Sanity validation](https://www.sanity.io/docs/studio/validation)                                     | Validation belongs to the field or object that can be corrected, while document-level rules cover relationships between fields. | Keep Zod as the shared source of truth, return paths for nested issues, and render the message beside the affected control. |
| [Contentful live preview](https://www.contentful.com/developers/docs/tutorials/preview/live-preview/) | Side-by-side preview keeps the draft and its visual result in one working context.                                              | Keep preview optional, preserve the last good frame, and block requests when the draft cannot render validly.               |
| [Payload live preview](https://payloadcms.com/docs/live-preview/overview)                             | Breakpoint-aware preview controls are useful when they change the viewport being reviewed.                                      | Keep Fit, Desktop, and Mobile controls tied to real iframe widths.                                                          |
| [shadcn Field](https://ui.shadcn.com/docs/components/base/field)                                      | Labels, descriptions, controls, and errors form one accessible field unit.                                                      | Use `Field`, `FieldSet`, `FieldGroup`, and `FieldError` for Content sections and inline errors.                             |
| [shadcn Combobox](https://ui.shadcn.com/docs/components/base/combobox)                                | Searchable selection works best when the trigger, search field, current choice, and empty state are explicit.                   | Keep the installed Command / Popover relationship picker and attach external schema errors to its trigger.                  |
| [shadcn Sheet](https://ui.shadcn.com/docs/components/aria/sheet)                                      | A sheet supports a focused mobile selection task without losing the parent form.                                                | Keep image selection in the existing Sheet and return focus to the calling field.                                           |
| [shadcn Alert Dialog](https://ui.shadcn.com/docs/components/base/alert-dialog)                        | Destructive or irreversible actions need a deliberate confirmation step.                                                        | Use the existing AlertDialog for visible discard recovery and restore focus to its trigger.                                 |

### Selected for this commit

| Workspace | Idea | State | Why |
| --- | --- | --- |
| Content | Inline schema validation beside each field, including nested rows. | Implemented | Editors can correct the value before Save, Publish, or Preview is attempted. |
| Content | A visible discard action with confirmation and saved-version recovery. | Implemented | Recovery is discoverable and protects unsaved work across navigation. |
| Content | Grouped fieldsets with sticky editing actions. | Implemented | Long forms keep a clear hierarchy while the primary actions remain available. |
| Images | Field-aware picker errors with image suitability metadata. | Implemented | A failed or unsuitable selection is actionable at the field that owns it. |

### Three ideas per workspace after the second round

The three Content ideas, the first two Images ideas, the first two Items ideas, and all three Stock and Orders ideas are selected for the current refresh. The remaining ideas stay proposed for later slices.

| Workspace | Idea 1                                                                     | Idea 2                                                               | Idea 3                                                              |
| --------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Content   | Inline field validation and focus to the first invalid value. **Selected** | Visible discard recovery with confirmation. **Selected**             | Grouped fieldsets and sticky actions. **Selected**                  |
| Images    | Field-aware picker errors and suitability metadata. **Selected**           | Compact grid / list view for recognition or comparison. **Selected** | Preserve search, scroll, and calling-field return context. Proposed |
| Items     | Readiness checklist linked to the fields that block handoff. **Selected**  | Field-level commercial validation before publication. **Selected**   | Related-content handoff that preserves the selected item. Proposed  |
| Stock     | Explicit adjustment and recount modes. **Selected**                        | Before-and-after quantities beside submission. **Selected**          | Compact history for quantity, reason, and time. **Selected**        |
| Orders    | Quick filters for common operational states. **Selected**                  | Clearer status identity in each order row. **Selected**              | Grouped payment, delivery, and notification details. **Selected**   |

### Publication status truth and visual refresh — 2026-09-16

The top-right publication indicator represents the current request, not the most alarming retained history row. The summarizer uses this order:

1. `Publishing…` while the current request is being submitted.
2. `Publishing · N pending` when the newest journal entry is pending.
3. `Publication failed` when the newest journal entry failed.
4. `Latest publication live` when the newest journal entry is live.
5. `Publication status unavailable` when the current state cannot be trusted.

History is an audit trail. Keep every row, label the newest row **Current**, and label older failures as historical. A status-read error is separate from the publication message, so a failed refresh cannot reinterpret an old row or claim Live. The refresh action stays visible beside the status and pending polling continues only while the page is visible and inside its existing bound.

The second research round selected the following visual work for the current refresh:

| Workspace | Implemented visual treatment                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content   | Clear current publication hierarchy, staged queue with responsive Popover/Sheet controls, compact empty dashboard, compact history rows, current-request marker, tighter toolbar, and consistent status alerts. |
| Images    | Grid/list density switch, selected and focused states, dimensions, crop-suitability guidance, and field-aware error treatment.                                                                                  |
| Items     | Grouped setup sections, a compact readiness checklist, explicit publication ownership, read-only stock summary, and clearer next-step context.                                                                  |
| Stock     | Compact operator header, Adjust/Count modes, before/after quantities, explicit mutation ownership, and denser history.                                                                                          |
| Orders    | Compact filter toolbar, status pills, stronger order-row hierarchy, and grouped detail facts.                                                                                                                   |

These changes use the installed Lucide and shadcn/Radix primitives, Inter/system typography, existing API data, and existing permission/recovery boundaries. They do not add a component library, commerce action, publication endpoint, or interactive preview behavior. The remaining research ideas in the tables above stay proposed until a separate slice selects them.

### Decision history

- 2026-09-16: created a staff-specific reference following research across twelve products. Shared consistency and reliability rules accepted; the initial workspace ideas remained Proposed until the second research round. Public branding and commerce permissions unchanged.
- 2026-09-16: selected Content inline validation, discard recovery, grouped fieldsets, and field-aware Images errors for the editor safety slice. Items, Stock, and Orders remain proposed for later work.
- 2026-09-16: selected and implemented the publication-status priority rule and the visual refresh for Content, Images, Items, Stock, and Orders. Retained publication history remains unchanged; current-state status is derived separately.
- 2026-09-16: implemented direct entry for the true singleton Content sections (`home`, `about`, `services`, `distro_page`, `purchase_information`, `newsletter`, `settings`). Collection sections retain list-first selection; direct links and unsaved-change protection remain unchanged. Local acceptance is covered by `scripts/test-content-workspace.mjs`.
- 2026-09-17: implemented the staged Content publication queue, responsive Popover/Sheet queue UI, compact empty dashboard, populated More draft actions, explicit Releases/Distro Items handoff, and the Items/Stock ownership boundary. Chromium browser regression passed; Firefox and repository gates remain the final acceptance checks for this change.

## Growing catalog and stocktakes

Distro & merch uses EmDash field filtering and cursor pagination: All, Distro, Merch and existing format groups, with title/recently edited sorting and 25-entry pages. Filters apply before pagination. No new taxonomy or public category is created.

Use the shared catalog pager above and below results, with distinct accessible region labels, side-by-side Previous/Next actions and 44 px targets. Position text states entries on this page and a page ordinal only when the visited trail establishes one. Copied cursor URLs expose First page without fabricating a predecessor. Successful page changes focus the results heading and reset the results scroll container; failed reads and automatic refresh preserve position.

Each task has one visible `Back to <destination>` action near its heading. Prefer the captured originating task, including filtered list position or Review changes; direct links use the named collection, Pages, Navigation & footer, Inventory or Orders parent. Roots fall back to Overview. Page Previous, task Back, panel Close and a setup previous-step action have distinct meanings. Native history and one optional full-document handoff carry navigation metadata only. All leave paths retain autosave, conflict, unfinished-input and operation-recovery protections.

Stock uses the available width for thumbnail rows and quantities. Selection opens a 420 px task panel at 1280 px and above; smaller screens open a focused task with Back to inventory. Search and filters operate on the complete operational result set. Legacy CD/Tape labels remain stored unchanged and match CDs/Tapes filters.

Start stocktake captures a fixed sequence from the selected group using bounded inventory pages. Record count and next confirms one existing revision-protected stock count at a time. Previous, Skip for now and Finish stocktake retain explicit control. Same-tab session storage remembers progress, not authoritative stock. Unconfirmed counts preserve their baseline and entered values for recovery; a changed baseline requires reassessment. New arrivals enter the next stocktake.

EmDash's exported ContentRepository resolves editorial links in batches. Stock remains authoritative in the commerce repository. Artwork enrichment failure must not hide inventory. Browsing adds no schema writes: an administrator-only, same-origin POST to `/_emdash/api/blackbox/catalog-schema` prepares optional Distro Bandcamp/Tidal URL fields, the Distro group index, and title sorting through EmDash SchemaRegistry. Local startup performs this idempotent setup; hosted invocation requires the separate Free-tier preflight and UAT approval. New databases receive the fields through the seed schema.

Acceptance includes 250+ entries, real Local EmDash reads and Chromium/Firefox checks. Hosted validation and rollout remain separate.

Local read-cost evidence: the real D1 integration test with 250 inventory items measured one SQL statement and 375 rows read for a filtered 25-item page. The browser regression observes one inventory request plus one batched artwork request per settled page; image-file requests are separate. This excludes authentication/session costs and is not a hosted quota measurement. Measure the complete UAT request path under the Free-tier preflight before rollout.

## Website changes review (September 2026 refinement)

Staff utilities and Overview open `/review/`. This supersedes the list-checkbox publication queue. Review discovers saved unpublished Website and Catalog entries through the EmDash workspace adapter, with search, area filters and up to 25 entries per page. Selection persists in the same tab, up to 20 entries across pages. Incomplete drafts remain visible with editing links. A final review checks saved versions; a changed version requires renewed review. The editor's Review changes shortcut finishes autosave and opens an individual review without replacing grouped selection. One selected entry uses Publish change; several use Publish N changes.

Editorial publication includes selling-linked entries but does not activate the shop, change price, or change stock. Selling retains its activation approvals and native lifecycle guard. Pending request identities survive response loss; failed operations require a fresh review. The batch service accepts all reviewed entries in one website update.

Count stock and Finish counting replace visible Stocktake wording; internal storage identities remain compatible. Quantities read Available to buy online, with copies for music and units for merchandise. The online quantity is how many customers may buy through the website.

Review discovery uses bounded native EmDash cursor reads and existing accepted-snapshot comparisons, never private CMS table queries. The client follows sparse continuations until its page fills or reaches the end, cancelling stale searches. It does not load the entire library into browser memory or poll a global draft count. Hosted rollout still requires a Free-tier cost preflight.

## Guided publication review

The approved B direction uses Select → Review → Publish. Individual Review changes finishes autosave and stays inside the editor; Back to editing preserves its buffer and the separate grouped selection. Group selection at `/review/` retains search, area filters, pagination and the twenty-entry limit. Incomplete entries keep editing links and validation messages.

Expandable entry comparisons label On the website and After publishing, with readable text, formatted content, images, descriptions, links and ordered lists. New entries say Not yet published. Explicitly include required unpublished references and review again. Already-published references use accepted website content even when newer drafts exist.

At 1280px and above, comparisons sit beside the private, non-interactive public-template preview. Opening one comparison entry controls the preview target; the preview selector is removed. Shared website changes preview the homepage. Smaller widths use keyboard-accessible Changes/Preview tabs. The existing staff header, branding, tokens and shadcn controls remain; a blue Review changes action with an icon and 44px targets identify the primary path. Publication history opens from the staff menu in a right-side panel with readable status badges, requested time and expandable details. A sticky action bar shows destination, count and Publish change/Publish N changes without another confirmation dialog.

Preparing, Checking website and Confirming publication reflect backend stages. Only confirmed public content says On the website. Check status recovers uncertain outcomes; terminal preparation failures return to review. A failed visual preview can be retried or explicitly bypassed, while mandatory server checks remain. Read-only history supports older pages and entry filtering, with unavailable legacy details labeled honestly.

Price, stock, shop activation and launch approvals keep their existing ownership. There is no scheduling, undo, restoration or approval-role workflow. Hosted rollout requires the existing Cloudflare Free-tier preflight and separately authorized bounded UAT acceptance.
