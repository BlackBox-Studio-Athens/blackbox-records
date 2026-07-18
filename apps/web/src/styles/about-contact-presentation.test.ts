import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const aboutPage = readFileSync(fileURLToPath(new URL('../pages/about/index.astro', import.meta.url)), 'utf8');
const globalCss = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');

describe('About contact presentation', () => {
  it('keeps one ordered contact list with first-item prominence and native email links', () => {
    expect(aboutPage).toContain('<section class="about-contact" aria-labelledby="about-contact-title">');
    expect(aboutPage).toContain('<ul class="about-contact__list">');
    expect(aboutPage).toContain("itemIndex === 0 ? 'about-contact__item--primary' : 'about-contact__item--secondary'");
    expect(aboutPage).toContain('href={`mailto:${item.value}`}');
    expect(aboutPage).not.toContain('target="_blank"');
  });

  it('keeps complete-row links, visible labels and addresses, and decorative mail icons', () => {
    expect(aboutPage).toContain('<a class="about-contact__link"');
    expect(aboutPage).toContain('<span class="about-contact__label">{item.label}</span>');
    expect(aboutPage).toContain('<span class="about-contact__address">{item.value}</span>');
    expect(aboutPage).toMatch(/<Mail[^>]*aria-hidden="true"[^>]*size=\{18\}/s);
    expect(globalCss).toMatch(/\.about-contact__link\s*{[^}]*min-height:\s*2\.75rem/s);
    expect(globalCss).toMatch(/\.about-contact__icon\s*{[^}]*width:\s*1\.125rem[^}]*height:\s*1\.125rem/s);
  });

  it('provides visible focus, safe wrapping, and the selected responsive hierarchy', () => {
    expect(globalCss).toMatch(/\.about-contact__item,\s*\.about-contact__link\s*{[^}]*min-width:\s*0/s);
    expect(globalCss).toMatch(/\.about-contact__address\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(globalCss).toMatch(/\.about-contact__link:focus-visible\s*{[^}]*outline:/s);
    expect(globalCss).toMatch(
      /@media \(min-width:\s*48rem\)[\s\S]*?\.about-contact__list\s*{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[^}]*}[\s\S]*?\.about-contact__item--primary\s*{[^}]*grid-column:\s*1 \/ -1/s,
    );
  });
});
