# Design

## Context

See proposal.md. Catalogue currently separates Details, Selling and a Stock summary that links to another workspace. Existing stock commands already provide revision checks and recovery. PRD Crawl review reported failure at image readiness; the same saved revision rendered successfully in Chrome during initial inspection.

## Goals / Non-Goals

Keep one item selected while editing details, photos, price and inventory. Preserve separate explicit commerce actions and private editorial autosave. Do not publish, discard, migrate, reseed or overwrite PRD drafts to reproduce a preview failure.

## Decisions

- Reuse existing media upload and stock APIs; introduce no service, dependency or duplicate inventory field.
- Use typed operation states and bound item identities so pending/failed work cannot appear confirmed or apply to a different item.
- Upload sequentially with per-file outcomes and append successful references in selection order. Preserve the cover and existing gallery. Report failed files without rolling back successful uploads.
- Reuse existing stock controls in the catalogue context, preserving revision checks, confirmation, navigation protection and recovery identities.
- The user approved the brief, then refined it to prominent Details & photos / Price & stock tabs on the same selected item. Both panels stay mounted to preserve uploads and unsaved commerce inputs. Commerce uses the full editor width; editorial work retains its responsive preview. Existing deep links to Selling or Stock open the commerce tab.
- Shop-publication status and actions remain visible near the top of the commerce tab. Saving a price updates the selling price; the separate publication action publishes saved editorial content without changing price or stock. Live-price confirmation remains conditional on the backend contract.
- The artist combobox resolves its saved reference directly before opening, independently of list pagination. Existing shadcn Popover and Command provide keyboard interaction; the search row uses scoped styling to avoid the general form-input border.
- Content editors expose a shadcn ButtonGroup with primary Publish changes and a review menu linking to the global review queue. Autosave remains private. Publishing flushes the current draft and passes its exact revision into the existing publication flow. Missing dependencies, revision conflicts and retained operations require the existing review/recovery path, with no automatic inclusion or second submission. Commerce commands keep their separate explicit controls.
- New sale items offer Create and publish after confirmed price and starting stock. Existing setup completes before existing shop publication enables buying. Keep as draft remains available, and leaving midway preserves private content plus unapplied commerce inputs in the current browser session. Restored drafts and operations carry no publish intent.
- Research: [shadcn's split-button composition](https://ui.shadcn.com/docs/components/radix/button-group#dropdown-menu) fits an obvious primary action with related alternatives using installed primitives. [WordPress's editor guidance](https://wordpress.com/support/edit-content/) distinguishes publishing new work and updating published work; this workspace consistently says Publish changes so private autosave is never mistaken for a live update. References reviewed 2026-09-28; no external components or dependencies imported.
- Use the installed shadcn Accordion for secondary music, credits and full-text fields. Validation opens those groups. Keep history in a disclosure and shop-publication controls visible. Reuse the existing field and button primitives; introduce no component dependency.
- Design Library references: Kokonut File Upload (`https://kokonutui.com/docs/inputs/file-upload`) for per-file feedback; shadcn Field, Tabs and Accordion documentation for grouping and keyboard behavior. These are reference patterns, not copied component source. The Shader Gradient library suggests one bounded decorative surface; a small native WebGL header fulfills the requested monochrome experiment without renderer dependencies. It stops when hidden/offscreen, caps resolution and frame rate, and uses CSS under reduced motion or unavailable WebGL. Image mocks are skipped for this refinement of the existing staff surface.
- Investigate preview failure using exact saved revisions and local reproductions; do not hide genuine broken images by declaring readiness successful.

## Risks / Trade-offs

- Lost commerce replies → preserve existing retry identity and uncertain state.
- Late upload completion → bind results to the original item and retain intervening field edits.
- Concurrent catalogue edits → preserve existing autosave conflict handling.
- Intermittent hosted image failure → distinguish reproduced causes from unverified reports.

## Migration Plan

Existing CMS instances need the additive releases.gallery registration through the existing CMS application migration command before gallery editing. It adds only missing nullable storage and field metadata, preserving release content and pending revisions. No reseeding or hosted migration is performed in this task. Rollback code without changing editorial or stock data.
