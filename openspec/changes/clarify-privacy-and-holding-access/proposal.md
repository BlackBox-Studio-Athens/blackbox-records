## Why

The 14 October audit found apex policy URLs returning 404 during Holding. The actual published privacy notice (updated 13 October) already identifies the controller and Resend US/SCC processing, but its retention criteria and analytics basis need a more actionable, evidence-backed editorial review.

## What Changes

- Add four exact temporary Holding redirects for `/privacy`, `/privacy/`, `/terms`, and `/terms/` to the existing PRD legal documents. Preserve the home, guessed shop routes, static artifact and launch controls.
- Prepare narrow CMS paragraph replacements covering purpose-specific retention criteria, technical analytics and provider transfer roles. Preserve real controller and seller facts; distinguish implemented cleanup from operator policy.
- Hand every rendered copy/link change to Claude Desktop. No Codex UI edits; Claude previews new Holding links before the owner's non-text UI approval.
- Record owner/accountant inputs as privacy-publication acceptance gaps, without imposing new tax, checkout or launch gates.

## Capabilities

### Modified Capabilities

- `prd-holding-page`: explicit policy-route exceptions without exposing shop routes on the apex.
- `shopper-purchase-information`: category-specific retention and evidenced purposes, roles and safeguards.

## Impact

Holding artifact preparation/checking, a scoped contract regression and its two exact `project.json` cache inputs; existing `purchase_information` CMS singleton and legal pages through Claude's handover. No API, database, cron, provider account, dependency or release change. Findings 3/4 remain with the consent sibling; seller telephone/registration, tax and future company transition remain outside this change.
