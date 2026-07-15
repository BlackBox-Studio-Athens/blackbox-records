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
const cssSource = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

describe('Distro Coverflow progressive enhancement', () => {
  it('derives eligibility and totals while retaining one complete card render path', () => {
    expect(pageSource).toContain('group.entries.length > DISTRO_COVERFLOW_PREVIEW_SIZE');
    expect(pageSource.match(/<DistroCard/g)).toHaveLength(1);
    expect(pageSource).toContain('group.chunks.map((chunk, chunkIndex)');
    expect(pageSource).toContain("data-distro-coverflow-mode={group.coverflowEligible ? 'preview' : undefined}");
    expect(pageSource).toContain('Selected {DISTRO_COVERFLOW_PREVIEW_SIZE} of {group.entries.length}');
    expect(pageSource).toContain('data-distro-coverflow-initial-label');
    expect(pageSource).toContain('class="distro-coverflow-reveal" aria-hidden="true"');
    expect(pageSource).not.toContain('01 / 06');
    expect(pageSource).not.toMatch(/aria-disabled="true"\s+data-distro-coverflow-previous/);
    expect(cardSource).toContain('data-distro-coverflow-initial-position={coverflowPosition}');
    expect(pageSource.indexOf('data-distro-coverflow-toggle')).toBeLessThan(
      pageSource.indexOf('class="distro-coverflow-shell"'),
    );
  });

  it('falls back after failed direct-load or app-shell-entry mounting', () => {
    expect(appShellSource).toContain("activeShellPathname !== '/store/distro/'");
    expect(appShellSource).toContain("!group.hasAttribute('data-distro-coverflow-ready')");
    expect(appShellSource).toContain("removeAttribute('data-distro-coverflow-capable')");
    expect(shellOutletsSource).toContain(
      "onError={() => document.documentElement.removeAttribute('data-distro-coverflow-capable')}",
    );
  });

  it('keeps artwork links ordinary and statically named in every page mode', () => {
    expect(cardSource).toContain('aria-label={isHomeVariant ? undefined : `${sourceTitle} — ${sourceSubtitle}`}');
    expect(cardSource).toContain('href={storeItem.storePath}');
    expect(cardSource).toContain('storeItemSlug={storeItem.slug}');
    expect(cardSource).not.toContain('preventDefault');
  });

  it('uses one responsive 3D stage, six shared positions, and a flat reduced-motion fallback', () => {
    expect(cssSource).toContain('perspective: 56rem');
    expect(cssSource).toContain('@media (min-width: 40rem)');
    expect(cssSource).toContain('perspective: 72rem');
    expect(cssSource).toContain('--distro-cover-size: clamp(15rem, 24vw, 19rem)');
    expect(cssSource).toContain('--distro-cover-near-shift: clamp(8.5rem, 18vw, 14rem)');
    expect(cssSource).toContain('transform-style: preserve-3d');
    expect(
      new Set([...cssSource.matchAll(/data-distro-coverflow-position='([^']+)'/g)].map((match) => match[1])),
    ).toEqual(new Set(['active', 'right-near', 'right-far', 'back', 'left-far', 'left-near']));
    expect(cssSource).toMatch(/\.distro-group-chunk:not\(:first-child\)[\s\S]*?display: none/);
    expect(cssSource).toMatch(/\.distro-card__content[\s\S]*?display: none/);
    expect(cssSource).toContain('animation: distro-catalog-reveal 460ms');
    expect(cssSource).toContain('background: #0d0d0d');
    expect(cssSource).not.toContain('view-transition-name');
    expect(cssSource).toContain('touch-action: pan-y pinch-zoom');
    expect(cssSource).toMatch(/\.distro-group-chunk:not\(:first-child\)[\s\S]*?content-visibility: auto/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?transform-style: flat/);
    expect(cssSource).toMatch(/prefers-reduced-motion: reduce[\s\S]*?position: static/);
  });
});
