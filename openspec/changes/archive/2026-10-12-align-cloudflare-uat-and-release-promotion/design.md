## Context

See `proposal.md` for scope. Today `.github/workflows/pages.yml` builds target-specific static artifacts, prepares the generated catalog, deploys the UAT Worker, and supports multiple static targets. UAT lives at the GitHub Pages repository base path; PRD lives at `blackbox-records-web.pages.dev/`. The completed `replace-catalog-promotion` change already removed bot artifact commits and adopted persisted Stripe Product bindings/default Prices, but its deltas have not yet been synchronized into all baseline specs.

This change intentionally keeps the existing catalog preparation until the following EmDash change replaces it. It does not recreate a second catalog pipeline.

## Goals / Non-Goals

**Goals:** One static-host model, one stable UAT review URL, explicit revision-bound PRD promotion, and recoverable deployment sequencing using existing CI.

**Non-Goals:** New product environments, branch/worktree creation, automatic PRD launch, dynamic public SSR, data promotion from UAT, per-PR Worker/database provisioning, or a release-management service.

## Decisions

### 1. Separate Pages projects, identical topology

Use `blackbox-records-web-uat` as the intended new UAT project name, subject to account availability verification. Store the actual returned Pages URL in the UAT profile; never assume the proposed project has already been created. Preserve the existing PRD project and hostname.

Both hosted public targets use base `/`, static `apps/web/dist`, explicit `_headers`, and their respective Worker. Keep Local at `http://127.0.0.1:4321/blackbox-records/` to preserve the launcher and base-path coverage. Reuse existing URL helpers; do not rewrite routing/player code to remove base support.

UAT and PRD remain separate credential/data scopes. Update checkout return origins, CORS, image origins, sitemap/robots, CMS URL configuration, smoke defaults, and environment-model assertions together. The old GitHub Pages deployment is retired only after the new UAT surface passes acceptance. Retain its last artifact as historical recovery evidence, not as another supported UAT host.

Alternative rejected: a branch preview in the PRD Pages project. A dedicated UAT project makes its stable identity and configuration harder to confuse with live or the existing holding branch. [Cloudflare Pages deployment controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/) remain the native mechanism; no custom preview platform is needed.

### 2. Main is the candidate stream, not automatic PRD deployment

Keep `.github/workflows/pages.yml` as the canonical software release workflow. Relevant pushes to `main` verify, build, deploy UAT, and run the existing static/provider checks. Preserve audited documentation-only trigger exclusions and manual dispatch.

Manual PRD promotion takes the full source SHA and successful candidate run ID, plus a false-by-default explicit code-promotion confirmation. Validate that the source is an eligible `main` revision, the run belongs to this repository/workflow, the artifacts match, and the accepted candidate is still the one served by UAT. The workflow actor and inputs record review acceptance; do not add a paid approval product or a second custom review database.

A UI correction is another small commit to `main`, followed by review at the same UAT URL. Nothing reaches PRD merely because that commit was pushed. The first version supports one candidate under review at a time. Add independent preview environments only if simultaneous review actually becomes necessary.

### 3. Promote paired artifacts, not a newly checked-out HEAD

Build UAT and PRD browser artifacts and the backend bundle from the same source SHA, with target configuration kept explicit. UAT/PRD public artifacts differ by origin, Review Site Marker, and public configuration; they are not byte-identical. PRD promotion consumes the corresponding verified PRD artifact, not the UAT artifact or a fresh build of latest `main`.

Extend existing release evidence with source SHA, target, artifact IDs/digests, non-secret configuration fingerprint, backend revision, migration compatibility, checks, and deployment IDs. Store it in GitHub Actions artifacts and native deployment metadata. Use bounded retention with a documented review window; an expired candidate requires rebuilding and revalidating the same SHA as a new candidate. Do not silently fall back to other artifacts.

The canonical `pages.yml` UAT smoke job owns provider acceptance after UAT deployment. Preserve the completed catalog replacement's in-workflow ownership; do not restore a downstream `workflow_run` or count manual diagnostic smoke as candidate acceptance.

The following EmDash change adds the content snapshot revision to this same evidence and precondition check. Do not implement that data model prematurely here.

### 4. Serialize mutations and preserve honest recovery

Use non-cancelling target concurrency for mutation. Read-only builds can cancel stale work. Recheck target/candidate identity immediately before state-changing stages; GitHub concurrency is not a promise of FIFO ordering.

Provider preparation remains explicit and separate from code promotion. Within a software deployment, apply only reviewed backward-compatible schema changes, deploy the compatible backend, verify it, then deploy the target static artifact and run hosted checks. A code-only promotion must not run live catalog apply without its separate one-run confirmation. No routine reset, stock reseed, or forced provider recreation is introduced.

If backend succeeds and Pages fails, record that mixed revision state. Retry the selected artifact or restore a known-compatible backend version. Database rollback is not automatic. Additive migrations remain in place; rollback of application code must prove it can read the new schema. Pause affected checkout before an unsafe recovery and preserve existing orders/reservations.

### 5. Preserve the launch and holding boundaries

The PRD Holding Page stays in its existing branch deployment and is not changed by a main push. A successful candidate promotion can update the disabled full PRD readiness site without switching the apex, approving live catalog mutation, or enabling checkout.

`PRD_LAUNCH_APPROVED=true`, `native_checkout_enabled`, live catalog confirmation, and code promotion remain separate decisions. Production-go-live work still owns apex activation and live acceptance. Do not broaden one approval to cover another.

## Risks / Trade-offs

- **Provider-specific UAT behavior changes** → Probe redirects, base paths, static cache headers, checkout returns, and Review Site Marker on the actual new origin before retiring GitHub Pages.
- **Candidate overwritten while under review** → One current candidate, revision-bound evidence, and stale-precondition rejection; no silent promotion of a newer revision.
- **Artifact retention expires** → Revalidate the same SHA; do not invent a permanent artifact registry.
- **Partial multi-provider deployment** → Explicit stage evidence and compatible code rollback; no claim of atomic Pages/Worker/Stripe deployment.
- **Existing plans still name GitHub Pages** → Update the affected active go-live/validation plans through the update-change workflow during implementation, without closing their unrelated tasks.

## Migration Plan

1. Synchronize the completed catalog-replacement deltas after verifying their implementation. Confirm this change still matches the effective baseline; retain unrelated in-progress work.
2. Add target profile and workflow contract tests locally, then provision/verify the UAT Pages project through authorized account operations.
3. Build and deploy a candidate to new UAT with test Stripe, UAT D1, and the existing email sink. Verify static and provider behavior against its exact SHA.
4. Switch the canonical UAT URL and remove the old GitHub Pages deployment jobs/triggers. Check all active references rather than globally editing historical evidence.
5. Exercise explicit disabled-PRD promotion and a failed/stale promotion. Any actual PRD deployment remains a separately authorized action, not an implication of implementing the workflow.
6. Record the last good UAT/PRD artifacts and rollback instructions. Run the final repository gates, validate deltas, and hand off to the EmDash change.
