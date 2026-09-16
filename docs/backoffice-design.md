# Backoffice design reference

Living document · reviewed 2026-09-16 · audience: content editors and label members.

This is the design reference for **Content, Images, Items, Stock, and Orders**. The public site's expressive music identity remains in [DESIGN.md](../DESIGN.md); staff work needs quieter typography, predictable actions, and accurate operational state. Update this document in the same change as a backoffice behavior or pattern change.

## Decision states and maintenance

- **Proposed**: researched recommendation, not implementation authority.
- **Accepted**: explicitly approved behavior awaiting delivery.
- **Implemented**: verified behavior, with evidence linked below.

For each change record the date, affected task, before/after screenshot, rationale, acceptance evidence, and any remaining limitation. Use browser screenshots of the real implementation, not generated mockups. Keep private customer/order information out of committed evidence.

## Shared workspace rules — accepted

Members should learn one workspace, then recognize the others. Keep Content as the landing page and the Content / Items / Stock / Orders navigation stable. Images remain part of Content. Preserve deep links, selected records, and return context.

| Pattern     | Rule                                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typography  | Use the existing staff sans-serif for navigation, forms and operational headings. Reserve display typography for public previews.                               |
| Layout      | One clear page/task heading. Search/filter/refresh controls in a consistent toolbar. Sticky primary actions for long editing tasks.                             |
| Spacing     | Use existing spacing tokens, with 16–24 px between groups; no per-workspace visual system.                                                                      |
| Controls    | Familiar installed shadcn/Radix primitives. Primary actions retain text. Icon-only controls require accessible names and tooltips. Aim for 44 px touch targets. |
| Color       | Blue: selection/action. Amber: unsaved/pending. Green: confirmed live/success. Red: failure. Pair color with text or an icon.                                   |
| Status      | Draft saved is not Live. A request being accepted is not completed. Preserve the last useful data while refreshing and label stale results.                     |
| Detail      | Show what helps a member act. Put technical diagnostics behind an error-only disclosure; retain copyable reconciliation identifiers.                            |
| Feedback    | Explain blocked actions beside the action. Keep validation, conflicts, crop guidance, stock authority, delivery facts, and recovery instructions.               |
| Responsive  | Desktop density must not create phone-sized targets. Use existing narrow-screen sheets/tabs, visible focus and reduced-motion support.                          |
| Performance | Start independent reads together; do not hide usable content behind unrelated reads. No background preview work while closed.                                   |

Existing shared navigation, semantic colors, preview controls, image thumbnails/dimensions and async Stock reads are implemented. The recommendations below must not be counted as newly delivered versions of those existing features.

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

## Three improvements per workspace — proposed

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

## Accepted reliability behavior

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

| Workspace | Implemented visual treatment                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Content   | Clear current publication hierarchy, compact history rows, current-request marker, tighter toolbar, and consistent status alerts. |
| Images    | Grid/list density switch, selected and focused states, dimensions, crop-suitability guidance, and field-aware error treatment.    |
| Items     | Grouped setup sections, a compact readiness checklist, and clearer next-step context.                                             |
| Stock     | Compact operator header, Adjust/Count modes, before/after quantities, and denser history.                                         |
| Orders    | Compact filter toolbar, status pills, stronger order-row hierarchy, and grouped detail facts.                                     |

These changes use the installed Lucide and shadcn/Radix primitives, Inter/system typography, existing API data, and existing permission/recovery boundaries. They do not add a component library, commerce action, publication endpoint, or interactive preview behavior. The remaining research ideas in the tables above stay proposed until a separate slice selects them.

### Decision history

- 2026-09-16: created a staff-specific reference following research across twelve products. Shared consistency and reliability rules accepted; the initial workspace ideas remained Proposed until the second research round. Public branding and commerce permissions unchanged.
- 2026-09-16: selected Content inline validation, discard recovery, grouped fieldsets, and field-aware Images errors for the editor safety slice. Items, Stock, and Orders remain proposed for later work.
- 2026-09-16: selected and implemented the publication-status priority rule and the visual refresh for Content, Images, Items, Stock, and Orders. Retained publication history remains unchanged; current-state status is derived separately.
- 2026-09-16: implemented direct entry for the true singleton Content sections (`home`, `about`, `services`, `distro_page`, `purchase_information`, `newsletter`, `settings`). Collection sections retain list-first selection; direct links and unsaved-change protection remain unchanged. Local acceptance is covered by `scripts/test-content-workspace.mjs`.
