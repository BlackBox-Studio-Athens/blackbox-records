import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const src = fileURLToPath(new URL('..', import.meta.url));
const read = (path: string) => readFileSync(join(src, path), 'utf8');
const css = read('styles/global.css').replace(/\/\*[\s\S]*?\*\//g, '');
const prose = read('styles/prose.css');

/** Each rule's prelude, the preludes around it and its body. */
function rules() {
  const found: { prelude: string; ancestors: string[]; body: string }[] = [];
  const stack: { prelude: string; start: number }[] = [];
  let preludeStart = 0;
  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    if (character === '{') {
      stack.push({ prelude: css.slice(preludeStart, index).trim().replace(/\s+/g, ' '), start: index + 1 });
      preludeStart = index + 1;
    } else if (character === '}') {
      const rule = stack.pop()!;
      found.push({
        prelude: rule.prelude,
        ancestors: stack.map((parent) => parent.prelude),
        body: css.slice(rule.start, index),
      });
      preludeStart = index + 1;
    } else if (character === ';') {
      preludeStart = index + 1;
    }
  }
  return found;
}

/** A body without its nested rules. */
function ownDeclarations(body: string) {
  let own = body;
  while (/{[^{}]*}/.test(own)) own = own.replace(/[^{};]*{[^{}]*}/g, '');
  return own;
}

// Decorative or player-owned text that sits outside the reading floor.
const belowFloorAllowed = new Set([
  '.music-player-heading__status',
  '.music-streaming-service-embedded-player-mini-player-provider',
  '.store-cart-drawer__fallback',
  '.checkout-summary__fallback',
]);

describe('Phone typography floor', () => {
  it('keeps hand-written label and meta sizes at 0.75rem or more', () => {
    const small = rules()
      .filter((rule) => !belowFloorAllowed.has(rule.prelude))
      .flatMap((rule) =>
        [...ownDeclarations(rule.body).matchAll(/(?:^|;)\s*font(?:-size)?:\s*(?:\d{3}\s+)?(\d*\.\d+)rem/g)]
          .filter((match) => Number(match[1]) < 0.75)
          .map((match) => `${rule.prelude}: ${match[1]}rem`),
      );
    expect(small).toEqual([]);
  });

  it('does not shrink the footer on phones', () => {
    const phoneFooter = rules().filter(
      (rule) =>
        /^\.site-footer-(meta|heading)$/.test(rule.prelude) &&
        rule.ancestors.some((parent) => parent.includes('max-width')),
    );
    for (const rule of phoneFooter) expect(rule.body).not.toContain('font-size');
  });

  it('keeps Tailwind text utilities at 12px or more outside the cart count badge', () => {
    const offenders: string[] = [];
    for (const entry of readdirSync(join(src, 'components'), { recursive: true, encoding: 'utf8' }).concat(
      readdirSync(join(src, 'pages'), { recursive: true, encoding: 'utf8' }).map((path) => join('..', 'pages', path)),
    )) {
      if (!/\.(astro|tsx)$/.test(entry) || entry.includes('.test.') || entry.includes('_demo')) continue;
      const source = read(join('components', entry));
      for (const match of source.matchAll(/text-\[(\d+)px\]/g)) {
        if (Number(match[1]) < 12 && !entry.endsWith('StoreCartButton.tsx')) offenders.push(`${entry}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('sets phone long-form artist copy at 1rem', () => {
    const phoneBio = rules().find(
      (rule) => rule.prelude === '.artist-detail-prose p' && rule.ancestors.includes('@media (max-width: 48rem)'),
    );
    expect(phoneBio?.body).toContain('font-size: 1rem;');
    // News bodies stay at 1rem at every width, inside a 46rem reading card.
    const newsDetail = read('components/editorial/NewsDetailContent.astro');
    expect(newsDetail).toContain('news-markdown-content text-base leading-relaxed text-muted-foreground"');
    expect(newsDetail).toContain('surface-card sm:max-w-[46rem]');
  });
});

describe('Long words on narrow screens', () => {
  it('lets display titles break long words', () => {
    for (const title of [
      '.brand-display-title',
      '.brand-card-title',
      '.brand-cart-line-title',
      '.internal-page-hero__title',
      '.release-detail-page-title',
      '.artist-detail-title',
    ]) {
      const rule = rules().find((candidate) => candidate.prelude === title && candidate.body.includes('font-family'));
      expect(rule?.body, title).toContain('overflow-wrap: anywhere;');
    }
  });

  it('lets legal-page email links wrap', () => {
    for (const page of ['pages/terms/index.astro', 'pages/withdrawal/index.astro']) {
      expect(read(page)).toMatch(/<a class="[^"]*\[overflow-wrap:anywhere\][^"]*" href="mailto:/);
    }
  });
});

describe('Editorial body prose', () => {
  it('wires release, news and artist bodies to list, quote and heading styles', () => {
    expect(read('components/editorial/ReleaseDetailContent.astro')).toMatch(
      /<div class="editorial-prose">\s*<EditorialContent entry=\{release\} \/>/,
    );
    expect(read('components/artists/ArtistDetailContent.astro')).toMatch(
      /<div class="[^"]*\beditorial-prose\b[^"]*">\s*<EditorialContent entry=\{artist\} \/>/,
    );
    expect(prose).toContain('.editorial-prose :where(h1, h2, h3, h4, h5, h6) {');
    expect(css).toMatch(/\.news-markdown-content ol \{\s*@apply [^;]*list-decimal/);
    expect(css).toContain('.news-markdown-content :is(h1, h2) {');
    expect(css).toContain('.news-markdown-content :is(h3, h4, h5, h6) {');
  });
});
