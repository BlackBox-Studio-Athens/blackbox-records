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

describe('SiteLayout purchase information', () => {
  it('inlines the entry only when the build ships a browser reader for it', () => {
    expect(source).toContain(
      "import { getPurchaseInformation, inlinesPurchaseInformation } from '@/platform/lib/purchase-information';",
    );
    expect(source).toMatch(/\{inlinesPurchaseInformation && \(\s*<script[^>]*id="purchase-information"/);
    expect(source.match(/id="purchase-information"/g)).toHaveLength(1);
  });
});

describe('SiteLayout social image', () => {
  it('publishes a Content Image as a 1200 px JPEG resolved against the site origin, not the original upload', () => {
    expect(source).toContain("import { getImage } from 'astro:assets';");
    expect(source).toContain(
      "await getImage({ src: metadataImageRaw, width: Math.min(metadataImageRaw.width, 1200), format: 'jpg' })",
    );
    expect(source).toContain('Astro.site ?? Astro.url');
    expect(source).not.toContain('metadataImageRaw.src');
  });
});
