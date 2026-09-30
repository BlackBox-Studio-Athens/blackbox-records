import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  applyDocumentShellPageSnapshot,
  cacheDocumentShellPageSnapshot,
  readDocumentShellPageSnapshot,
  sanitizeArtistRosterSnapshot,
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
    if (selector === '[data-store-preview-ready]' && this.innerHTML.includes('data-store-preview-ready')) {
      return [
        {
          removeAttribute: () => {
            this.innerHTML = this.innerHTML.replace(' data-store-preview-ready', '');
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
    if (
      selector === '[data-store-listing-availability]' &&
      this.innerHTML.includes('data-store-listing-availability')
    ) {
      const replaceInnerHtml = (pattern: string | RegExp, replacement: string) => {
        this.innerHTML = this.innerHTML.replace(pattern, replacement);
      };
      const setAvailabilityHidden = (value: boolean) => {
        this.innerHTML = this.innerHTML.replace(
          /<span([^>]*data-store-listing-availability[^>]*)>/,
          (_tag, attributes: string) =>
            `<span${value ? `${attributes} hidden` : attributes.replace(/\s+hidden(?=\s|$)/g, '')}>`,
        );
      };
      return [
        {
          dataset: {
            set storeListingAvailabilityState(value: string) {
              replaceInnerHtml(
                /data-store-listing-availability-state="[^"]*"/,
                `data-store-listing-availability-state="${value}"`,
              );
            },
          },
          set hidden(value: boolean) {
            setAvailabilityHidden(value);
          },
          set textContent(value: string) {
            replaceInnerHtml(/(<span[^>]*data-store-listing-availability[^>]*>)[\s\S]*?(<\/span>)/, `$1${value}$2`);
          },
          setAttribute(name: string, value: string) {
            if (name === 'aria-busy') replaceInnerHtml('<span ', `<span aria-busy="${value}" `);
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
    '<section>Catalog</section><div data-artists-roster-filters>hydrated filters</div><div data-distro-search><input value="vinyl"></div><a hidden data-distro-search-hidden>Item</a><span data-store-listing-price data-store-listing-price-state="ready">€28.00</span><span hidden data-store-listing-availability data-store-listing-availability-state="stocked">Sold Out</span><img data-store-preview-image data-store-preview-ready>',
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
  it('keeps the previous snapshot when a dialog temporarily hides page descendants', () => {
    const cloneNode = vi.fn();
    const cacheSnapshot = vi.fn();
    const targetDocument = {
      querySelector: () => ({ querySelectorAll: () => [{}], cloneNode }),
    } as unknown as Document;
    expect(
      cacheDocumentShellPageSnapshot({
        targetDocument,
        href: 'https://example.test/store/',
        currentHref: 'https://example.test/store/',
        shellPageCache: { cacheSnapshot },
      }),
    ).toBeNull();
    expect(cloneNode).not.toHaveBeenCalled();
    expect(cacheSnapshot).not.toHaveBeenCalled();
  });

  it('restores the server-authored Coverflow state before caching a document snapshot', () => {
    const removed = new Set<string>();
    const styleProperties = new Map([['--store-coverflow-position-ratio', String(34 / 53)]]);
    const group = {
      dataset: {
        storeCoverflowMode: 'preview',
        storeCoverflowPreviewCount: '6',
        storeCoverflowRemainingCount: '52',
        storeCoverflowTotal: '53',
      },
      removeAttribute: (name: string) => removed.add(name),
      querySelector(selector: string) {
        if (selector === '[data-store-coverflow-controls]') return controls;
        if (selector === '[data-store-coverflow-toggle]') return toggle;
        if (selector === '[data-store-coverflow-status]') return status;
        return null;
      },
      querySelectorAll(selector: string) {
        if (selector.includes('[data-store-coverflow-next]')) return [previousButton, nextButton, toggle];
        return [];
      },
      style: {
        removeProperty: (name: string) => styleProperties.delete(name),
      },
    };
    const card = {
      dataset: { storeCoverflowInitialPosition: 'active', storeCoverflowPosition: 'right-near' },
      removeAttribute: (name: string) => removed.add(name),
    };
    const controls = { hidden: false };
    const previousButton = { removeAttribute: (name: string) => removed.add(name) };
    const nextButton = { removeAttribute: (name: string) => removed.add(name) };
    let toggleAriaPressed = 'true';
    const toggle = {
      dataset: { storeCoverflowViewAllLabel: 'View all 53' },
      removeAttribute: (name: string) => removed.add(name),
      setAttribute: (name: string, value: string) => {
        if (name === 'aria-pressed') toggleAriaPressed = value;
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
    const selectedRoot = { removeAttribute: (name: string) => removed.add(name) };
    const currentSection = { removeAttribute: (name: string) => removed.add(name) };
    const allFormatLink = {
      dataset: { distroFormatKey: 'all' },
      removeAttribute: (name: string) => removed.add(name),
      setAttribute: (name: string, value: string) => {
        if (name === 'aria-current') allFormatLinkAriaCurrent = value;
      },
      toggleAttribute: (_name: string, force: boolean) => {
        allFormatLinkCurrent = force;
      },
    };
    const selectedFormatLink = {
      dataset: { distroFormatKey: 'distro-group-vinyl-7-inch' },
      removeAttribute: (name: string) => {
        removed.add(name);
        if (name === 'aria-current') selectedFormatLinkAriaCurrent = null;
      },
      setAttribute: () => undefined,
      toggleAttribute: (_name: string, force: boolean) => {
        selectedFormatLinkCurrent = force;
      },
    };
    let allFormatLinkAriaCurrent: string | null = null;
    let allFormatLinkCurrent = false;
    let selectedFormatLinkAriaCurrent: string | null = 'true';
    let selectedFormatLinkCurrent = true;
    const root = {
      querySelectorAll(selector: string) {
        if (selector === '[data-store-coverflow-group]') return [group];
        if (selector === '[data-store-coverflow-card]') return [card];
        if (selector === '[data-store-coverflow-initial-value]') return [currentValue, remainingValue];
        if (selector === '[data-store-coverflow-summary]') return [summary];
        if (selector === '[data-store-browse-disclosure]') return [formatDisclosure];
        if (selector === '[data-distro-selected-format]') return [selectedRoot];
        if (selector === '[data-distro-format-current]') return [currentSection, selectedFormatLink];
        if (selector === '[data-distro-format-link]') return [allFormatLink, selectedFormatLink];
        return [];
      },
    } as unknown as ParentNode;

    sanitizeStoreCoverflowSnapshot(root);

    expect(removed).toEqual(
      new Set([
        'data-store-coverflow-ready',
        'data-store-coverflow-position',
        'data-store-coverflow-reveal',
        'data-store-coverflow-transitioning',
        'data-store-coverflow-visited',
        'data-store-coverflow-selected',
        'data-distro-format-current',
        'data-distro-selected-format',
        'aria-disabled',
        'aria-current',
        'aria-roledescription',
      ]),
    );
    expect(group.dataset.storeCoverflowMode).toBe('catalog');
    expect(group.dataset).toMatchObject({
      storeCoverflowPreviewCount: '6',
      storeCoverflowRemainingCount: '52',
      storeCoverflowTotal: '53',
    });
    expect(styleProperties.has('--store-coverflow-position-ratio')).toBe(false);
    expect(removed.has('data-store-coverflow-position')).toBe(true);
    expect(controls.hidden).toBe(true);
    expect(toggle.textContent).toBe('Show Coverflow');
    expect(toggleAriaPressed).toBe('true');
    expect(status.textContent).toBe('');
    expect(status.hidden).toBe(true);
    expect(currentValue.textContent).toBe('1');
    expect(remainingValue.textContent).toBe('52');
    expect(summary.textContent).toBe("You're viewing 1 of 53.");
    expect(formatDisclosure.open).toBe(false);
    expect(allFormatLinkCurrent).toBe(true);
    expect(allFormatLinkAriaCurrent).toBe('true');
    expect(selectedFormatLinkCurrent).toBe(false);
    expect(selectedFormatLinkAriaCurrent).toBeNull();
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
    expect(snapshot?.mainHtml).toContain('data-store-listing-availability-state="pending"');
    expect(snapshot?.mainHtml).toContain('Checking availability');
    expect(snapshot?.mainHtml).not.toContain('Sold Out');
    expect(snapshot?.mainHtml).not.toMatch(/<span[^>]*data-store-listing-availability[^>]*\shidden/);
    expect(snapshot?.mainHtml).toContain('data-store-preview-image');
    expect(snapshot?.mainHtml).not.toContain('data-store-preview-ready');
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

function createRosterElement(attributes: Record<string, string> = {}) {
  const attributeMap = new Map(Object.entries(attributes));
  const element = {
    attributes: attributeMap,
    hidden: attributeMap.has('hidden'),
    innerHTML: '',
    open: false,
    orderRemoved: false,
    removeAttribute(name: string) {
      attributeMap.delete(name);
    },
    setAttribute(name: string, value: string) {
      attributeMap.set(name, value);
    },
    style: {
      removeProperty(name: string) {
        if (name === 'order') element.orderRemoved = true;
      },
    },
  };
  return element;
}

function createRosterRoot() {
  const mount = createRosterElement();
  mount.innerHTML = '<span>hydrated preview</span>';
  const prints = [
    createRosterElement({ 'data-print-depth': '1', 'aria-hidden': 'true' }),
    createRosterElement({ 'data-print-depth': '0' }),
    createRosterElement({ 'data-print-depth': '2', 'aria-hidden': 'true' }),
  ];
  const details = [createRosterElement({ hidden: '' }), createRosterElement(), createRosterElement({ hidden: '' })];
  const rows = [createRosterElement(), createRosterElement({ 'data-active': '' })];
  const items = [createRosterElement({ 'data-filter-state': 'hidden', hidden: '' }), createRosterElement()];
  const disclosure = createRosterElement();
  disclosure.open = true;
  const rosterRoot = createRosterElement({ 'data-roster-sort': 'latest' });
  const root = {
    querySelectorAll(selector: string) {
      const bySelector: Record<string, unknown[]> = {
        '[data-artist-roster-preview]': [mount],
        '[data-artist-preview-print]': prints,
        '[data-artist-preview-details]': details,
        '[data-artist-roster-row]': rows,
        '[data-artist-roster-item]': items,
        '[data-artist-roster-disclosure]': [disclosure],
        '[data-artists-roster-root]': [rosterRoot],
      };
      return bySelector[selector] ?? [];
    },
  } as unknown as ParentNode;
  return { details, disclosure, items, mount, prints, root, rosterRoot, rows };
}

describe('Artists roster snapshots', () => {
  it('restores the server-default preview, rows, sort, and disclosures', () => {
    const { details, disclosure, items, mount, prints, root, rosterRoot, rows } = createRosterRoot();

    sanitizeArtistRosterSnapshot(root);

    expect(mount.innerHTML).toBe('');
    expect(prints.map((print) => print.hidden)).toEqual([false, true, true]);
    expect(prints.map((print) => print.attributes.get('data-print-depth') ?? null)).toEqual(['0', null, null]);
    expect(prints.map((print) => print.attributes.has('aria-hidden'))).toEqual([false, false, false]);
    expect(details.map((block) => block.hidden)).toEqual([false, true, true]);
    expect(rows.map((row) => row.attributes.has('data-active'))).toEqual([false, false]);
    expect(items.map((item) => item.hidden)).toEqual([false, false]);
    expect(items.map((item) => item.attributes.has('data-filter-state'))).toEqual([false, false]);
    expect(items.map((item) => item.orderRemoved)).toEqual([true, true]);
    expect(disclosure.open).toBe(false);
    expect(rosterRoot.attributes.has('data-roster-sort')).toBe(false);
  });

  it('sanitizes the roster in the cloned main before caching it', () => {
    const { prints, root } = createRosterRoot();
    const clone = { ...(root as object), innerHTML: '<ul></ul>' };
    const main = {
      cloneNode: () => clone,
      getAttribute: () => '',
      querySelectorAll: () => [],
    };
    const targetDocument = {
      title: 'Artists',
      querySelector: (selector: string) => (selector === 'main[data-app-shell-main]' ? main : null),
    } as unknown as Document;

    const snapshot = readDocumentShellPageSnapshot(
      targetDocument,
      'https://example.test/blackbox-records/artists/',
      'https://example.test/blackbox-records/',
    );

    expect(snapshot?.pathname).toBe('/artists/');
    expect(prints.map((print) => print.hidden)).toEqual([false, true, true]);
  });
});
