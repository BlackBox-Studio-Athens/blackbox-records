# Proposal

## Why

Editors need a preview that looks and behaves like the public website. The current preview shares templates but removes their scripts and interactions, and its surrounding content can differ from the website's accepted snapshot.

## What Changes

- Render the full public page and safe interactions through the existing public renderer: header/footer, responsive layout, navigation, search, overlays, and player.
- Use the accepted website snapshot plus the selected unsaved record or exact saved review selection. Reuse native EmDash reads and the existing media/catalog preparation rules.
- Keep publication's current revision and baseline checks. Preview represents the inputs loaded for that rendering; it does not add a transaction lock over later media, catalog, or code changes.
- Replace inert `srcdoc` with a protected interactive document on a separate origin of the existing Worker. Block real checkout, form delivery, publication, staff operations, and BlackBox analytics.
- Retain the current preview controls, debounce, generation ordering, recovery, and diagnostics. Use only a small temporary context map for navigation.
- Verify every collection renders, compare representative pages in both browsers, and remove the old duplicate preview path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `emdash-editorial-operations`: full-page private preview, native editorial ownership, safe interactions, and proportionate acceptance.

## Impact

The change touches existing preview coordination, CMS selection/routing, the public renderer/service binding, and relevant public transport seams. It preserves the staff design, publication intent/journal, commerce authority, and public URLs. No dependency upgrade, upstream fork, new Worker/database/bucket/KV/session store, or paid service is planned.

This plan assumes the user's low-traffic use case with occasional staff editing. It does not add multi-editor coordination, durable preview recovery, custom publication fingerprints, capacity benchmarks, or an exhaustive screenshot matrix.

The new contract supersedes the inactive-preview rule in `improve-content-workspace-previews`; reconcile that unsynced delta and the workspace docs during implementation. Hosted preview origin setup and rollout follow existing Access, Free-tier, and release procedures. This remains planning-only work.
