# Design

## Context

See `proposal.md`. The Node backup uses Wrangler R2 bindings and keeps completed media in memory. Immutable SHA-256 blob keys already make repeated blob writes safe. Its D1 snapshot and restore importer have separate consistency and recovery contracts.

## Goals / Non-Goals

**Goals:** Recover isolated R2 failures without restarting capture, bound additional storage work, and keep existing integrity checks observable in fault tests.

**Non-Goals:** Persistent checkpoints, incremental source downloads, proxy replacement, D1 replay, restore retries, workflow timeout changes or hosted execution.

## Decisions

- Use one private retry function per backup invocation. Allow three attempts per R2 action and twenty additional attempts across the invocation. Wait one second before the second attempt and two before the third. The existing thirty-minute workflow timeout remains the outer execution limit; retry sleeps add at most forty seconds. A small injected wait function permits deterministic local tests without real delays.
- Recognize the observed `Network connection lost.` and R2 `Unspecified error (0)` messages plus explicit HTTP 408/500/502/503/504 status values. Authentication, quota, validation and unknown failures remain fatal. Broad retry-on-any-error would mask operational or integrity faults.
- Retry an R2 `get` and its body read as one action. Check its ETag against the same listed inventory on every attempt. Commit logical bytes and media records only after a complete read, preserving current changed-object and snapshot-reference rules.
- Retry R2 list pages, blob heads/writes, point writes, retained-point reads and retention deletes. Keep the list cursor until its page succeeds. Replay writes with identical bytes; retry a lost acknowledgement safely. Leave D1 export, restore and its empty-destination guards unchanged.
- Log safe operation names and attempt counts without keys, provider payloads or raw error text. Report capture progress every hundred completed objects and return the total retry count. Preserve the manifest version and restore compatibility.

## Risks / Trade-offs

- Replayed operations and body transfers consume allowance beyond a clean run. The shared twenty-retry ceiling bounds additional actions; budget them before hosted acceptance. Captured-byte and object guards remain logical capture limits, not network-transfer meters.
- A sustained outage or unusable proxy still fails within the attempt limits or existing workflow timeout. Do not rebuild infrastructure or reconnect indefinitely.
- A failure during retention can occur after a complete point was published, as before. Retention retries must preserve every blob referenced by kept points.

## Migration Plan

Run focused fault tests and final local validation. No data migration is needed. Any later hosted pilot requires fresh account-wide quota evidence and separate authorization. Existing manifests remain readable, and reverting this script restores prior behavior without modifying CMS state.
