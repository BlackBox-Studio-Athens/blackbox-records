# Validation

## Outcome and environment

Completed the explicitly authorized PRD purge on 2026-10-02 (Europe/Bucharest). The exact seven slugs in proposal.md no longer have CMS, commerce or stock records. Native EmDash handlers removed the three remaining drafts, their 17 revisions and metadata; the four previously purged entries remained absent. Removed 10 exclusively owned media records and their 34 original, thumbnail and published/approved R2 objects. No shared media was found; the local rehearsal verifies shared images are preserved.

The Three Way Plane CD and all unrelated CMS and commerce rows, including orders, compare unchanged against the scoped preflight backup. Webhook deduplication receipts remain retained. Stripe mutation calls: zero. No software deployment or content publication was performed. Backups and historical publication manifests remain retained for recovery.

## Hosted evidence

Ignored artifacts are in `.codex-artifacts/purge-seven-retired-prd-items/` in the canonical checkout. Keep this directory, including the temporary operator and byte backups, for recovery:

- `plan.json` and `bytes/`: scoped records, revisions, media keys and checksum-verified image backups. Plan SHA-256: `3f77552d02bbbb0e0c945748d599c0db31163690828efabf7984207d973c841e`.
- `checkpoint.json`, `apply-result.json`, `verify-result.json`: completed checkpoints and independent read-only postcondition verification. Both unrelated-state comparisons passed.
- `quota.json` and per-attempt usage records: account-wide Free-tier preflight and measured hosted operations.
- `public-result.json`: 18 HTTP GET checks. All seven product routes and seven checkout routes return 404. Store and distro listing/search data contain none of the selected slugs; both listings return 200. The retained CD returns 200 and contains the expected title.

The accepted publication remains `70992021-a100-4ad3-9166-535f7fa53fd8`, generation 189, snapshot SHA-256 `98356bb9ae64c3e14a8ac3243be266df6cfa4e4bd059c579fbe73a216446796d`. Public content-version reports that same snapshot and deployed code SHA `6736181737bccca2da1791977bf08667590595e6`.

The first apply stopped at its 50,000-row read ceiling after CMS, commerce and original media deletion, before derived-object deletion. It recorded 50,074 D1 rows read, 166 written, 141 R2 reads and 10 deletions. Refreshed account analytics confirmed sufficient reserve; recovery removed redundant per-image commerce scans and resumed checkpoints with a separate 20,000-read ceiling. Recovery used 10,952 D1 reads, zero writes, 76 R2 reads and 24 deletions. Final independent verification used 2,738 D1 reads, zero writes, 36 R2 reads and zero deletions. The read-only planning pass used 3,379 D1 reads and 42 R2 reads. Total measured operation usage: 67,143 D1 reads, 166 writes, 295 R2 reads and 34 deletions. No quota or provider failures remain unresolved.

Node fetch could not connect to the public host on this machine; the same GET checks passed using native curl. This was a verification transport failure, not a PRD application failure.

## Local and repository checks

- `node --import tsx --test .codex-artifacts/purge-seven-retired-prd-items/operator.test.mjs`: two checks passed. Exercise installed native content/media purge, repeat deletion, interrupted checkpoint recovery, retained CD/shared media, and the actual commerce SQL batch. The order guard aborts atomically; unrelated records and webhook deduplication receipts survive.
- `pnpm openspec -- validate purge-seven-retired-prd-items --type change --strict`: passed.
- `pnpm validate`: passed in local mode, including affected tests, lint, type checks and architecture checks (63 cache-valid tasks). Initial summary: `.codex-artifacts/validation/2026-10-01T22-25-30-133Z-38676/summary.json`; source SHA `9d1f3bc4e18e01e4609f54c1b6ff232594b8e766`, matching before/after fingerprint `4d84e002f44cfed449f82c383b7bfd99d3e89a343465c84f44bdb290df296900`. After this note and task updates, rerun validation; `final-validation.json` in the operator artifact directory records the final summary path, status, mode and matching source fingerprints.
- Graphify refreshed once after the meaningful operator edit batch. No enrichment or paid API was used. Concurrent artist-ordering and CD-mockup changes were preserved; the only tracked changes belonging to this task are this OpenSpec directory.

Acceptance rows: CMS/content, commerce/stock and hosted catalog cleanup. Staff absence is established from zero native content/media records and commerce identities; public absence is established from the accepted snapshot and GET responses. Interactive staff/browser flows were not exercised. Shell/player, checkout payment/provider smoke and software release checks are not applicable because their code and behavior were unchanged. Local repository validation does not establish those unrun checks. No required purge postcondition remains unresolved.
