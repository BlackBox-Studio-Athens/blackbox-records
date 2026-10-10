# Proposal

## Why

Assess exploitable shopper-facing and commerce risks before considering production security verification. The owner approved a one-hour, local-only Strix assessment using the existing ChatGPT subscription and GPT-6.1 Sol at high reasoning.

## What Changes

- Prepare a disposable source-bound Local mock stack and enforce local assessment traffic.
- Run a supervised Strix priority assessment, validate findings, and retain evidence and explicit coverage gaps.
- Deliver a prioritized report and reproducible operating commands without changing application code.

## Capabilities

### New Capabilities

None. This is an assessment and evidence change; `skip_specs: true` applies.

### Modified Capabilities

None. Findings do not silently change intended behavior or authorize fixes.

## Impact

The assessment covers public pages, public APIs, checkout, order and stock authority, webhook integrity, public inputs and anonymous rejection at protected commerce boundaries. Staff/CMS testing, hosted traffic, real payments, real email delivery, deployment and source fixes are excluded. Runtime files live in a disposable directory outside the repository; retained artifacts live under `.codex-artifacts/security/`.
