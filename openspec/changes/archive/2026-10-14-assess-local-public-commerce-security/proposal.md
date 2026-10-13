# Proposal

## Why

Find exploitable risks on the surface the PRD public site exposes before production commerce opens. The owner replaced the planned Strix/GPT assessment with free, open-source, non-LLM tools and asked for a fast, cheap pass.

## What Changes

- Scan secrets in Git history, dependencies, GitHub Actions and public source with free tools.
- Test the public and commerce APIs on the Local stack with schema-driven fuzzing and scripted abuse checks.
- Read security headers from PRD with a handful of read-only GETs.
- Record ranked, reproduced findings, coverage gaps and rerun commands. No source fixes.

## Capabilities

### New Capabilities

None. This is an assessment and evidence change; `skip_specs: true` applies.

### Modified Capabilities

None. Findings do not change intended behavior or authorize fixes.

## Impact

In scope: public pages, public/commerce APIs (checkout, listing and offer reads, delivery quote, newsletter, Notify me availability alerts, Services inquiry, withdrawal form), Stripe webhook integrity and anonymous rejection at `/api/internal/*`. Secrets in Git history stay in scope because the repository is public.

Out of scope: staff/CMS and dev-only tooling (unless they leak a secret), hosted crawling, fuzzing or scanning, real payments and real email delivery. Retained raw output lives under `.codex-artifacts/security/2026-10-12/`.
