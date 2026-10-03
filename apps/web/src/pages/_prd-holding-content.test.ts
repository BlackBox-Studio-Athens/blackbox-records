import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// Every hosted UAT/PRD build renders this page against editable CMS content, so a missing or
// reshaped social entry or inquiry email must not fail the release build. The holding artifact
// itself is still gated by scripts/check-prd-holding.ts, which requires both actions.
const pageSource = readFileSync(fileURLToPath(new URL('./prd-holding/index.astro', import.meta.url)), 'utf8');
const [, frontmatter = '', template = ''] = pageSource.split(/^---$/m);

describe('PRD Holding Page content dependence', () => {
  it('never throws on editorial content during the build', () => {
    expect(frontmatter).not.toMatch(/\bthrow\b/);
  });

  it('finds Instagram by its https host instead of a fixed entry id', () => {
    expect(frontmatter).not.toMatch(/item\.id\s*!==?\s*'instagram'/);
    expect(frontmatter).toContain("url.protocol === 'https:'");
    expect(frontmatter).toContain("url.hostname === 'instagram.com'");
    expect(frontmatter).toContain("url.hostname.endsWith('.instagram.com')");
  });

  it('omits each action when its content is missing or invalid', () => {
    expect(frontmatter).toMatch(/inquiryEmail = \/\^\[\^\\s@\]\+@.*\? candidateEmail : undefined/);
    expect(template).toMatch(/\{instagramUrl && \(\s*<a href=\{instagramUrl\}/);
    expect(template).toMatch(/\{inquiryEmail && \(\s*<a href=\{`mailto:\$\{inquiryEmail\}`\}/);
    expect(template).toMatch(/\(instagramUrl \|\| inquiryEmail\) && \(\s*<nav class="holding-page__actions"/);
  });

  it('shows the logo as a 240 px WebP sized for its 72-120 CSS px slot and keeps the PNG for link unfurls', () => {
    expect(frontmatter).toContain("createProjectRelativeUrl('/assets/images/brand/logo-240.webp')");
    expect(frontmatter).toContain('new URL(siteBrandAssets.badgeLogo, pageUrl)');
    expect(template).toContain('src={logoUrl} alt="BlackBox Records" width="240" height="240"');
  });
});
