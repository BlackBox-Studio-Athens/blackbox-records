# Design

## Context

See proposal.md for scope. At the start, three direct packages were pinned to 1.2.0. Staff embeds PortableTextEditor, not ContentEditor. Both package patches still cover behavior absent upstream. The 1.3.1 package and original build have the same 90 core migration names through 091, but package-version fingerprints differ.

## Goals / Non-Goals

Preserve existing editorial/publication behavior and adopt fixes through the existing APIs and editor. Do not add saved-version recovery, new blocks, public crawler policy, sessions, KV, coalescing or a new authentication flow.

## Decisions

- Rebase versioned patches against published packages, including shipped JavaScript and declarations. Keep atomic deletion preconditions and the missing-row save conflict. Preserve scoped uploads, image controls and blocked commands; do not replace these with native ContentEditor.
- Keep the existing Staff portal above the native image toolbar (which uses layer 100). The former portal layer 60 intercepted mobile image-replacement confirmation; layer 110 preserves the same dialog flow. Check replacement at phone width and on emulated touch input.
- Relay preview RPC bodies through a stream that copies each chunk. Local's assets router corrupted reused binary buffers from RPC responses; a minimal Worker with no EmDash dependency reproduces the failure. Preserve bounded streaming, response headers and the existing authentication/configuration boundary. Verify exact font bytes and the real preview readiness gate rather than substituting font responses. Remove the browser fixture's obsolete Google-font interception now that fonts are self-hosted, preserving the browser's normal cache during repeated iframe replacement.
- Add only optional string `caption` to strict native revision image enrichment. Missing and empty captions remain distinct; legacy metadata remains accepted. Editorial image writes still accept only their established shape, and unrelated enrichment keys remain invalid.
- The rehearsal's explicit 1.2.0 label describes a provenance-recorded stopped source copy. Migration 091 proves schema history, not the exact application version; preserve current/legacy/1.1.0 meanings. Rehearse two starts using disposable D1/R2 and preserve the original store.
- Keep application-before-core migration ordering, hosted check/Local auto, exact target fingerprints and fresh build manifests. Document manual lock takeover without changing automated migration behavior.

## Risks / Trade-offs

- Patch chunks and native editor internals changed → regenerate against 1.3.1 and require compiled race and browser checks.
- New caption enrichment can block publication → add focused strict-validation regression cases and verify publication/preview.
- Larger shared editor can affect bundle budgets → keep existing build gates and limits.

## Migration Plan

Complete Local acceptance first. A fully migrated 1.2.0 source requires no new core SQL; older target histories still follow the existing runbook. Future UAT/PRD operations require separate authorization, verified database/media backup, Free-tier preflight and the candidate artifact's target-specific report. Recover migrated data from verified backup or forward recovery, never by downgrading code against migrated data.
