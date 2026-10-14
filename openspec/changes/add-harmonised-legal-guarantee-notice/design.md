# Design

## Context

See [proposal.md](proposal.md). This delivery is preparation only: the owner assigned all UI changes, including rendered copy, to Claude Desktop. No preview approval is requested in this chat. [handover.md](handover.md) is the implementation contract for Claude; its proposed placement is not an approved design.

## Goals / Non-Goals

**Goals:** provide the legal evidence, bounded edit points, accessible presentation requirements and focused acceptance cases needed for a small UI change.

**Non-Goals:** new backend endpoints, schema or provider changes; a new commercial warranty; rewriting accepted terms; CMS mutation or publication; changes to order emails, tax or launch controls.

## Decisions

1. **Use the existing purchase-information capability.** The notice complements the current approved terms. A separate compliance subsystem would duplicate content and authority.
2. **Use official fixed artwork, served as a local static asset after approval.** Regulation 2025/1960 Annex I controls its appearance. Do not redraw, recolour, crop or regenerate the notice. English matches the current site; supply the official Greek version alongside it for Greek shoppers. Claude obtains the official files and records their provenance and hashes when implementing.
3. **Propose a first-click native disclosure near checkout review plus a shop-level reminder.** Commission practical guidance section 2.3 illustrates first-click reminders on catalogue, header and checkout surfaces. Prefer existing primitives/native disclosure and a normal terms anchor over another modal, new route or custom hover machinery. The complete notice needs room; the preview must establish readable desktop and phone presentation before implementation.
4. **Keep content ownership unchanged.** Existing `purchase_information` accepted content supplies contractual wording; statutory artwork is code-owned and uneditable. No API or data model is required. If a narrow editorial cross-reference is later approved, Claude edits only the current CMS record through normal review, never the fixture as a substitute for publication.
5. **Keep confirmation-email work separate.** The Commission recommends including the notice in confirmation emails. Parent owns the user's future company-transition/order-confirmation OpenSpec; this change neither implements nor duplicates it. Website delivery alone does not prove durable-medium acceptance.

## Risks / Trade-offs

- [Too small a notice on phones] → Preview normal-size readability at 320/390px, retain full proportions and provide real text outside the artwork; do not accept a thumbnail alone.
- [Mistaking linked text or existing terms for the prescribed notice] → First activation reveals the complete official RGB notice. A footer-only generic policy link is not this proposal's primary placement.
- [Overwriting current editorial content with stale fixtures] → Preserve the accepted snapshot and reconcile any draft against its current revision before a separately authorized publication.
- [Unseen UI implemented without approval] → Claude owns the preview and user approval checkpoint; all dependent UI tasks remain unchecked here.
- [Guidance confused with binding law] → [legal-research.md](legal-research.md) distinguishes the regulation/Greek provisions from Commission service guidance and implementation recommendations.

## Migration Plan

No migration is needed. Claude implements after the preview gate, runs focused and final checks, and records browser evidence. Any software release and any CMS publication require their respective authorization. Reverting the UI code reverses its presentation; reverting a content change requires a separately reviewed content operation.
