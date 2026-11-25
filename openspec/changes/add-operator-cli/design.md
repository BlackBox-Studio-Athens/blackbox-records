# Design

## Context

Hosted Staff builds clear `PUBLIC_BACKEND_BASE_URL`. Both internal commerce and EmDash requests use the selected Staff origin. The Worker remains responsible for verifying the Access JWT and authorizing mutations.

## Goals

Run an operator's existing Staff operations from one local command. Preserve the HTTP contracts, including stock revisions, catalog operation identities and publication gates.

## Decisions

- Pin UAT and PRD to their HTTPS Staff origins. Acquire a human Access token from cloudflared for each request. Capture subprocess output and reject redirects before reading any response body. For `whoami`, ask the Worker to authorize a one-variant read and then display the verified JWT email. This avoids EmDash user provisioning during identity checks.
- Validate arguments before remote work. Print the write plan before asking for the environment name. A dry run makes no remote requests. Use the same-origin and request marker headers for each API.
- Create Distro artwork through EmDash's multipart media route with the original and a bounded PNG thumbnail. Use the media identity for create-mode setup. Read the saved Distro title and format for existing-mode setup.
- After completed setup, use the variant publication detail and POST its reviewed catalog and CMS revisions. For stock, read the current revision and subtract copies owed from the requested physical count to get the online quantity.
- Retry a transient, replayable request once with the same body and identity. Deduplicate uploads using the existing media option. Report the relevant operation ID and status without printing raw service responses or stock idempotency keys.

## Risks and Trade-offs

- A timeout can leave an operation in progress. Report an unconfirmed outcome and preserve the operation ID for reconciliation before a new invocation. Publication has its own journal identity.
- Required editorial details can block publication after setup completes. Report setup and publication separately so the operator can review the saved item.
- The authorized coordinator will verify the first hosted run. Local checks mock both cloudflared and HTTP.
