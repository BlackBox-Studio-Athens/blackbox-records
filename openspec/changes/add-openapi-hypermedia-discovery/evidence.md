# Traversal evidence

Recorded 2026-09-18 from deterministic Local contract fixtures and the existing WebStorm/Vitest test runs. This is
scripted traversal evidence, not an LLM or autonomous-agent benchmark.

| Workflow                                    | OpenAPI-only fixture                                               | Hypermedia-assisted fixture                                                                                                  | Added work                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Public available offer → checkout           | 3 known requests; 0 guessed requests; checkout action available    | 3 requests selected from discovery, offer links, and the current checkout action; 0 guessed requests                         | 1 existing capability/feature-flag read for a ready offer; 0 provider writes before explicit checkout |
| Public unavailable offer                    | 2 known reads; no checkout write                                   | 2 reads; action omitted and no checkout write                                                                                | 0 D1/provider reads added by metadata                                                                 |
| Operator variant → stock → adjustment/count | 4 known requests; stale revision returns the existing 409 contract | 4 requests selected from discovery, collection Link, detail links, and action operationRef; stale revision still returns 409 | 0 additional D1/provider reads; no request key minted on GET                                          |
| Operator without permission                 | 1 protected request; 401 before route work                         | 1 protected discovery request; 401 before route work                                                                         | 0                                                                                                     |

The byte comparison is intentionally represented by the generated contract artifacts and route fixtures rather than a
synthetic compression claim: object responses gain only optional `links`/`actions`, while collection bodies remain
arrays and carry RFC 8288 `Link` headers. Existing generated-client fixtures continued to pass after OpenAPI/client
regeneration.

For reproducible representative JSON fixtures, the public offer measured 297 B without metadata, 514 B with links, and
791 B with links plus checkout; the protected stock detail measured 255 B without metadata, 794 B with links, and 1,403
B with links plus two stock actions. These are payload measurements, not network-transfer measurements.

The scripted checks cover encoded identities, unsafe/external Link destinations, omitted checkout actions,
public/internal document filtering, protected discovery, operation references, CORS exposure, and metadata-free legacy
objects. No separate agent client with permission to evaluate these Local workflows was available in this run;
actual-agent success improvement remains unverified and no such improvement is claimed.
