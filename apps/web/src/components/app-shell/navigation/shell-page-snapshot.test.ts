import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  applyDocumentShellPageSnapshot,
  cacheDocumentShellPageSnapshot,
  readDocumentShellPageSnapshot,
  readParsedShellPageSnapshot,
  rememberDocumentIslandServerMarkup,
  sanitizeStoreCoverflowSnapshot,
  scheduleIdleShellTask,
  SHELL_IDLE_SNAPSHOT_TIMEOUT_MS,
  updateDocumentMetadata,
} from './shell-page-snapshot';

// Fragment fake: nodes appended to it are `{ html }` records, and `html` reads them back as markup.
class FakeFragment {
  public readonly nodes: Array<{ html: string }> = [];

  append(...nodes: Array<{ html: string }>) {
    this.nodes.push(...nodes);
  }

  cloneNode() {
    const clone = new FakeFragment();
    clone.append(...this.nodes.map((node) => ({ ...node })));
    return clone;
  }

  get html() {
    return this.nodes.map((node) => node.html).join('');
  }

  querySelectorAll() {
    return [];
  }
}

const fakeInertDocument = { createDocumentFragment: () => new FakeFragment() };

function fakeFragment(html: string) {
  const fragment = new FakeFragment();
  fragment.append({ html });
  return fragment as unknown as DocumentFragment;
}

function fragmentHtml(fragment: DocumentFragment | undefined) {
  return (fragment as unknown as FakeFragment | undefined)?.html;
}

class FakeElement {
  public className = '';
  public innerHTML: string;
  public href = '';
  public content = '';
  public ownerDocument = fakeInertDocument;

  public readonly insertedNodes: FakeFragment[] = [];

  get childNodes() {
    return [{ html: this.innerHTML }];
  }

  replaceChildren(...nodes: FakeFragment[]) {
    this.insertedNodes.push(...nodes);
    this.innerHTML = nodes.map((node) => node.html).join('');
  }

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
    if (selector === '[data-copied]' && this.innerHTML.includes('data-copied')) {
      return [
        {
          removeAttribute: () => {
            this.innerHTML = this.innerHTML.replace(' data-copied', '');
          },
        },
      ];
    }
    if (selector === '[data-copy-status]' && this.innerHTML.includes('data-copy-status')) {
      const setStatusText = (value: string) => {
        this.innerHTML = this.innerHTML.replace(/(<span[^>]*data-copy-status[^>]*>)[\s\S]*?(<\/span>)/, `$1${value}$2`);
      };
      return [
        {
          set textContent(value: string) {
            setStatusText(value);
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
    '<section>Catalog</section><div data-artists-roster-filters>hydrated filters</div><div data-distro-search><input value="vinyl"></div><a hidden data-distro-search-hidden>Item</a><span data-store-listing-price data-store-listing-price-state="ready">€28.00</span><span hidden data-store-listing-availability data-store-listing-availability-state="stocked">Sold Out</span><img data-store-preview-image data-store-preview-ready><button data-copy-value="info@example.test" data-copied></button><span role="status" data-copy-status>Copied</span>',
  );
  const canonical = new FakeElement();
  canonical.href = 'https://example.test/blackbox-records/store/distro/';
  const description = new FakeElement();
  description.content = 'Distro Store category';

  return {
    title: 'Distro | Store | BlackBox',
    createElement: () => ({ content: { ownerDocument: { importNode: (node: FakeElement) => node.cloneNode() } } }),
    querySelector(selector: string) {
      if (selector === 'main[data-app-shell-main]') return main;
      if (selector === 'link[rel="canonical"]') return canonical;
      if (selector === 'meta[name="description"]') return description;
      return null;
    },
  } as unknown as Document;
}

describe('shell page snapshots', () => {
  it.each(['Pre-order vinyl', 'Buy vinyl'])(
    'neutralizes an enriched %s snapshot without changing the live cards or layout',
    (actionName) => {
      const makeCard = () => {
        const purchase = {
          textContent: actionName,
          className:
            actionName === 'Pre-order vinyl' ? 'site-button preorder-action' : 'site-button site-button--primary',
        };
        const shipping = {
          textContent: actionName === 'Pre-order vinyl' ? 'Expected to ship around November 2026' : '',
          hidden: actionName !== 'Pre-order vinyl',
        };
        const badges = {
          children: [
            {
              textContent: actionName === 'Pre-order vinyl' ? 'Pre-order' : 'Vinyl available',
              className: actionName === 'Pre-order vinyl' ? 'preorder-badge' : 'store-item-card__release-status',
            },
          ],
          replaceChildren(...children: Array<{ textContent: string; className: string }>) {
            this.children = children;
          },
        };
        const fields = {
          '[data-release-purchase]': purchase,
          '[data-release-shipping]': shipping,
          '[data-release-badges]': badges,
        };
        const card = {
          dataset: {
            releaseId: 'release',
            releaseRole: 'lead',
            releaseDate: '2000-01-01',
            releasePhysicalFormat: 'vinyl',
            releaseStoreSlug: 'edition',
            releaseSourceOrder: '0',
          },
          ownerDocument: { createElement: () => ({ textContent: '', className: '' }) },
          querySelector: (selector: string) => fields[selector as keyof typeof fields] ?? null,
        };
        return { card, purchase, shipping, badges };
      };
      const live = makeCard();
      const cloned = makeCard();
      const makeMain = (model: ReturnType<typeof makeCard>) => ({
        ownerDocument: fakeInertDocument,
        getAttribute: () => 'releases-page-layout',
        querySelectorAll: (selector: string) =>
          selector === '[data-release-id][data-release-role]' ? [model.card] : [],
        get childNodes() {
          return [
            {
              html: JSON.stringify({
                purchase: model.purchase,
                shipping: model.shipping,
                badges: model.badges.children,
                role: model.card.dataset.releaseRole,
              }),
            },
          ];
        },
      });
      const main = makeMain(live);
      const targetDocument = {
        title: 'Releases',
        querySelector: (selector: string) => (selector === 'main[data-app-shell-main]' ? main : null),
        createElement: () => ({ content: { ownerDocument: { importNode: () => makeMain(cloned) } } }),
      } as unknown as Document;
      const snapshot = readDocumentShellPageSnapshot(
        targetDocument,
        'https://example.test/releases/',
        'https://example.test/releases/',
      );
      expect(live.purchase.textContent).toBe(actionName);
      expect(live.badges.children[0]?.textContent).toBe(
        actionName === 'Pre-order vinyl' ? 'Pre-order' : 'Vinyl available',
      );
      expect(fragmentHtml(snapshot?.mainContent)).toContain('View vinyl details');
      // Before the offer is read again the card carries only its digital badge.
      expect(fragmentHtml(snapshot?.mainContent)).toContain('Digital out now');
      expect(fragmentHtml(snapshot?.mainContent)).not.toMatch(
        /Pre-order vinyl|Buy vinyl|preorder-action|Expected to ship|Vinyl available|unconfirmed/,
      );
      expect(cloned.shipping).toEqual({ textContent: '', hidden: true });
      expect(cloned.purchase.className).toBe('release-detail-link');
      expect(cloned.card.dataset.releaseRole).toBe('lead');
      expect(snapshot?.mainClassName).toBe('releases-page-layout');
    },
  );

  it('keeps the previous snapshot when a dialog temporarily hides page descendants', () => {
    const createElement = vi.fn();
    const cacheSnapshot = vi.fn();
    const targetDocument = {
      createElement,
      querySelector: () => ({ querySelectorAll: () => [{}] }),
    } as unknown as Document;
    expect(
      cacheDocumentShellPageSnapshot({
        targetDocument,
        href: 'https://example.test/store/',
        currentHref: 'https://example.test/store/',
        shellPageCache: { cacheSnapshot },
      }),
    ).toBeNull();
    expect(createElement).not.toHaveBeenCalled();
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
        if (selector === '[data-store-coverflow-disclosure-rail]') return disclosureRail;
        return null;
      },
      querySelectorAll(selector: string) {
        if (selector.includes('[data-store-coverflow-next]')) return [previousButton, nextButton, toggle];
        return [];
      },
    };
    const disclosureRail = {
      style: {
        removeProperty: (name: string) => styleProperties.delete(name),
      },
    };
    const card = {
      dataset: { storeCoverflowInitialPosition: 'active', storeCoverflowPosition: 'right-near' },
      removeAttribute: (name: string) => removed.add(name),
    };
    const nativeButton = { disabled: false };
    const controls = { hidden: false, querySelectorAll: () => [nativeButton] };
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
    expect(controls.hidden).toBe(false);
    expect(nativeButton.disabled).toBe(true);
    expect(toggle.textContent).toBe('Show Coverflow');
    expect(toggleAriaPressed).toBe('true');
    expect(status.textContent).toBe('');
    expect(status.hidden).toBe(true);
    expect(currentValue.textContent).toBe('1');
    expect(remainingValue.textContent).toBe('52');
    expect(summary.textContent).toBe("You're viewing 1 of 53.");
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
    expect(fragmentHtml(snapshot?.mainContent)).toContain('Catalog');
    // Store targets retain server chrome; Artists and Services still clear their React-only targets.
    expect(fragmentHtml(snapshot?.mainContent)).not.toContain('hydrated filters');
    expect(fragmentHtml(snapshot?.mainContent)).toContain('value="vinyl"');
    expect(fragmentHtml(snapshot?.mainContent)).not.toContain('data-distro-search-hidden');
    expect(fragmentHtml(snapshot?.mainContent)).toContain('<a hidden>Item</a>');
    expect(fragmentHtml(snapshot?.mainContent)).toContain('data-store-listing-price-state="loading"');
    expect(fragmentHtml(snapshot?.mainContent)).toContain('Checking price');
    expect(fragmentHtml(snapshot?.mainContent)).not.toContain('€28.00');
    expect(fragmentHtml(snapshot?.mainContent)).toContain('data-store-listing-availability-state="pending"');
    expect(fragmentHtml(snapshot?.mainContent)).toContain('Checking availability');
    expect(fragmentHtml(snapshot?.mainContent)).not.toContain('Sold Out');
    expect(fragmentHtml(snapshot?.mainContent)).not.toMatch(/<span[^>]*data-store-listing-availability[^>]*\shidden/);
    expect(fragmentHtml(snapshot?.mainContent)).toContain('data-store-preview-image');
    expect(fragmentHtml(snapshot?.mainContent)).not.toContain('data-store-preview-ready');
    expect(fragmentHtml(snapshot?.mainContent)).toContain(
      '<button data-copy-value="info@example.test"></button><span role="status" data-copy-status></span>',
    );
  });

  it('re-creates cloned form controls from their markup so typed values are not cached', () => {
    // A control placed directly in main has the fragment as parent, where the outerHTML setter throws.
    const reparsed = { tag: 'reparsed control' };
    const parsedMarkup: string[] = [];
    const replaced: unknown[] = [];
    const control = {
      get outerHTML() {
        return '<input name="email" value="">';
      },
      set outerHTML(_value: string) {
        throw new Error('the outerHTML setter throws for a fragment child');
      },
      ownerDocument: {
        createElement: (tagName: string) => {
          expect(tagName).toBe('template');
          return {
            content: reparsed,
            set innerHTML(value: string) {
              parsedMarkup.push(value);
            },
          };
        },
      },
      replaceWith: (node: unknown) => replaced.push(node),
    };
    const controlQuery = vi
      .spyOn(FakeFragment.prototype, 'querySelectorAll')
      .mockImplementation(((selector: string) => (selector === 'input, select, textarea' ? [control] : [])) as never);

    try {
      readDocumentShellPageSnapshot(
        createSnapshotDocument(),
        'https://example.test/blackbox-records/store/distro/',
        'https://example.test/blackbox-records/',
      );
    } finally {
      controlQuery.mockRestore();
    }

    expect(parsedMarkup).toEqual(['<input name="email" value="">']);
    expect(replaced).toEqual([reparsed]);
  });

  it('restores island server markup and the ssr marker so a cached island hydrates again', () => {
    const liveIsland = { innerHTML: '<input>' };
    const cloneIsland = { innerHTML: '', querySelectorAll: () => [], setAttribute: vi.fn() };
    const selectIslands = (islands: object[]) => (selector: string) => (selector === 'astro-island' ? islands : []);
    const main = { getAttribute: () => null, querySelectorAll: selectIslands([liveIsland]) };
    const clone = {
      get childNodes() {
        return [{ html: `<astro-island>${cloneIsland.innerHTML}</astro-island>` }];
      },
      ownerDocument: fakeInertDocument,
      querySelectorAll: selectIslands([cloneIsland]),
    };
    const targetDocument = {
      createElement: () => ({
        content: {
          ownerDocument: {
            importNode: () => {
              cloneIsland.innerHTML = liveIsland.innerHTML;
              return clone;
            },
          },
        },
      }),
      querySelector: (selector: string) => (selector === 'main[data-app-shell-main]' ? main : null),
      title: 'About',
    } as unknown as Document;
    const about = 'https://example.test/blackbox-records/about/';
    const read = () => readDocumentShellPageSnapshot(targetDocument, about, about);

    read();
    liveIsland.innerHTML = '<input value="typed">';

    expect(fragmentHtml(read()?.mainContent)).toBe('<astro-island><input></astro-island>');
    expect(cloneIsland.setAttribute).toHaveBeenCalledWith('ssr', '');
  });

  it('keeps noscript content in restored island markup as text, as the live page has it', () => {
    const noscript = { innerHTML: '<img src="/fallback.jpg">', textContent: '' };
    const liveIsland = { innerHTML: '<noscript><img src="/fallback.jpg"></noscript>' };
    const cloneIsland = {
      innerHTML: '',
      querySelectorAll: (selector: string) => (selector === 'noscript' ? [noscript] : []),
      setAttribute: vi.fn(),
    };
    const selectIslands = (islands: object[]) => (selector: string) => (selector === 'astro-island' ? islands : []);
    const main = { getAttribute: () => null, querySelectorAll: selectIslands([liveIsland]) };
    const clone = { childNodes: [], ownerDocument: fakeInertDocument, querySelectorAll: selectIslands([cloneIsland]) };
    const targetDocument = {
      createElement: () => ({ content: { ownerDocument: { importNode: () => clone } } }),
      querySelector: (selector: string) => (selector === 'main[data-app-shell-main]' ? main : null),
      title: 'About',
    } as unknown as Document;
    const about = 'https://example.test/blackbox-records/about/';

    readDocumentShellPageSnapshot(targetDocument, about, about);

    expect(cloneIsland.innerHTML).toBe('<noscript><img src="/fallback.jpg"></noscript>');
    expect(noscript.textContent).toBe('<img src="/fallback.jpg">');
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
        mainContent: fakeFragment(''),
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
        mainContent: fakeFragment('<section>Artists</section>'),
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

  it('applies a fresh clone of the cached fragment on every return', () => {
    const main = new FakeElement();
    const mainContent = fakeFragment('<section>Store</section>');
    const pageSnapshot = {
      canonicalHref: '',
      href: 'https://example.test/blackbox-records/store/',
      mainClassName: 'store-page',
      mainContent,
      pageDescription: '',
      pathname: '/store/',
      title: '',
    };
    const apply = () =>
      applyDocumentShellPageSnapshot({
        getMainElement: () => main as unknown as HTMLElement,
        pageSnapshot,
        targetDocument: { head: { querySelector: () => null }, title: '' } as unknown as Document,
      });

    expect(apply()).toBe(true);
    expect(apply()).toBe(true);

    expect(main.insertedNodes).toHaveLength(2);
    expect(main.insertedNodes[0]).not.toBe(mainContent);
    expect(main.insertedNodes[1]).not.toBe(main.insertedNodes[0]);
    expect(main.innerHTML).toBe('<section>Store</section>');
    expect(fragmentHtml(mainContent)).toBe('<section>Store</section>');
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
        mainContent: fakeFragment('<section>Artists</section>'),
        pageDescription: 'Artists',
        pathname: '/artists/',
        title: 'Artists | BlackBox',
      },
    });

    expect(applied).toBe(false);
  });

  it('reads a fetched page in place: no clone, no serialization, no second parse', () => {
    const forbidden = (operation: string) => () => {
      throw new Error(`parsed snapshot must not ${operation}`);
    };
    const fragment = new FakeFragment();
    const children = [{ html: '<section data-store-search-active>Store</section>' }, { html: '<img loading="eager">' }];
    const sanitized: string[] = [];
    const main = {
      get childNodes() {
        return children;
      },
      getAttribute: (name: string) => (name === 'class' ? 'store-page' : null),
      get innerHTML() {
        return forbidden('serialize main')();
      },
      ownerDocument: { createDocumentFragment: () => fragment },
      querySelectorAll(selector: string) {
        if (selector === '[data-store-search-active]') {
          return [{ removeAttribute: (name: string) => sanitized.push(name) }];
        }
        return [];
      },
    };
    const canonical = { href: 'https://example.test/blackbox-records/store/' };
    const parsedDocument = {
      createElement: forbidden('create elements'),
      importNode: forbidden('clone main'),
      querySelector(selector: string) {
        if (selector === 'main[data-app-shell-main]') return main;
        if (selector === 'link[rel="canonical"]') return canonical;
        return null;
      },
      replaceChildren: vi.fn(),
      title: 'Store | BlackBox',
    };

    const snapshot = readParsedShellPageSnapshot(
      parsedDocument as unknown as Document,
      'https://example.test/blackbox-records/store/',
      'https://example.test/blackbox-records/',
    );

    expect(snapshot).toMatchObject({
      canonicalHref: 'https://example.test/blackbox-records/store/',
      mainClassName: 'store-page',
      pathname: '/store/',
      title: 'Store | BlackBox',
    });
    expect(snapshot?.mainContent).toBe(fragment);
    expect(fragment.nodes).toEqual(children);
    expect(sanitized).toEqual(['data-store-search-active']);
    // The rest of the fetched page is released once main has moved into the snapshot.
    expect(parsedDocument.replaceChildren).toHaveBeenCalledWith();
  });

  it('keeps parsed scripts inert and noscript content as text, as innerHTML did', () => {
    const replaced: unknown[][] = [];
    const reparsed = { tag: 'reparsed script' };
    const script = {
      outerHTML: '<script>window.ran = true</script>',
      ownerDocument: {
        createElement: () => ({
          childNodes: [reparsed],
          set innerHTML(value: string) {
            expect(value).toBe('<script>window.ran = true</script>');
          },
        }),
      },
      replaceWith: (...nodes: unknown[]) => replaced.push(nodes),
    };
    const noscript = { innerHTML: '<img src="/fallback.jpg">', textContent: '' };
    const main = {
      childNodes: [],
      getAttribute: () => null,
      ownerDocument: { createDocumentFragment: () => new FakeFragment() },
      querySelectorAll(selector: string) {
        if (selector === 'script') return [script];
        if (selector === 'noscript') return [noscript];
        return [];
      },
    };
    const parsedDocument = {
      querySelector: (selector: string) => (selector === 'main[data-app-shell-main]' ? main : null),
      replaceChildren: vi.fn(),
      title: 'Home',
    } as unknown as Document;

    readParsedShellPageSnapshot(parsedDocument, 'https://example.test/', 'https://example.test/');

    expect(replaced).toEqual([[reparsed]]);
    expect(noscript.textContent).toBe('<img src="/fallback.jpg">');
  });

  it('does not read a parsed page whose main is masked by a dialog', () => {
    const parsedDocument = {
      querySelector: () => ({ querySelectorAll: () => [{}] }),
      replaceChildren: vi.fn(),
    } as unknown as Document;

    expect(readParsedShellPageSnapshot(parsedDocument, 'https://example.test/', 'https://example.test/')).toBeNull();
  });

  it('records island markup without reading a full snapshot', () => {
    const island = { innerHTML: '<button>server</button>' };
    const main = { querySelectorAll: vi.fn(() => [island]) };
    const targetDocument = {
      querySelector: vi.fn((selector: string) => (selector === 'main[data-app-shell-main]' ? main : null)),
    } as unknown as Document;

    rememberDocumentIslandServerMarkup(targetDocument);

    expect(main.querySelectorAll).toHaveBeenCalledTimes(1);
    expect(main.querySelectorAll).toHaveBeenCalledWith('astro-island');
  });

  it('schedules idle work with a timeout and cancels it', () => {
    const task = vi.fn();
    const scheduler = {
      cancelIdleCallback: vi.fn(),
      clearTimeout: vi.fn(),
      requestIdleCallback: vi.fn(() => 42),
      setTimeout: vi.fn(),
    };

    const cancel = scheduleIdleShellTask(task, scheduler as unknown as Window);
    expect(scheduler.requestIdleCallback).toHaveBeenCalledWith(task, { timeout: SHELL_IDLE_SNAPSHOT_TIMEOUT_MS });
    expect(scheduler.setTimeout).not.toHaveBeenCalled();

    cancel();
    expect(scheduler.cancelIdleCallback).toHaveBeenCalledWith(42);
  });

  it('falls back to a timer where requestIdleCallback is missing', () => {
    const task = vi.fn();
    const scheduler = {
      clearTimeout: vi.fn(),
      setTimeout: vi.fn(() => 7),
    };

    const cancel = scheduleIdleShellTask(task, scheduler as unknown as Window);
    expect(scheduler.setTimeout).toHaveBeenCalledWith(task, expect.any(Number));

    cancel();
    expect(scheduler.clearTimeout).toHaveBeenCalledWith(7);
  });
});
