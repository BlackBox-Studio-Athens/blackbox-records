# Tasks

## 1. Dependencies and compatibility

- [x] 1.1 Pin the three direct EmDash packages and exact age exceptions to 1.0.1; verify installed versions and frozen lockfile installation.
- [x] 1.2 Rebase both revision-safety fixes across source, dist and declarations; verify compiled REST race and malformed revision checks.
- [x] 1.3 Disable background update checks without changing Access, sessions or public imports; verify canonical builds and no-session-cookie checks.

## 2. Migration and editorial acceptance

- [x] 2.1 Extend the existing copied-state upgrade smoke for migrations 088/089, scheduling instants, seed completion and retained state; verify migration and two starts.
- [x] 2.2 Verify fresh initialization, unsafe URL rejection, native Artist references, rich text, media, exact-revision publication and preview using existing suites and focused added cases.
- [x] 2.3 Update migration guidance and changelog applicability evidence; validate the OpenSpec change strictly.
- [x] 2.4 Verify unchanged-tree local validation. The later successful backup-chat run exactly matches the upgrade implementation fingerprint; reuse that evidence and run only the documentation checkpoint for rollout-note changes. See validation.md.

## 3. Hosted rollout

- [ ] 3.1 Record UAT version/history, reviewed Free-tier budget, verified CMS backups and accepted pointer; run existing release and bounded hosted acceptance. Confirmed migrations 088/089 do not require an editorial pause.
- [ ] 3.2 After explicit PRD promotion approval, verify PRD backups/history and promote the accepted immutable candidate; record hosted checks without changing catalog or launch gates.
