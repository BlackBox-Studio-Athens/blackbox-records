## Context

The approved implementation plan combines EmDash 1.1.0 with staff improvements. Preserve Access, D1/R2, session:false, accepted snapshot authority, revision-fenced writes and private drafts. Work on main and preserve unrelated changes.

## Decisions

- Upgrade exact core/admin/cloudflare pins together and rebase source, compiled and declaration patches. Bridge native editor uploads through the existing validated thumbnail uploader.
- Stock finder occupies the workspace until selection, then closes; Find another item reopens it without discarding work. Preserve the embedded Selling workflow.
- Preview visibility retains the existing preference. Close removes pane/handle and pauses requests without remounting the editor.
- Batch uploads retain order, continue after failures and retry failed files only. Cover selection remains singular.
- Full text accepts canonical richer image attributes and approved video iframe URLs. Short descriptions remain text-only. All public readers support new blocks before authoring is enabled.
- Keep Images on Free, with no paid overage or alternate image service. Retain browser original fallback and route social JPEGs through the existing server fallback, preserving canonical transformation identity and its five-minute recovery cache. R2 is separately metered; budget alerts do not enforce an account-wide zero-spend cap. JavaScript-disabled body images still use direct delivery; social-image fallback is server-side.
- Publication history reuses review formatting. Reuse completed_at, add a retained actual before_snapshot_sha256 and index for month queries. Comparisons lazily read immutable before/after snapshots; unavailable legacy evidence is labeled.
- Calendar reads only successful journal events, includes repeated updates and withdrawals, uses Europe/Athens and requested-time fallback labels, and preserves month/filter/view in URLs. Authenticated calendar/detail routes are environment-scoped and private/no-store.
- Firefox backdrop dismissal releases its locks but cannot resume wheel scrolling after body overflow:clip; use overflow:hidden for the shared modal lock, with repeated Firefox/Chromium regression coverage.
- Unversioned Local renderer builds use a shared zero source SHA. Bypass persisted HTML for that identity so rebuilds cannot serve obsolete asset hashes; versioned releases retain their cache.

## Design Library references

Use the shared [component catalog](C:/Users/SVall/.codex/design-library/categories/components.md#shadcn) for existing InputGroup, Collapsible, Accordion and table compositions, and [SPACE-01](C:/Users/SVall/.codex/design-library/patterns/space.md#space-01) for compact labels with comfortable targets. Stock keeps facts and operations ahead of secondary history; the finder opens on demand. Native month inputs, existing sheets and existing staff primitives implement the calendar without another dependency or theme.

## Validation and rollout

Run focused checks and pnpm validate under feedback policy. Verify upgrade on disposable stopped Local copies, then Local browser acceptance. UAT needs verified backup and Free allowance evidence; PRD retains separate approval. Never downgrade migrated schemas.
