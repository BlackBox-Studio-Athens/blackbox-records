---
phase: 5
slug: cloudflare-runtime-and-secret-plumbing
status: ready
nyquist_compliant: true
---

# Phase 5 Validation

| Check ID | Plan | Requirement | Validation |
|----------|------|-------------|------------|
| V-05-01 | 05-01 | DEPL-01 | Worker adapter and build scripts exist without deleting the legacy Pages path |
| V-05-02 | 05-02 | DEPL-01 | Brochure routes remain prerender-by-default and commerce can opt into on-demand rendering |
| V-05-03 | 05-03 | DEPL-02 | Wrangler defines environment shape and Worker bindings without leaking secrets to the browser |
| V-05-04 | 05-04 | DEPL-02 | Local Worker development is executable and documented |
| V-05-05 | 05-05 | DEPL-03 | Sandbox deploy workflow is isolated from Pages production and points at one stable hostname |
| V-05-06 | 05-06 | SECU-01 | Runtime secrets stay server-only across local dev, CI, and deployed sandbox |

## Exit gate

Phase 5 is complete only when the repo can run in a Worker-first local/sandbox mode without altering the current Pages production flow and without relying on browser-visible secrets.
