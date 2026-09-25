# Proposal

## Why

The September 24 remeasurement shows that the deployed staff workspace is usually usable in under a second, but authenticated stylesheet revalidation contributes to some visits above two seconds. In the original twelve foreground samples, median usable-content times were 827 ms for Overview, 642 ms for Website, 938 ms for Stock, and 878 ms for Distro. A Website visit took 2,266 ms while a cached stylesheet waited roughly 1.64 seconds for a 304 response.

Shared navigation also imports format constants through `@blackbox/content-model`, causing unrelated content schemas and Zod initialization to enter Overview and Orders startup. An isolated native Astro build confirms that package side-effect metadata removes about 25 KB of compressed JavaScript from those routes. These findings replace the remaining startup hypothesis in `reduce-staff-navigation-wait` task 5.5; they do not retroactively establish that its hosted acceptance passed. See [measurements.md](measurements.md).

A second pass validates the direction: 48 controlled foreground loads show median gains of 61–217 ms in the ordinary scenario and about one second with an injected one-second stylesheet delay. Eight new PRD visits also expose a 4,491 ms first Overview visit, including 1,516 ms to the first HTML byte and a 1,042 ms workspace request. These frontend changes do not remove those waits. Treat this as a measured startup improvement, not a complete remedy for every slow first visit; see [the revalidation and estimates](design.md#revalidation-and-improvement-estimate).

## What Changes

- Mark the audited, import-side-effect-free content-model package with `sideEffects: false`, retaining its existing public exports and all validation behavior.
- Use Astro's native `build.inlineStylesheets: 'always'` for the staff app so initial project CSS arrives inside authenticated HTML. Preserve lazy editor and picker styles.
- Extend the existing bundle checker with a staff profile and run it from `build:staff`. Check initial JavaScript size, compressed HTML size, and absence of external initial project stylesheets.
- Reuse existing staff functional checks, then collect a bounded, foreground-controlled hosted comparison through the normal release process. Report first visits separately from repeats, persist each navigation's timing evidence promptly, and distinguish rendering, artwork completion, and provider request timing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `staff-workspace`: Constants-only startup must exclude unrelated content-schema initialization; initial project styles must not require another authenticated request; performance acceptance must control foreground/frame scheduling and retain slow or incomplete samples.

## Impact

Implementation touches two existing configuration files, the existing bundle checker, and its root build command. Content-model metadata affects all package consumers, so full repository and editor validation remains required. There are no new dependencies, exports, bindings, migrations, background jobs, or changes to authorization, private caching, data placement, navigation, or Cloudflare Free.

The local experiment increases compressed staff HTML by about 12–13 KB to remove one or two critical stylesheet requests. For warmed visits with roughly 100 ms private-asset responses and at least 10 Mbps throughput, the planning estimate is approximately 50–200 ms saved; CSS-caused stalls can yield much larger gains. Website JavaScript does not materially shrink, and an optimized hosted candidate has not been measured. Implementation, deployment, and hosted acceptance remain unchecked work in this change.
