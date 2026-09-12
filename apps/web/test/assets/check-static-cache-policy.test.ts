import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  fingerprintedAstroAssetPath,
  immutableAstroCacheControl,
  maxCloudflarePagesHeaderLineLength,
  maxCloudflarePagesHeaderRules,
  parseHeadersArtifact,
  validateStaticCachePolicyArtifact,
  validateStaticCachePolicyRules,
} from '../../scripts/check-static-cache-policy';

describe('check-static-cache-policy', () => {
  it('revalidates shared hosted HTML and disables release identity caching', () => {
    const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
    expect(validateStaticCachePolicyArtifact(headers)).toEqual([]);
    const rules = parseHeadersArtifact(headers);
    expect(rules.find((rule) => rule.path === '/release.json')?.headers).toEqual(['Cache-Control: no-store']);
    for (const route of [
      '/',
      '/store/*',
      '/artists/*',
      '/releases/*',
      '/news/*',
      '/about/*',
      '/services/*',
      '/app-shell-overlay/*',
    ]) {
      expect(rules.find((rule) => rule.path === route)?.headers).toEqual([
        'Cache-Control: public, max-age=0, must-revalidate',
      ]);
    }
  });
  it('parses header rules from the built artifact format', () => {
    expect(
      parseHeadersArtifact(
        ['# comment', '', '/_astro/*', `  Cache-Control: ${immutableAstroCacheControl}`, ''].join('\n'),
      ),
    ).toEqual([
      {
        headers: [`Cache-Control: ${immutableAstroCacheControl}`],
        path: fingerprintedAstroAssetPath,
      },
    ]);
  });

  it('accepts only the fingerprinted Astro asset immutable cache rule', () => {
    expect(
      validateStaticCachePolicyArtifact(`/_astro/*
  Cache-Control: ${immutableAstroCacheControl}
`),
    ).toEqual([]);
  });

  it('rejects immutable caching on non-fingerprinted route documents', () => {
    expect(
      validateStaticCachePolicyArtifact(`/_astro/*
  Cache-Control: ${immutableAstroCacheControl}

/store/*
  Cache-Control: ${immutableAstroCacheControl}
`),
    ).toEqual([`Immutable caching is not allowed for /store/*.`]);
  });

  it('rejects header lines that exceed the Cloudflare Pages Free-tier line limit', () => {
    expect(
      validateStaticCachePolicyArtifact(`/_astro/*
  Cache-Control: ${'a'.repeat(maxCloudflarePagesHeaderLineLength + 1)}
`),
    ).toEqual([
      `Header line for ${fingerprintedAstroAssetPath} exceeds Cloudflare Pages Free-tier line limit of ${maxCloudflarePagesHeaderLineLength} characters.`,
      `Expected /_astro/* to use "${immutableAstroCacheControl}", but found "${'a'.repeat(maxCloudflarePagesHeaderLineLength + 1)}".`,
    ]);
  });

  it('rejects header artifacts with too many rules', () => {
    const rules = Array.from({ length: maxCloudflarePagesHeaderRules + 1 }, (_, index) => ({
      headers: [],
      path: `/asset-${index}/*`,
    }));

    expect(validateStaticCachePolicyRules(rules)).toEqual([
      `Built _headers artifact has ${maxCloudflarePagesHeaderRules + 1} rules, which exceeds Cloudflare Pages Free-tier limit of ${maxCloudflarePagesHeaderRules}.`,
      `Missing /_astro/* cache rule in built _headers artifact.`,
    ]);
  });
});
