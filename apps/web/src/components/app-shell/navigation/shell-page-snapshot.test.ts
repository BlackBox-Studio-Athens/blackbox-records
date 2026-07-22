import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  applyDocumentShellPageSnapshot,
  cacheDocumentShellPageSnapshot,
  readDocumentShellPageSnapshot,
  sanitizeStoreCoverflowSnapshot,
  updateDocumentMetadata,
} from './shell-page-snapshot';

class FakeElement {
  public className = '';
  public innerHTML: string;
  public href = '';
  public content = '';

  constructor(
    private readonly attributes: Record<string, string> = {},
    html = '',
  ) {
    this.innerHTML = html;
  }

  cloneNode() {
    return new FakeElement(this.attributes, this.innerHTML);
  }

  getAttribute(name: string) {
    return this.attributes[name] ?? null;
  }

  querySelectorAll(selector: string) {
    const placeholderAttributes = ['data-artists-roster-filters', 'data-distro-search', 'data-services-inquiry-form'];
    const placeholderAttribute = placeholderAttributes.find((attribute) => selector === `[${attribute}]`);
    if (placeholderAttribute && this.innerHTML.includes(placeholderAttribute)) {
      const clearPlaceholder = () => {
        this.innerHTML = this.innerHTML.replace(
          new RegExp(`(<[^>]*${placeholderAttribute}[^>]*>)[\\s\\S]*?(</[^>]+>)`),
          '$1$2',
        );
      };
      return [
        {
          set innerHTML(value: string) {
            if (value === '') clearPlaceholder();
          },
        },
      ];
    }
    if (selector === '[data-distro-search-hidden]' && this.innerHTML.includes('data-distro-search-hidden')) {
      const removeSearchHiddenAttribute = () => {
        this.innerHTML = this.innerHTML.replace(/\s+data-distro-search-hidden(?:="")?/g, '');
      };
      return [
        {
          removeAttribute(name: string) {
            if (name === 'data-distro-search-hidden') removeSearchHiddenAttribute();
          },
        },
      ];
    }
    if (selector === '[data-store-listing-price]' && this.innerHTML.includes('data-store-listing-price')) {
      const replaceInnerHtml = (pattern: string | RegExp, replacement: string) => {
        this.innerHTML = this.innerHTML.replace(pattern, replacement);
      };
      return [
        {
          dataset: {
            set storeListingPriceState(value: string) {
              replaceInnerHtml(/data-store-listing-price-state="[^"]*"/, `data-store-listing-price-state="${value}"`);
            },
          },
          set textContent(value: string) {
            replaceInnerHtml(/(<span[^>]*data-store-listing-price[^>]*>)[\s\S]*?(<\/span>)/, `$1${value}$2`);
          },
          setAttribute(name: string, value: string) {
            if (name === 'aria-busy') {
              replaceInnerHtml('<span ', `<span aria-busy="${value}" `);
            }
          },
        },
      ];
    }
    return [];
  }
}

function createSnapshotDocument() {
  const main = new FakeElement(
    { class: 'catalog-page' },
    '<section>Catalog</section><div data-artists-roster-filters>hydrated filters</div><div data-distro-search><input value="vinyl"></div><a hidden data-distro-search-hidden>Item</a><span data-store-listing-price data-store-listing-price-state="ready">€28.00</span>',
  );
  const canonical = new FakeElement();
  canonical.href = 'https://example.test/blackbox-records/store/distro/';
  const description = new FakeElement();
  description.content = 'Distro Store category';

  return {
    title: 'Distro | Store | BlackBox',
    querySelector(selector: string) {
      if (selector === 'main[data-app-shell-main]') return main;
      if (selector === 'link[rel="canonical"]') return canonical;
      if (selector === 'meta[name="description"]') return description;
      return null;
    },
  } as unknown as Document;
}

describe('shell page snapshots', () => {
  it('restores the server-authored Coverflow state before caching a document snapshot', () => {
    const removed = new Set<string>();
    const styleProperties = new Map([['--store-coverflow-position-ratio', String(34 / 53)]]);
    const group = {
      dataset: {
        storeCoverflowInitialPositionRatio: String(1 / 53),
        storeCoverflowMode: 'catalog',
        storeCoverflowPreviewCount: '6',
        storeCoverflowRemainingCount: '52',
        storeCoverflowTotal: '53',
      },
      removeAttribute: (name: string) => removed.add(name),
      style: {
        removeProperty: (name: string) => styleProperties.delete(name),
        setProperty: (name: string, value: string) => styleProperties.set(name, value),
      },
    };
    const card = {
      dataset: { storeCoverflowInitialPosition: 'active', storeCoverflowPosition: 'right-near' },
      removeAttribute: (name: string) => removed.add(name),
    };
    const controls = { hidden: false };
    const previousButton = { removeAttribute: (name: string) => removed.add(name) };
    const nextButton = { removeAttribute: (name: string) => removed.add(name) };
    let toggleAriaExpanded = 'true';
    const toggle = {
      dataset: { storeCoverflowViewAllLabel: 'View all 53' },
      removeAttribute: (name: string) => removed.add(name),
      setAttribute: (name: string, value: string) => {
        if (name === 'aria-expanded') toggleAriaExpanded = value;
      },
      textContent: 'Show Coverflow',
    };
    const status = {
      dataset: { storeCoverflowInitialLabel: 'Barren Point — Bonebrokk' },
      hidden: true,
      textContent: '',
    };
    const currentValue = {
      dataset: { storeCoverflowInitialValue: '1' },
      textContent: '34',
    };
    const remainingValue = {
      dataset: { storeCoverflowInitialValue: '52' },
      textContent: '19',
    };
    const summary = {
      dataset: { storeCoverflowInitialLabel: "You're viewing 1 of 53." },
      textContent: "You're viewing 34 of 53.",
    };
    const formatDisclosure = { open: true };
    const root = {
      querySelectorAll(selector: string) {
        if (selector === '[data-store-coverflow-group]') return [group];
        if (selector === '[data-store-coverflow-card]') return [card];
        if (selector === '[data-store-coverflow-controls]') return [controls];
        if (selector.includes('[data-store-coverflow-next]')) return [previousButton, nextButton, toggle];
        if (selector === '[data-store-coverflow-toggle]') return [toggle];
        if (selector === '[data-store-coverflow-status]') return [status];
        if (selector === '[data-store-coverflow-initial-value]') return [currentValue, remainingValue];
        if (selector === '[data-store-coverflow-summary]') return [summary];
        if (selector === '[data-distro-format-disclosure]') return [formatDisclosure];
        return [];
      },
    } as unknown as ParentNode;

    sanitizeStoreCoverflowSnapshot(root);

    expect(removed).toEqual(
      new Set([
        'data-store-coverflow-ready',
        'data-store-coverflow-reveal',
        'data-store-coverflow-transitioning',
        'data-store-coverflow-visited',
        'data-store-coverflow-selected',
        'aria-disabled',
        'aria-roledescription',
      ]),
    );
    expect(group.dataset.storeCoverflowMode).toBe('preview');
    expect(group.dataset).toMatchObject({
      storeCoverflowPreviewCount: '6',
      storeCoverflowRemainingCount: '52',
      storeCoverflowTotal: '53',
    });
    expect(styleProperties.get('--store-coverflow-position-ratio')).toBe(String(1 / 53));
    expect(card.dataset.storeCoverflowPosition).toBe('active');
    expect(controls.hidden).toBe(false);
    expect(toggle.textContent).toBe('View all 53');
    expect(toggleAriaExpanded).toBe('false');
    expect(status.textContent).toBe('Barren Point — Bonebrokk');
    expect(status.hidden).toBe(false);
    expect(currentValue.textContent).toBe('1');
    expect(remainingValue.textContent).toBe('52');
    expect(summary.textContent).toBe("You're viewing 1 of 53.");
    expect(formatDisclosure.open).toBe(false);
  });

  it('reads the swappable main payload and route metadata', () => {
    const snapshot = readDocumentShellPageSnapshot(
      createSnapshotDocument(),
      'https://example.test/blackbox-records/store/distro/',
      'https://example.test/blackbox-records/',
    );

    expect(snapshot).toMatchObject({
      canonicalHref: 'https://example.test/blackbox-records/store/distro/',
      href: 'https://example.test/blackbox-records/store/distro/',
      mainClassName: 'catalog-page',
      pageDescription: 'Distro Store category',
      pathname: '/store/distro/',
      title: 'Distro | Store | BlackBox',
    });
    expect(snapshot?.mainHtml).toContain('Catalog');
    expect(snapshot?.mainHtml).not.toContain('hydrated filters');
    expect(snapshot?.mainHtml).not.toContain('value="vinyl"');
    expect(snapshot?.mainHtml).not.toContain('data-distro-search-hidden');
    expect(snapshot?.mainHtml).toContain('<a hidden>Item</a>');
    expect(snapshot?.mainHtml).toContain('data-store-listing-price-state="loading"');
    expect(snapshot?.mainHtml).toContain('Checking price');
    expect(snapshot?.mainHtml).not.toContain('€28.00');
  });

  it('updates document metadata when a snapshot is applied', () => {
    const description = new FakeElement();
    const canonical = new FakeElement();
    const targetDocument = {
      title: '',
      head: {
        querySelector(selector: string) {
          if (selector === 'meta[name="description"]') return description;
          if (selector === 'link[rel="canonical"]') return canonical;
          return null;
        },
      },
    } as unknown as Document;

    updateDocumentMetadata(
      {
        canonicalHref: 'https://example.test/blackbox-records/store/',
        href: 'https://example.test/blackbox-records/store/',
        mainClassName: '',
        mainHtml: '',
        pageDescription: 'Store page',
        pathname: '/store/',
        title: 'Store | BlackBox',
      },
      targetDocument,
    );

    expect(targetDocument.title).toBe('Store | BlackBox');
    expect(description.content).toBe('Store page');
    expect(canonical.href).toBe('https://example.test/blackbox-records/store/');
  });

  it('caches a readable document snapshot through the shell page cache seam', () => {
    const cacheSnapshot = vi.fn();

    const snapshot = cacheDocumentShellPageSnapshot({
      currentHref: 'https://example.test/blackbox-records/',
      href: 'https://example.test/blackbox-records/releases/',
      shellPageCache: { cacheSnapshot },
      targetDocument: createSnapshotDocument(),
    });

    expect(snapshot?.pathname).toBe('/releases/');
    expect(cacheSnapshot).toHaveBeenCalledWith(snapshot);
  });

  it('returns null without touching the cache when no main element can be read', () => {
    const cacheSnapshot = vi.fn();

    const snapshot = cacheDocumentShellPageSnapshot({
      currentHref: 'https://example.test/blackbox-records/',
      href: 'https://example.test/blackbox-records/releases/',
      shellPageCache: { cacheSnapshot },
      targetDocument: {
        querySelector: () => null,
        title: 'Missing main',
      } as unknown as Document,
    });

    expect(snapshot).toBeNull();
    expect(cacheSnapshot).not.toHaveBeenCalled();
  });

  it('applies snapshot main content, metadata, href, and active pathname callbacks', () => {
    const main = new FakeElement();
    const description = new FakeElement();
    const canonical = new FakeElement();
    const onHrefApplied = vi.fn();
    const onPathnameApplied = vi.fn();
    const targetDocument = {
      head: {
        querySelector(selector: string) {
          if (selector === 'meta[name="description"]') return description;
          if (selector === 'link[rel="canonical"]') return canonical;
          return null;
        },
      },
      title: '',
    } as unknown as Document;

    const applied = applyDocumentShellPageSnapshot({
      getMainElement: () => main as unknown as HTMLElement,
      onHrefApplied,
      onPathnameApplied,
      pageSnapshot: {
        canonicalHref: 'https://example.test/blackbox-records/artists/',
        href: 'https://example.test/blackbox-records/artists/',
        mainClassName: 'artists-page',
        mainHtml: '<section>Artists</section>',
        pageDescription: 'Artists',
        pathname: '/artists/',
        title: 'Artists | BlackBox',
      },
      targetDocument,
    });

    expect(applied).toBe(true);
    expect(main.className).toBe('artists-page');
    expect(main.innerHTML).toBe('<section>Artists</section>');
    expect(targetDocument.title).toBe('Artists | BlackBox');
    expect(description.content).toBe('Artists');
    expect(canonical.href).toBe('https://example.test/blackbox-records/artists/');
    expect(onHrefApplied).toHaveBeenCalledWith('https://example.test/blackbox-records/artists/');
    expect(onPathnameApplied).toHaveBeenCalledWith('/artists/');
  });

  it('does not apply a snapshot when the shell main element is missing', () => {
    const applied = applyDocumentShellPageSnapshot({
      getMainElement: () => null,
      onHrefApplied: vi.fn(),
      onPathnameApplied: vi.fn(),
      pageSnapshot: {
        canonicalHref: 'https://example.test/blackbox-records/artists/',
        href: 'https://example.test/blackbox-records/artists/',
        mainClassName: 'artists-page',
        mainHtml: '<section>Artists</section>',
        pageDescription: 'Artists',
        pathname: '/artists/',
        title: 'Artists | BlackBox',
      },
    });

    expect(applied).toBe(false);
  });
});
