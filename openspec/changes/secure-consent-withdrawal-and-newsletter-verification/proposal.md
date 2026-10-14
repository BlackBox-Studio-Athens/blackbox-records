# Proposal

## Why

An unverified newsletter submission currently clears the Contact's unsubscribe flag. Availability-alert consent can currently be withdrawn only by contacting support, with no self-service cancellation of pending work.

## What Changes

- Require mailbox confirmation before newsletter Contact or Topic writes, including checkout opt-ins; preserve existing global unsubscribe preferences and provider suppressions.
- Deliver a secure link for withdrawing all pending availability alerts for the address, and provide a recovery-link API for existing requests.
- Use expiring, single-use capabilities, bounded confirmation sends, durable retries and provider-safe responses.
- Hand all website UI and rendered-copy work to Claude Desktop under the owner's preview gate. No website UI source changes in this implementation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `newsletter-registration`: Mailbox ownership before activation, explicit pending confirmation and safe retries.
- `store-availability-alerts`: Mailbox-authorized self-service withdrawal and cancellation of queued or leased work.
- `module-boundaries`: Email consent persistence uses the existing persistence and email application seams.

## Impact

Backend email application, Resend adapter, D1 persistence and migration, public API contracts/client generation, focused security regressions. Claude's separate website integration and reviewed CMS privacy amendment remain required. No provider mutations, real emails, publishing, push, deployment, fiscal or launch configuration changes.
