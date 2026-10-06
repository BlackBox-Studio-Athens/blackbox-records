## REMOVED Requirements

### Requirement: Static deploy automation exposes measurable stages

**Reason**: Stage timing comes from the GitHub Actions API (`gh run view --json jobs`), so the workflow keeps no timer steps and the spec no longer prescribes separately timed jobs. The requirement also named the unused-code audit as a deploy stage, which now runs as its own weekly workflow.

**Migration**: Record timings with `gh run view --json jobs`; see `docs/validation-feedback.md`.

### Requirement: Static deploy workflows preserve gate-before-deploy correctness

**Reason**: The requirement gates deployment on `pnpm test:unit`, `pnpm check` and `pnpm audit:unused`. The unused-code audit is no longer a deployment gate, and the gate list is owned by the software-release-promotion and tooling-validation requirements (checks, both target builds, the whole end-to-end suite and the staff previews before UAT deployment).

**Migration**: See "Main publishes a UAT candidate only" in software-release-promotion and "Standard repository gates" in tooling-validation.
