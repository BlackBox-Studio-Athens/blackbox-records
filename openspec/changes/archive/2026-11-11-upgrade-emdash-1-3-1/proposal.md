# Proposal

## Why

EmDash 1.3.0 and 1.3.1 fix shared-editor, native API privacy, D1 schema and CLI Access behavior. Upgrade the existing 1.2.0 integration while preserving BlackBox's private drafts, custom Staff workspace and accepted-snapshot publication.

## What Changes

- Pin core, Cloudflare and admin together to 1.3.1 and rebase both maintained dependency patches.
- Accept native image values' optional top-level caption during revision validation without widening editorial writes.
- Extend the disposable upgrade rehearsal with an explicit 1.2.0 source label, retain older histories and generate fresh migration manifests.
- Verify Local editing, races, uploads, publication, preview, hosting and existing bundle/resource constraints.

## Capabilities

### New Capabilities

None. Saved-version recovery, inline visual editing, AI-training crawler policy and experimental D1 coalescing are excluded.

### Modified Capabilities

None. This dependency maintenance change preserves the existing editorial and publication requirements; `skip_specs: true` records that no baseline requirement changes.

## Impact

Backend and Staff dependency manifests, pnpm workspace/lockfile, two patches, content-model revision validation, upgrade acceptance and CMS operational guidance. Node/Astro/React/Wrangler need no upgrade. Implementation ends at Local acceptance; no commit, push, hosted migration, deployment or content publication is authorized by this change.
