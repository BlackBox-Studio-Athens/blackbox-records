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
  it('shares the one 1200 × 630 brand card with its size on every page', () => {
    expect(source).toContain('const metadataImage = createAbsoluteSiteUrl(siteConfig.socialImage);');
    expect(source).not.toContain('getImage');
    expect(source).toContain('<meta property="og:image:type" content="image/jpeg" />');
    expect(source).toContain('<meta property="og:image:width" content={String(siteConfig.socialImageWidth)} />');
    expect(source).toContain('<meta property="og:image:height" content={String(siteConfig.socialImageHeight)} />');
  });
});

describe('SiteLayout document head', () => {
  it('matches browser chrome to the dark site and links home-screen icons and the manifest', () => {
    expect(source).toContain('<meta name="theme-color" content={siteThemeColor} />');
    expect(source).toContain('<meta name="color-scheme" content="dark" />');
    expect(source).toContain(
      '<link rel="apple-touch-icon" href={createProjectRelativeUrl(siteBrandAssets.appleTouchIcon)} />',
    );
    expect(source).toContain('<link rel="manifest" href={createProjectRelativeUrl(siteBrandAssets.webManifest)} />');
  });

  it('derives canonical and og:url from the configured site and path, not the request URL', () => {
    expect(source).toContain('const metadataUrl = createCanonicalUrl(Astro.url, Astro.site);');
    expect(source).not.toContain('Astro.url.toString()');
    expect(source).toContain('<link rel="canonical" href={redirectUrl || metadataUrl} />');
  });
});
