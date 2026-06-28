# AGENTS.md - artwork-fetcher

This tool is separate from the BlackBox Records site/app.

## Scope

Work only under `tools/artwork-fetcher` unless the user asks otherwise.

## Verification

Use local Python checks only:

```powershell
cd tools/artwork-fetcher
python -m unittest discover tests
```

Do not run root `pnpm test:unit`, `pnpm check`, or `pnpm build` for artwork-fetcher-only changes.

## Network Policy

Prefer API-backed sources. Do not add browser automation, auth bypasses, Google Images scraping, or broad crawlers.

Respect provider rate limits, cache responses, use a contactable User-Agent, and stop/retry on `429` or `503`.
