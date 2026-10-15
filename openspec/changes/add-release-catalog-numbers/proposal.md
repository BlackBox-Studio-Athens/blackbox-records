# Proposal

## Why

BlackBox Releases need a valid, unique catalog identity independent of dates and artist names. Store All must put the label's releases first in numeric catalog order.

## What Changes

- The owner supplied the complete table directly on 2026-10-15: caregivers (Chronoboros)=BBR#001, disintegration (Afterwise)=BBR#002, anarchotribal (Ouranopithecus)=BBR#003, lotus (Sidus)=BBR#004. Numbers do not follow release date: Anarchotribal is out 6 June and Disintegration 9 June.
- Require canonical positive catalog numbers on published Releases; allow incomplete private drafts.
- Order Store All by catalog number for BlackBox Releases, followed by the existing Distro artist order. Render no new public field.
- **BREAKING**: New publication candidates require catalog_number. Accepted legacy snapshots use only the four owner-confirmed slug assignments (caregivers=BBR#001, disintegration=BBR#002, anarchotribal=BBR#003, lotus=BBR#004); unknown legacy releases fail clearly. The planned release targets UAT only; PRD promotion remains separate.
- Prepare the CMS field and supply an explicit backfill step without running it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: canonical unique catalog number on every Release.
- `store-catalog-categories`: Store All catalog ordering.
- `emdash-editorial-operations`: incomplete drafts, publication validation and explicit migration.
- `content-publication`: compatibility for accepted snapshots and strict candidates.

## Impact

Shared content-model, CMS schema/publication review/accepted snapshot reader, local release content, Store model and All route, unit/integration fixtures. Staff input and e2e edits belong to the coordinator. No hosted reads, migration execution, commits, pushes or deployment in this task.
