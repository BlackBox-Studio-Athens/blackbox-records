import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../styles/global.css', import.meta.url)), 'utf8');
const distroCatalog = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroCatalog.astro', import.meta.url)),
  'utf8',
);
const releaseCard = readFileSync(
  fileURLToPath(new URL('../components/editorial/ReleaseCard.astro', import.meta.url)),
  'utf8',
);
const releaseDetail = readFileSync(
  fileURLToPath(new URL('../components/editorial/ReleaseDetailContent.astro', import.meta.url)),
  'utf8',
);
const storeItemDetail = readFileSync(fileURLToPath(new URL('./store/[slug]/index.astro', import.meta.url)), 'utf8');

function readClassRule(className: string) {
  const match = new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`, 's').exec(css);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

describe('Catalog description typography', () => {
  it('keeps editorial descriptions, featured Release summaries included, on the body family', () => {
    const distroGroupCopy = readClassRule('distro-group-section__copy');
    // Both featured Releases share one summary rule; the design system keeps mono for small metadata.
    const featuredReleaseSummary = readClassRule('releases-feature__summary');

    expect.soft(distroGroupCopy).toContain('font-family: var(--font-sans);');
    expect(distroGroupCopy).toContain('font-size: 0.875rem;');
    expect(distroGroupCopy).toContain('line-height: 1.5;');

    expect.soft(featuredReleaseSummary).toContain('font-family: var(--font-sans);');
    expect(featuredReleaseSummary).toContain('font-size: 1rem;');
    expect(featuredReleaseSummary).toContain('line-height: 1.65;');
    expect(featuredReleaseSummary).toContain('max-width: 36em;');

    for (const rule of [distroGroupCopy, featuredReleaseSummary]) {
      expect(rule).not.toContain('letter-spacing:');
      expect(rule).not.toContain('text-transform:');
    }

    expect(css).not.toMatch(/releases-latest-feature__(?:upcoming-)?summary/);
    expect(readClassRule('release-card-summary-text')).not.toContain('font-family:');
  });

  it('keeps summaries conditional and detail prose on body typography', () => {
    // Distro has no visible introduction above its toolbar (store-mobile-first-browse).
    expect(distroCatalog).not.toContain('content.hero.intro');
    expect(distroCatalog).not.toContain('content.group_intros');
    expect(releaseCard).toContain('class="release-card-summary-text text-sm leading-relaxed text-muted-foreground"');

    expect(releaseCard).toMatch(
      /release\.data\.summary && \(\s*<div\s+data-release-summary\s+hidden=\{!isPrincipal\}[^>]*>\s*<Prose value=\{release\.data\.summary\} rich=\{release\.data\.summary_rich\}/s,
    );

    const releaseDetailSummaryClass = /release\.data\.summary && \(\s*<Prose\s+class="([^"]+)"/s.exec(
      releaseDetail,
    )?.[1];
    const storeItemSummaryClass = /storeItem\.summary && \(?\s*<Prose\s+class="([^"]+)"/s.exec(storeItemDetail)?.[1];

    expect(releaseDetailSummaryClass).toBe('max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-sm');
    expect(storeItemDetail).toContain('rich={storeItem.summaryRich}');
    expect(storeItemSummaryClass || '').not.toContain('font-mono');
  });
});
