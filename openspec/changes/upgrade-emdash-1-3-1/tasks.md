# Tasks

## 1. Dependencies and patches

- [x] 1.1 Preserve the unrelated baseline and stopped 1.2.0 source store with package/manifest provenance; verify original source hashes.
- [x] 1.2 Pin all three direct packages to 1.3.1, rebase source/dist/types patches and update workspace/lockfile; verify frozen installation and package alignment.
- [x] 1.3 Verify compiled competing-save, stale-delete and save/delete regression through test:emdash, and document retained patch ownership and adopted fixes.

## 2. Native images and migration rehearsal

- [x] 2.1 Accept optional native top-level caption without widening writes; test absent/populated/empty/legacy captions and rejected unknown fields in the content-schema suite.
- [x] 2.2 Add explicit 1.2.0 rehearsal provenance support while preserving older labels; verify fresh manifests and two starts retain revisions, dates, references, media, publication, stock and prices.
- [x] 2.3 Document the 1.3.1 migration identity and manual lock takeover, retaining target fingerprint, ordering and hosted release gates; verify documented commands and existing checks.

## 3. Local integration acceptance

- [x] 3.1 Pass cms-runtime, staff-content and content-schema focused checks; build the combined artifact with unchanged bundle budgets, no KV and no sessions.
- [x] 3.2 Pass Staff hosting, content publication and browser preview checks; verify scoped uploads, unchanged-open, supported paste, link behavior, keyboard/touch image behavior and navigation after editor loading.
- [x] 3.3 Update Graphify, pass strict OpenSpec and pnpm validate, verify protected baseline hashes and record source-bound evidence and remaining limits in validation.md.

## Workflow follow-up

- UAT and PRD migration/deployment/promotion require separate authorization and target-specific backup, Free-tier and migration checks.
