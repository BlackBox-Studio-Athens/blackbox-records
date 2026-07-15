import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const redirectLayoutSource = readFileSync(
  fileURLToPath(new URL('../layouts/RedirectLayout.astro', import.meta.url)),
  'utf8',
);
const redirectPageSource = readFileSync(fileURLToPath(new URL('../pages/distro/index.astro', import.meta.url)), 'utf8');

describe('legacy Distro redirect', () => {
  it('preserves the browser fragment only for opt-in redirect callers', () => {
    expect(redirectLayoutSource).toContain('preserveFragment?: boolean;');
    expect(redirectLayoutSource).toContain("data-preserve-fragment={preserveFragment ? 'true' : undefined}");
    expect(redirectLayoutSource).toContain('`${redirectTarget}${window.location.hash}`');
    expect(redirectLayoutSource).toContain('<meta content={`0; url=${redirectUrl}`} http-equiv="refresh" />');
    expect(redirectLayoutSource).toContain('<link rel="canonical" href={redirectUrl} />');
  });

  it('redirects the legacy route to the base-aware Store Distro category with a visible fallback link', () => {
    expect(redirectPageSource).toContain("createProjectRelativeUrl('/store/distro/')");
    expect(redirectPageSource).toContain('preserveFragment');
    expect(redirectPageSource).toContain('href={redirectUrl}');
  });
});
