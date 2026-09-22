import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');
const distroCatalog = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroCatalog.astro', import.meta.url)),
  'utf8',
);
const releaseCard = readFileSync(
  fileURLToPath(new URL('../components/cards/ReleaseCard.astro', import.meta.url)),
  'utf8',
);
const releaseDetail = readFileSync(
  fileURLToPath(new URL('../components/detail/ReleaseDetailContent.astro', import.meta.url)),
  'utf8',
);
const releasesPage = readFileSync(fileURLToPath(new URL('../pages/releases/index.astro', import.meta.url)), 'utf8');
const storeItemDetail = readFileSync(
  fileURLToPath(new URL('../pages/store/[slug]/index.astro', import.meta.url)),
  'utf8',
);

function readClassRule(className: string) {
  const match = new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`, 's').exec(css);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

describe('Catalog description typography', () => {
  it('uses the mono family only for bounded editorial descriptions', () => {
    const distroGroupCopy = readClassRule('distro-group-section__copy');
    const latestReleaseSummary = readClassRule('releases-latest-feature__summary');
    const upcomingReleaseSummary = readClassRule('releases-latest-feature__upcoming-summary');

    expect.soft(distroGroupCopy).toContain('font-family: var(--font-sans);');
    expect(distroGroupCopy).toContain('font-size: 0.875rem;');
    expect(distroGroupCopy).toContain('line-height: 1.5;');

    expect.soft(latestReleaseSummary).toContain('font-family: var(--font-mono);');
    expect(latestReleaseSummary).toContain('font-size: 1rem;');
    expect(latestReleaseSummary).toContain('line-height: 1.65;');

    expect.soft(upcomingReleaseSummary).toContain('font-family: var(--font-mono);');
    expect(upcomingReleaseSummary).toContain('font-size: 0.9rem;');
    expect(upcomingReleaseSummary).toContain('line-height: 1.55;');

    for (const rule of [distroGroupCopy, latestReleaseSummary, upcomingReleaseSummary]) {
      expect(rule).not.toContain('letter-spacing:');
      expect(rule).not.toContain('text-transform:');
    }

    expect(readClassRule('release-card-summary-text')).not.toContain('font-family:');
  });

  it('keeps summaries conditional and detail prose on body typography', () => {
    expect(distroCatalog).toContain('value={content.group_intros[group.introKey]}');
    expect(releaseCard).toContain('class="release-card-summary-text text-sm leading-relaxed text-muted-foreground"');

    expect(releasesPage).toMatch(
      /latestReleaseEntry\.data\.summary && \(\s*<Prose\s+class="releases-latest-feature__summary"/s,
    );
    expect(releasesPage).toMatch(
      /upcomingReleaseEntry\.data\.summary && \(\s*<Prose\s+class="releases-latest-feature__upcoming-summary"/s,
    );

    const releaseDetailSummaryClass = /release\.data\.summary && \(\s*<Prose\s+class="([^"]+)"/s.exec(
      releaseDetail,
    )?.[1];
    const storeItemSummaryClass = /storeItem\.summary && \(?\s*<Prose\s+class="([^"]+)"/s.exec(storeItemDetail)?.[1];

    expect(releaseDetailSummaryClass).toBe('max-w-2xl text-sm leading-relaxed text-muted-foreground');
    expect(storeItemDetail).toContain('rich={storeItem.summaryRich}');
    expect(releaseDetailSummaryClass).not.toContain('font-mono');
    expect(storeItemSummaryClass || '').not.toContain('font-mono');
  });
});
