import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const css = source('./global.css');
const internalPageHero = source('../components/InternalPageHero.astro');
const releasesPage = source('../pages/releases/index.astro');
const servicesPage = source('../pages/services/index.astro');

function cssRule(selector: string) {
  const match = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`));
  expect(match, `Missing ${selector} CSS rule`).not.toBeNull();
  return match?.[1] ?? '';
}

describe('section page identity', () => {
  it('keeps shared title typography in the internal page hero rule', () => {
    expect(cssRule('.internal-page-hero__title')).toMatch(
      /font-family:\s*var\(--font-display-brand\);[\s\S]*font-size:\s*clamp\(2\.35rem, 8\.5vw, 4\.15rem\);[\s\S]*line-height:\s*0\.98;[\s\S]*letter-spacing:\s*0\.035em;[\s\S]*text-wrap:\s*balance;/,
    );
  });

  it('wires every shared hero through duplicate-label resolution', () => {
    expect(internalPageHero).toContain("import { resolveSupportingLabel } from '@/lib/page-identity';");
    expect(internalPageHero).toContain('const resolvedSectionLabel = resolveSupportingLabel(sectionLabel, title);');
    expect(internalPageHero).toContain('resolvedSectionLabel &&');
    expect(internalPageHero).toContain('{resolvedSectionLabel}');
  });

  it('keeps custom headers distinct and on the shared title class', () => {
    expect(releasesPage).toMatch(
      /<p class="releases-page-intro__eyebrow">Catalog<\/p>[\s\S]*?<h1 class="releases-page-intro__title internal-page-hero__title"[^>]*>Releases<\/h1>/,
    );
    expect(servicesPage).toMatch(
      /<p class="services-page-intro__eyebrow">What We Do<\/p>[\s\S]*?<h1 class="services-page-intro__title internal-page-hero__title">\{servicesContent\.hero\.title\}<\/h1>/,
    );
  });

  it('prevents custom title rules from owning shared typography', () => {
    for (const selector of ['.releases-page-intro__title', '.services-page-intro__title']) {
      expect(cssRule(selector)).not.toMatch(
        /(?:font-family|font-size|line-height|letter-spacing|text-wrap|overflow-wrap)\s*:/,
      );
    }
  });
});
