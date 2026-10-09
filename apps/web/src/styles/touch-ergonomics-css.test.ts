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
    for (const selector of ['.store-format-links a:focus-visible', '.release-detail-link:focus-visible::before']) {
      const rule = rules().find(({ prelude }) => prelude === selector);
      expect(rule, selector).toBeDefined();
      expect(rule!.ancestors.some((parent) => parent.includes('hover'))).toBe(false);
    }
  });
});
