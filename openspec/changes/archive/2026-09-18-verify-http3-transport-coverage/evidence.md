# HTTP/3 transport coverage evidence

Observed 2026-09-18 02:12 +03:00 (2026-09-17 23:12 UTC). This is a bounded
diagnostic record, not a load test.

## Result

No application, Wrangler, Pages, launcher, proxy, paid-plan, or 0-RTT change
was needed. The owned blackboxrecordsathens.com zone already has HTTP/3
enabled. Chrome negotiated HTTP/3 on the sampled Pages, public Worker, staff,
and CMS legs. Some first connections negotiated HTTP/2, so Alt-Svc remains
advertisement only and is not treated as proof.

The following remain deliberately unverified or unsupported: internal service
bindings and Durable Object/R2 bindings, outbound provider connections,
provider-selected webhook delivery, ordinary local loopback, and HTTP/3 from
Cloudflare to an origin. These are documented below rather than being forced
through a new topology.

## Identity and prerequisites

- pnpm openspec:guard passed.
- The accepted September 15 EmDash cutover receipt and the subsequent
  runtime-publication release evidence remain accepted; this change does not
  reopen cutover or require deferred cleanup/archive. See
  [runtime-publication release evidence](../reliable-content-publication/release-evidence.md)
  and [CMS cutover guidance](../../docs/cms-cutover.md).
- Current local source: edb6063688f33a155585f86b153757f603c6f57e on main
  (refactor: remove dead code and unused UI surface).
- Current origin/main and the deployed hosted release are
  62608456e9a2b9c0f404ee6f0162d064b1a6b174, release run 411. The local
  source is newer than the hosted release and was not deployed by this
  evidence pass.
- Public UAT currently reports content snapshot
  25ab812533cda8642d38876fbeb8c5f17bfad43954da52f87d47a937edc67563.
  Public PRD currently reports
  11950002508a76ad2f0882b4aa6e7e99bc107708fae94b142639a6fe7a086ed2. The
  older 04bc1bca... PRD snapshot in the accepted release receipt is
  historical; the live response header is the current identity used here.
- PRD /api/store/capabilities remained 200 with native checkout disabled.
  No checkout, provider write, webhook, catalog mutation, or publication
  mutation was attempted.

## Transport topology and ownership

| Leg | Current path | Classification and result |
| --- | --- | --- |
| Local public site | 127.0.0.1:4321/blackbox-records/ | Astro/static local HTTP. HTTP/3 is not part of the ordinary local launcher. |
| Local Worker | 127.0.0.1:8787 | Wrangler loopback HTTP. The official local Stripe mock at 127.0.0.1:12110 is a test-only HTTP dependency. |
| Shopper to Pages | UAT/PRD *.pages.dev | Cloudflare edge-owned. Chrome observed h3 for documents, same-origin assets, and sampled media. |
| Pages gateway to public renderer | ASSETS and PUBLIC_SITE service binding | Native Pages/Worker service binding, not a separately addressable HTTP/3 leg. |
| Public renderer to snapshot/media | PublicSiteRuntime Durable Object and R2 binding | Platform-managed native bindings. Pointer cache, HTML cache, and R2 access are application/runtime work, not browser transport. |
| Shopper to public API | UAT/PRD *-backend-*.workers.dev/api/store/capabilities | Cloudflare edge-owned workers.dev. Chrome observed both h2 on an earlier first connection and h3 on the bounded reload samples. |
| Operator to staff/CMS | staff-uat.blackboxrecordsathens.com, staff.blackboxrecordsathens.com | Cloudflare Access-protected custom domain. Authorized application HTML, EmDash JSON, and internal API responses were h3/200. |
| Combined CMS/commerce to bindings | CmsRuntime, CommerceRuntime, D1, R2, ASSETS | Native bindings and platform-managed execution; no HTTP/3 claim is made for these internal hops. |
| Worker to Stripe, Resend, GitHub, or other providers | Outbound SDK/fetch connections | Provider/client controlled and not safely attributable to this inbound transport pass. No provider write was attempted. |
| Provider webhook to Worker | Provider-selected inbound connection | Delivery protocol belongs to the provider; no HTTP/3 propagation is assumed. |
| Cloudflare edge to origin | Cloudflare-to-origin leg | Unsupported by Cloudflare HTTP/3 documentation; no origin proxy or paid service was added. |

The Pages gateway remains GET/HEAD-only for public reads and does not forward
staff cookies or authorization to the public renderer. Renderer privacy and
CMS/commerce separation therefore remain unchanged.

## Support and capability matrix

| Subject | Status | Evidence |
| --- | --- | --- |
| Cloudflare edge HTTP/3 on Free | Supported; zone setting already Enabled | Cloudflare documents HTTP/3 as available on Free and user-to-Cloudflare only: [HTTP/3 with QUIC](https://developers.cloudflare.com/speed/optimization/protocol/http3/). |
| blackboxrecordsathens.com custom host | Supported and enabled | Authenticated dashboard snapshot: HTTP/2 enabled, HTTP/3 enabled, HTTP/2-to-origin enabled, TLS 1.3 enabled, 0-RTT disabled. |
| pages.dev and workers.dev provider hosts | Platform-managed | No repo-owned per-host HTTP/3 toggle. Actual negotiation was measured per response. |
| Cloudflare-to-origin HTTP/3 | Unsupported | Cloudflare states that HTTP/3 to origin is not supported. |
| Inbound Worker HTTP/3 | Supported at the Cloudflare edge when the zone enables it | [Workers protocols](https://developers.cloudflare.com/workers/reference/protocols/). |
| Chrome 153 | QUIC-capable probe client | Resource Timing nextHopProtocol reported the negotiated protocol. |
| Local curl 8.21.0 Schannel | No HTTP/2 or HTTP/3 feature | curl.exe --version listed no HTTP2 or HTTP3 feature; it was used only with forced --http1.1 fallback. |
| 0-RTT | Not enabled | Dashboard snapshot showed 0-RTT Connection Resumption Disabled; no 0-RTT test or configuration was added. |
| New proxy, paid plan, local launcher change | Not needed | Existing Pages gateway, Worker bindings, and local launchers were sufficient. |

## Probe method

Chrome 153 used the native Resource Timing navigation entry and recorded
nextHopProtocol, transfer size, response start/end, status, and response
headers. nextHopProtocol is the negotiated ALPN protocol; Alt-Svc was recorded
only as an advertisement. Public document responses were no-store; sampled
media responses were immutable. Reload samples are warm browser samples, so
connection reuse and cache state are part of the evidence.

The fallback client ran three sequential curl.exe --http1.1 requests per
public target with response bodies discarded. All returned HTTP 200. These
are TCP fallback checks, not HTTP/3 absence claims, because this curl build
cannot negotiate HTTP/2 or HTTP/3. No automatic retries, background warmers,
0-RTT, checkout, provider, or write operation was used.

## Negotiated protocol evidence

### Browser h3 reload samples

responseStart values are milliseconds from the Chrome navigation timing entry.
Values are individual samples; medians and ranges are descriptive only.

| Target | Protocols | Response start samples | Median | Range | Transfer size |
| --- | --- | --- | ---: | ---: | ---: |
| UAT Pages / | h3, h3, h3 | 987.4, 784.4, 197.7 ms | 784.4 ms | 197.7–987.4 ms | 9,912 bytes |
| PRD Pages / | h3, h3, h3 | 871.5, 192.9, 191.4 ms | 192.9 ms | 191.4–871.5 ms | 9,884 bytes |
| UAT Worker /api/store/capabilities | h3, h3, h3 | 1,956.3, 89.7, 89.5 ms | 89.7 ms | 89.5–1,956.3 ms | 469 bytes |
| PRD Worker /api/store/capabilities | h3, h3, h3 | 260.2, 199.6, 177.1 ms | 199.6 ms | 177.1–260.2 ms | 491 bytes |

The earlier first-connection observation for both public Worker capability
pages was h2, despite the same Alt-Svc: h3=":443"; ma=86400 response header.
UAT Pages robots.txt and at least one favicon response also showed h2. This
is why the result is per response and not a claim that every resource always
uses h3.

Spot checks also returned:

- UAT and PRD root documents: 200, actual h3, matching current release and
  content headers.
- UAT and PRD /_image media responses: 200, actual h3, immutable cache policy,
  and the current environment snapshot path. The sampled image payload was
  420,742 bytes with approximately 421,042 bytes transferred.
- Public UAT capabilities: 200, actual h3, browser-safe native checkout
  enabled response.
- Public PRD capabilities: 200, actual h3, browser-safe native checkout
  disabled response.

### Forced HTTP/1.1 fallback samples

The following are curl.exe time-to-first-byte values in milliseconds. The curl
client and Chrome are different clients, so these values must not be used as
an h3-versus-h1 performance conclusion.

| Target | Protocol | TTFB samples | Median | Range | Body bytes |
| --- | --- | --- | ---: | ---: | ---: |
| UAT Pages / | HTTP/1.1 | 1,049.446, 330.568, 308.232 ms | 330.568 ms | 308.232–1,049.446 ms | 43,227 |
| PRD Pages / | HTTP/1.1 | 1,021.492, 335.473, 525.195 ms | 525.195 ms | 335.473–1,021.492 ms | 42,974 |
| UAT Worker capabilities | HTTP/1.1 | 281.664, 251.475, 219.920 ms | 251.475 ms | 219.920–281.664 ms | 204 |
| PRD Worker capabilities | HTTP/1.1 | 379.752, 310.798, 326.528 ms | 326.528 ms | 310.798–379.752 ms | 246 |

No production percentile, database saving, or application-latency conclusion is
drawn from these twelve fallback samples.

## Access-protected application evidence

The existing authorized Chrome sessions were reused without entering or
recording credentials. A normal reload of each staff home page produced the
actual application document, not an Access login/redirect:

| Environment | Application responses | Status/protocol | Cache state |
| --- | --- | --- | --- |
| UAT | staff document; /_emdash/api/blackbox/publications; /_emdash/api/blackbox/workspace; /api/internal/orders/search?limit=1&status=needs_review | 200 / h3 | Not disk-cache or service-worker responses |
| PRD | staff document; /_emdash/api/blackbox/publications; /_emdash/api/blackbox/workspace; /api/internal/orders/search?limit=1&status=needs_review | 200 / h3 | Not disk-cache or service-worker responses |

No credentials, Access assertions, or request identifiers are included in this
record.

## Free-tier budget snapshot

This is an account-wide Cloudflare dashboard snapshot. The displayed periods
were not all aligned, so rows marked “provisional” conservatively subtract the
displayed total as if it belonged to the current daily window; they are not
usage forecasts. The bounded probe was stopped well before any quota warning.

| Resource | Free cap | Dashboard observation | Conservative remaining / note |
| --- | ---: | ---: | --- |
| Workers requests | 100,000/day | 10.04k in last-24-hour account home | At least 89.96k on that view |
| Durable Object requests | 100,000/day | 31.09k, Sep 2–Oct 2 billing view | 68.91k provisional; period is not a daily meter |
| Durable Object duration | 13,000 GB-s/day | 1.41k GB-s, Sep 2–Oct 2 billing view | 11.59k GB-s provisional; period is not a daily meter |
| D1 rows read | 5,000,000/day | 407.92k, current displayed billing view | 4.59208m provisional; period alignment caveat applies |
| D1 rows written | 100,000/day | 2.88k, current displayed billing view | 97.12k provisional; period alignment caveat applies |
| D1 databases | 10/account | 8 visible | 2 database slots |
| R2 Class A | 1,000,000/month | 1.58k, Sep 2–Oct 2 | 998.42k |
| R2 Class B | 10,000,000/month | 28.03k, Sep 2–Oct 2 | 9.97197m |
| R2 standard storage | 10 GB-month/month | 1.45 GB, Sep 2–Oct 2 | 8.55 GB-month provisional |
| Workers Logs | 200,000/day | 1,344 successful events and 0 errors in the last hour | Cap observed; no full-day remaining value inferred |
| KV | Free allowance exists, but project policy forbids CMS KV | No project KV binding/use | Not part of this rollout |

Cloudflare's current references are [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
and [R2 pricing/free tier](https://developers.cloudflare.com/r2/pricing/).
The account-wide seven-day HTTP-version chart showed HTTP/1.1 53.82k,
HTTP/3 17.24k, HTTP/2 4.55k, and unknown/HTTP/1.0 105 requests; that chart is
context only and does not replace per-leg protocol evidence.

## UAT/PRD settings and rollback

The authenticated zone snapshot was:

- plan: Free;
- HTTP/2: enabled;
- HTTP/3: enabled;
- HTTP/2 to Origin: enabled;
- TLS 1.3: enabled;
- 0-RTT Connection Resumption: disabled;
- Enhanced HTTP/2 Prioritization: disabled because it requires an upgrade;
- Always Use HTTPS: disabled.

UAT acceptance therefore required no toggle. PRD required no settings or
release change either: its Pages and staff hosts negotiated h3, its public
Worker negotiated h3 on the bounded reloads, and its provider-owned cold
connection behavior was recorded rather than changed. No PRD deployment was
run, and PRD checkout launch gates remained unchanged (native_checkout_enabled
and PRD_LAUNCH_APPROVED are separate from HTTP/3).

Fallback was verified without mutation: all four public endpoints returned
200 over forced HTTP/1.1, and both protected applications returned authorized
200 responses over h3. The recorded rollback setting is HTTP/3 Enabled; if
a future authorized change disables it, recheck the same endpoints and expect
client fallback to h2/h1. No actual toggle rollback was performed because no
toggle was changed.

## Validation and limitations

- Targeted checks passed: pnpm openspec:guard, Chrome protocol/header probes,
  Access-protected UAT/PRD application probes, and bounded HTTP/1.1 fallback
  probes.
- This change adds evidence only; it does not change runtime behavior. The
  repository-wide pnpm validate and editor/publication suites were therefore
  not run under the behavior-change gate. Strict OpenSpec validation is the
  completion gate for this artifact.
- Internal service bindings, Durable Object/R2 transport, outbound provider
  protocol, webhook delivery protocol, and local loopback remain unverified or
  unsupported by design. They are not silently counted as HTTP/3 coverage.
- No browser preview/branch Pages deployment was used as acceptance evidence.

The negotiated-protocol method follows the Resource Timing definition of
nextHopProtocol: [W3C Resource Timing](https://www.w3.org/TR/resource-timing/).
