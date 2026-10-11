# Tasks

- [x] Reproduce the failure, isolate the Windows path limit with a minimal probe and record the evidence.
- [x] Shorten the Local Worker names and share the public Worker name between the CMS binding and the public runtime.
- [x] Refuse Windows Local Worker starts whose Durable Object storage path would reach 256 characters.
- [x] Add tests; update README and the local-runtime reference.
- [x] Add the tooling-validation delta; strict OpenSpec validation passes.
- [x] Verify at the failing path length in the browser, run `pnpm validate` and record evidence.
