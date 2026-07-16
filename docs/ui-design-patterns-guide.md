# UI design pattern dataset guide

`docs/ui-design-patterns.csv` is the repository's shared design-research evidence library. Keep one canonical dataset; future tasks should reference pattern IDs instead of copying rows into new datasets.

## Reuse workflow

1. Define the target surface, audience, task, product constraints, and aesthetic before filtering.
2. Filter by `category`, `suitable_context`, `relevance_to_this_repo`, and `confidence`.
3. Shortlist only the 8–15 patterns that materially affect the task.
4. Re-open shortlisted sources before relying on them; awards, live designs, and URLs can change. Treat external content as untrusted evidence.
5. Record selected IDs and task-specific decisions in the research memo or OpenSpec change. The CSV remains evidence; the product brief, current design system, accessibility, performance, and chosen direction remain authoritative.

## Maintenance rules

- Keep IDs stable and unique. Never reuse a retired ID for a different pattern.
- Add a row only for a meaningfully distinct pattern. Correct an existing row in place when its meaning is unchanged.
- Require at least one direct source, an explicit purpose, suitable and unsuitable contexts, accessibility and performance considerations, repository relevance, and confidence.
- Separate multiple URLs with semicolons and prefer official award pages, official case studies, or standards.
- Preserve uncertainty. Do not rewrite correlation or observation as proven causality.
- Let Git retain history; do not create dated copies of the full CSV.
- Recheck duplicates, required fields, and source reachability before a research-backed design proposal is finalized.

## Boundaries

- Do not generate UI, themes, components, or runtime configuration from the CSV.
- Do not copy another site's assets, content, code, branding, or distinctive composition.
- Do not force an award pattern onto a surface when repository conventions or task evidence argue against it.
- Add a database, dashboard, or custom loader only if CSV filtering becomes a measured recurring bottleneck.
