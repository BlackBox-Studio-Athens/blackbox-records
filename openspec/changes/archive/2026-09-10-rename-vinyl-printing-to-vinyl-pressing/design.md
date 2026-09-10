## Context

See `proposal.md` for motivation. The service title is duplicated deliberately across frontend and Worker strict enums, recipient maps, email copy, generated OpenAPI/client artifacts, Services content, and tests. The Services card title is projected into `data-services-inquiry-target-service` and drives form preselection. The content id is only a stable DOM/section anchor. The Worker provider tag is email metadata with no evidence-backed external identity dependency. `add-services-inquiry-email-delivery` is complete but still unarchived, so its artifacts must continue to describe the implementation they completed rather than this future rename.

## Goals / Non-Goals

**Goals:**

- Rename the visible service label and strict public request value in one reviewable change.
- Keep stale independently deployed frontend revisions working through one exact Worker-side normalization.
- Keep routing, validation, delivery, and user interaction behavior unchanged.
- Regenerate contracts from source rather than editing generated files by hand.

**Non-Goals:**

- Introducing a service registry, label/id abstraction, feature flag, migration table, or general compatibility system.
- Renaming the stable content section anchor, `Merch Printing`, email addresses, routes, or provider configuration.
- Rewriting completed or archived OpenSpec records or Git history.

## Decisions

### Perform a direct coordinated rename

Replace `Vinyl Printing` with `Vinyl Pressing` in current Services content, frontend/backend strict enums, visible inquiry/email copy, tests, and generated contracts. Keep the existing explicit maps; one renamed entry does not justify a shared registry or configuration layer.

### Normalize one stale-client value at the Worker boundary

Before canonical Services inquiry validation, normalize only the exact legacy request value `Vinyl Printing` to `Vinyl Pressing`. All recipient lookup, email content, logging, and provider tags then use the canonical value. Unknown values remain rejected. This handles cached static pages and independently deployed frontend/Worker revisions without adding a registry, flag, or second downstream enum.

### Preserve only the stable section anchor

Keep the content section id `vinyl-printing` because it is a DOM fragment anchor and does not drive preselection. Rename the provider-safe tag to `vinyl-pressing`; it is current email metadata, not an externally documented stable identifier. Correct the Sveltia hint to match the section-anchor role.

### Keep the recipient and detail prompt unchanged

`vinyl@blackboxrecordsathens.com` remains the server-owned recipient. `Format / Quantity / Target Date` and its hint already describe pressing inquiries correctly. Only service naming and copy that says printing changes.

### Regenerate public contracts

Change the canonical Worker source enum and route contract, run the existing API generation command, and accept the resulting OpenAPI/client diffs. Generated contracts expose only `Vinyl Pressing`; the request-boundary legacy normalization remains an undocumented runtime compatibility path. Do not patch generated JSON or TypeScript directly.

### Preserve completed-change accuracy and sequence OpenSpec work

Restore and leave the still-unarchived `add-services-inquiry-email-delivery` Services inquiry spec at `Vinyl Printing`, matching its completed implementation. Archive that complete change before applying this rename so its requirement becomes baseline without pretending the rename already shipped. This change's `services-inquiry` delta then replaces the functional form/routing language, while its `project-language` delta owns the canonical term. Completed and archived artifacts remain historical evidence.

### Keep rollout separately authorized

The frontend and Worker deploy independently. The exact Worker normalization makes either deployment order safe for the prior vinyl value while generated contracts and new clients move to `Vinyl Pressing`. This change prepares and verifies one final tree but does not deploy either surface.

## Risks / Trade-offs

- [Frontend and Worker deploy different enum revisions] → Normalize the exact prior value at the Worker boundary and keep every downstream value canonical.
- [Generated files retain the old value] → Regenerate through `pnpm generate:api` and audit current non-archived source/artifacts.
- [Preselection stops working] → Keep title-based `data-services-inquiry-target-service` projection and cover card-to-form selection while preserving the unrelated section id.
- [Wrong terminology survives as metadata] → Rename the provider tag and allow `vinyl-printing` only for the content section id, exact legacy input branch, and completed/archived historical artifacts.
- [Completed change claims unimplemented behavior] → Keep its delta implementation-accurate and require archive-first ordering before this rename is applied.

## Migration Plan

1. Archive `add-services-inquiry-email-delivery` without rewriting its completed artifacts.
2. Update current Services content, the Sveltia id hint, frontend helpers, Worker canonical enums/maps/provider tag, and current language while preserving only the stable section id.
3. Add the exact legacy request normalization at the Worker boundary and keep downstream values canonical.
4. Regenerate OpenAPI and API client artifacts.
5. Run focused frontend, backend, OpenAPI, and generated-client tests, then `pnpm test:unit`, `pnpm check`, and `pnpm build`.
6. Verify new and stale-client submission, card preselection, generated request enum, email content, recipient routing, provider tag, and current-language audit without deploying either surface from this planning change.
