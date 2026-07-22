import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroCatalog.astro', import.meta.url)),
  'utf8',
);
const cardSource = readFileSync(
  fileURLToPath(new URL('../components/cards/DistroCard.astro', import.meta.url)),
  'utf8',
);
const appShellSource = readFileSync(
  fileURLToPath(new URL('../components/app-shell/AppShellRoot.tsx', import.meta.url)),
  'utf8',
);
const shellOutletsSource = readFileSync(
  fileURLToPath(new URL('../components/app-shell/view/ShellPortalOutlets.tsx', import.meta.url)),
  'utf8',
);
const searchSource = readFileSync(
  fileURLToPath(new URL('../components/store/StoreDistroSearch.tsx', import.meta.url)),
  'utf8',
);
const controllerSource = readFileSync(
  fileURLToPath(new URL('../components/store/StoreCoverflowController.ts', import.meta.url)),
  'utf8',
);
const cssSource = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

describe('Distro Coverflow progressive enhancement', () => {
  it('derives full-group position state while retaining one complete card render path', () => {
    expect(pageSource).toContain('coverflowEligible: totalCount > STORE_COVERFLOW_PREVIEW_SIZE');
    expect(pageSource).toContain('const totalCount = group.entries.length');
    expect(pageSource).toContain('const positionedCount = Math.min(STORE_COVERFLOW_PREVIEW_SIZE, totalCount)');
    expect(pageSource).toContain('const initialCurrentPosition = 1');
    expect(pageSource).toContain('const initialRemainingCount = totalCount - initialCurrentPosition');
    expect(pageSource).toContain('const initialPositionRatio = initialCurrentPosition / totalCount');
    expect(pageSource.match(/<DistroCard/g)).toHaveLength(1);
    expect(pageSource).toContain('group.chunks.map((chunk, chunkIndex)');
    expect(pageSource).toContain("data-store-coverflow-mode={group.coverflowEligible ? 'preview' : undefined}");
    expect(pageSource).toContain('data-store-coverflow-total={group.coverflowEligible ? group.totalCount : undefined}');
    expect(pageSource).toContain('data-store-coverflow-preview-count');
    expect(pageSource).toContain('data-store-coverflow-remaining-count');
    expect(pageSource).toContain('data-store-coverflow-initial-position-ratio');
    expect(pageSource).toContain('--store-coverflow-position-ratio: ${group.initialPositionRatio}');
    expect(pageSource).toContain("You're viewing {group.initialCurrentPosition} of {group.totalCount}.");
    expect(pageSource).toContain('<dt>Now viewing</dt>');
    expect(pageSource).toContain('data-store-coverflow-current-value');
    expect(pageSource).toContain('data-store-coverflow-remaining-value');
    expect(pageSource).toContain('data-store-coverflow-summary');
    expect(pageSource).toContain('class="store-coverflow-rail" aria-hidden="true"');
    expect(pageSource).toContain('data-store-coverflow-disclosure-rail');
    expect(pageSource).toContain('class="store-coverflow-actions__toggle"');
    expect(pageSource).toContain('aria-expanded="false"');
    expect(pageSource).toContain('data-store-coverflow-initial-label');
    expect(pageSource).toContain('class="store-coverflow-reveal" data-store-coverflow-reveal-mask aria-hidden="true"');
    expect(pageSource).not.toContain('01 / 06');
    expect(pageSource).not.toContain('pagination-dot');
    expect(pageSource).not.toContain('thumbnail');
    expect(pageSource).not.toMatch(/aria-disabled="true"\s+data-store-coverflow-previous/);
    expect(cardSource).toContain('data-store-coverflow-initial-position={coverflowPosition}');
    expect(pageSource).toContain('coverflowPreview={group.coverflowEligible}');
    expect(pageSource).not.toContain('coverflowPreview={group.coverflowEligible && chunkIndex === 0}');
    expect(pageSource.indexOf('data-store-coverflow-toggle')).toBeLessThan(
      pageSource.indexOf('class="store-coverflow-shell"'),
    );
  });

  it('fails open for the current route and rechecks capability on later route activation', () => {
    expect(appShellSource).toContain("activeShellPathname !== '/store/'");
    expect(appShellSource).toContain("import('@/components/store/StoreCoverflowController')");
    expect(appShellSource).toContain('ensureStoreCoverflowCapability()');
    expect(appShellSource).toContain("removeAttribute('data-store-coverflow-capable')");
    expect(shellOutletsSource).toContain(
      "onError={() => document.documentElement.removeAttribute('data-store-coverflow-capable')}",
    );
    expect(searchSource).toContain('ensureStoreCoverflowCapability()');
  });

  it('uses one Distro orientation panel and exposes search results only for an active query', () => {
    expect(pageSource).toContain('data-store-orientation="distro"');
    expect(pageSource).toContain('<p class="store-orientation-panel__eyebrow">Store shelf</p>');
    expect(pageSource).toContain('<p class="store-orientation-panel__count-value">{itemCountLabel}</p>');
    expect(pageSource.match(/{itemCountLabel}/g)).toHaveLength(1);
    expect(pageSource).toContain('class="store-orientation-panel__distro-tools"');
    expect(pageSource).toContain('class="distro-page-search" data-distro-search');
    expect(searchSource).toContain("aria-describedby={hasActiveSearch ? 'distro-search-result-count' : undefined}");
    expect(searchSource).toContain('{hasActiveSearch ? (');
    expect(searchSource).toContain('Clear search');
    expect(searchSource).not.toContain('{totalCount} total');
  });

  it('keeps artwork links ordinary and statically named in every page mode', () => {
    expect(cardSource).toContain('aria-label={isHomeVariant ? undefined : `${sourceTitle} — ${sourceSubtitle}`}');
    expect(cardSource).toContain('href={storeItem.storePath}');
    expect(cardSource).toContain('data-store-item-slug={storeItem.slug}');
    expect(cardSource).not.toContain('preventDefault');
  });

  it('uses one responsive six-position stage across every card with a flat reduced-motion fallback', () => {
    expect(pageSource).toContain("group.coverflowEligible && 'distro-group-section--coverflow'");
    expect(pageSource).not.toContain('aria-roledescription');
    expect(controllerSource).toContain("group.element.setAttribute('aria-roledescription', 'carousel')");
    expect(controllerSource).toContain("group.element.removeAttribute('aria-roledescription')");
    expect(cssSource).toContain('.distro-page-search .distro-search-panel');
    expect(cssSource).toContain('perspective: 52rem');
    expect(cssSource).toContain('@media (min-width: 40rem)');
    expect(cssSource).toContain('perspective: 64rem');
    expect(cssSource).toContain('--store-cover-size: clamp(13.5rem, 20vw, 16rem)');
    expect(cssSource).toContain('--store-cover-near-shift: clamp(7.5rem, 16vw, 11rem)');
    expect(cssSource).toMatch(/\.distro-group-section--coverflow[\s\S]*?border: 1px solid var\(--border\)/);
    expect(cssSource).toMatch(
      /\.distro-group-section__overview--coverflow[\s\S]*?border-bottom: 1px solid var\(--border\)/,
    );
    expect(cssSource).toContain('transform-style: preserve-3d');
    expect(
      new Set([...cssSource.matchAll(/data-store-coverflow-position='([^']+)'/g)].map((match) => match[1])),
    ).toEqual(new Set(['active', 'right-near', 'right-far', 'back', 'left-far', 'left-near']));
    expect(cssSource).toMatch(/data-store-coverflow-ready[\s\S]*?\.distro-group-chunk[\s\S]*?display: contents/);
    expect(cssSource).toMatch(
      /data-store-coverflow-mode='preview'[\s\S]*?data-store-coverflow-card\]:not\(\[data-store-coverflow-position\]\)[\s\S]*?display: none/,
    );
    expect(cssSource).toMatch(/\.distro-card__content[\s\S]*?display: none/);
    expect(cssSource).toContain('animation: store-catalog-reveal 300ms');
    expect(cssSource).toContain('animation: store-coverflow-preview-rail-in 360ms');
    expect(cssSource).toContain('animation: store-coverflow-disclosure-fill 180ms');
    expect(cssSource).toContain('transform: scaleX(var(--store-coverflow-position-ratio))');
    expect(cssSource).toContain('transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1)');
    expect(cssSource).toMatch(/\.store-coverflow-stat[\s\S]*?justify-content: flex-end/);
    expect(cssSource).toContain("data-store-coverflow-reveal='catalog-pending'");
    expect(cssSource).toContain('grid-template-columns: repeat(auto-fit, minmax(min(5rem, 100%), 1fr))');
    expect(cssSource).toContain('background: #0d0d0d');
    expect(cssSource).not.toContain('view-transition-name');
    expect(cssSource).toContain('touch-action: pan-y pinch-zoom');
    expect(cssSource).toMatch(/\.distro-group-chunk:not\(:first-child\)[\s\S]*?content-visibility: auto/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?transform-style: flat/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?position: static/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?\.distro-group-chunk[\s\S]*?display: contents/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?\.store-item-card__content[\s\S]*?display: grid/);
    expect(cssSource).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*?store-coverflow-rail__fill[\s\S]*?animation: none/,
    );
    expect(cssSource).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*?store-coverflow-rail__fill[\s\S]*?transition: none/,
    );
  });
});
