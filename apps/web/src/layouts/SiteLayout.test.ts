import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('./SiteLayout.astro', import.meta.url)), 'utf8');

describe('SiteLayout public backend connection hints', () => {
  it('warms only the configured public backend origin without fetching or caching Store data', () => {
    expect(source).toContain('import.meta.env.PUBLIC_BACKEND_BASE_URL?.trim()');
    expect(source).toContain('new URL(configuredPublicBackendBaseUrl).origin');
    expect(source).toContain('<link rel="dns-prefetch" href={publicBackendOrigin} />');
    expect(source).toContain('<link rel="preconnect" href={publicBackendOrigin} crossorigin="anonymous" />');
  });
});
