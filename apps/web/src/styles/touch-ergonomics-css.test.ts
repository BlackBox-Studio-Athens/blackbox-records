import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** Each rule's prelude with the preludes of the blocks around it. */
function rules() {
  const found: { prelude: string; ancestors: string[]; body: string }[] = [];
  const stack: { prelude: string; start: number }[] = [];
  let preludeStart = 0;
  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    if (character === '{') {
      stack.push({ prelude: css.slice(preludeStart, index).trim(), start: index + 1 });
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

/** A rule under the given block prelude, or at the top level when media is null. */
function ruleBody(selector: string, media: string | null) {
  const rule = rules().find(
    (candidate) =>
      candidate.prelude.replace(/\s+/g, ' ') === selector &&
      (media === null ? candidate.ancestors.length === 0 : candidate.ancestors.some((parent) => parent === media)),
  );
  if (!rule) throw new Error(`No ${selector} rule under ${media}`);
  return rule.body;
}

// Hover that may stay ungated besides reduced-motion resets: a finite equalizer run that also answers :active, and the
// edition-link block that shares one written condition between hover and keyboard focus.
const ungatedHoverAllowed = [
  '.music-listen-trigger:is(:hover, :focus-visible, :active) .music-equalizer__bar',
  '[data-release-edition-link]:has(',
];

describe('touch ergonomics', () => {
  it('keeps hand-written hover faces behind (hover: hover) so taps leave no sticky hover', () => {
    const ungated = rules()
      .filter(({ prelude }) => prelude.includes(':hover'))
      .filter(
        ({ ancestors }) =>
          !ancestors.some((parent) => /\(hover:\s*hover\)|\(prefers-reduced-motion: reduce\)/.test(parent)),
      )
      .filter(({ prelude }) => !ungatedHoverAllowed.some((allowed) => prelude.includes(allowed)))
      .map(({ prelude }) => prelude.replace(/\s+/g, ' '));
    expect(ungated).toEqual([]);
  });

  it('keeps keyboard focus faces outside the hover gate', () => {
    for (const selector of ['.store-format-links a:focus-visible', '.release-format-link:focus-visible']) {
      const rule = rules().find(({ prelude }) => prelude === selector);
      expect(rule, selector).toBeDefined();
      expect(rule!.ancestors.some((parent) => parent.includes('hover'))).toBe(false);
    }
  });

  it('gives secondary touch targets a 44px coarse-pointer area', () => {
    expect(ruleBody('.store-cart-drawer__remove', '@media (pointer: coarse)')).toMatch(/min-height:\s*44px/);
    expect(ruleBody('.store-cart-drawer__remove::before', '@media (pointer: coarse)')).toMatch(/inset-block:\s*0/);
    expect(ruleBody('.artist-profile-link', '@media (pointer: coarse)')).toMatch(/min-height:\s*2\.75rem/);
    expect(ruleBody('.store-item-card__artist-link', '@media (pointer: coarse)')).toMatch(/position:\s*relative/);
    expect(ruleBody('.store-item-card__artist-link::before', '@media (pointer: coarse)')).toMatch(
      /inset:\s*-14px -4px/,
    );
  });
});

describe('Store layout on phones', () => {
  const phone = '@media (max-width: 63.99rem)';

  it('keeps only Search and Filter in the row above the first Store card row', () => {
    expect(ruleBody('.store-search-toolbar :is(.store-menu-trigger, .store-filter-home)', phone)).toMatch(
      /display:\s*none/,
    );
    // Listen sits on the artwork corner, so no Listen row pushes the identity down.
    expect(ruleBody('.store-collection-page .store-item-card__listen', null)).toMatch(/position:\s*absolute/);
  });

  it('lets the item in hand in the Crate paint its price and Buy row at every width', () => {
    const crateCss = readFileSync(
      fileURLToPath(new URL('../components/store/crate/crate.css', import.meta.url)),
      'utf8',
    );
    expect(crateCss).toMatch(/\.store-crate \[data-store-crate-hand\] \{\s*content-visibility: visible;/);
  });

  it('keeps the cart lines a window on short viewports', () => {
    const short = '@media (max-height: 30rem)';
    expect(ruleBody('.store-cart-drawer__actions', short)).toMatch(/flex-direction:\s*row/);
    expect(ruleBody('.store-cart-drawer__description', short)).toMatch(/clip-path:\s*inset\(50%\)/);
  });

  it('sizes the phone item artwork by the viewport height', () => {
    expect(ruleBody('.store-item-artwork', '@media (width < 48rem)')).toMatch(/max-width:\s*min\(26rem, 36svh\)/);
  });
});
