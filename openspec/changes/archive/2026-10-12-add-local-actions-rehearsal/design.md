# Design

## Context

The initial implementation added a guarded local runner. During acceptance, the maintainer clarified that the desired outcome is future access to stock act with no code changes if possible. The custom implementation and workflow changes are therefore withdrawn.

## Goals / Non-Goals

**Goals:** Make the official executable available, verify Docker, and leave usable manual examples and observed limitations.

**Non-Goals:** Custom wrappers, artifact protocol bridges, package aliases, policy changes, workflow changes, automatic runs or complete local parity with GitHub.

## Decisions

- Keep the official WinGet act v0.2.89 installation and cached `ghcr.io/catthehacker/ubuntu:act-24.04` image. The existing Linux Docker engine reports 29.8.2.
- Use stock act against `.github/workflows/pages.yml`, with an explicit Docker endpoint, image mapping, selected job and matrix leg, copied source and Git ignore rules.
- Keep normal `pnpm test` and `pnpm validate` behavior. Manual release-tier work still follows the existing maintainer grant and machine resource rules; stock act provides no custom enforcement.
- Document the observed upload-artifact v7 incompatibility. Preserve the pinned hosted action and official act binary, with no compatibility patch.
- Stop the remaining container acceptance runs. Remove only this change's implementation edits, preserving unrelated shared-checkout work and ignored diagnostic logs.

## Risks / Trade-offs

Manual rehearsals require supervision and can differ from hosted runners. Browser dependencies and pinned artifact uploads are not fully supported by the tested baseline. This is an optional diagnostic tool, and GitHub remains authoritative for release acceptance.
