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
  sanitizeStoreCrateSnapshot,
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
          getAttribute: () => null,
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
      const isAvailabilityHidden = () =>
        /<span[^>]*data-store-listing-availability[^>]*\shidden(?=[\s>])/.test(this.innerHTML);
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
          get hidden() {
            return isAvailabilityHidden();
          },
          set hidden(value: boolean) {
            setAvailabilityHidden(value);
          },
          set textContent(value: string) {
            replaceInnerHtml(/(<span[^>]*data-store-listing-availability[^>]*>)[\s\S]*?(<\/span>)/, `$1${value}$2`);
          },
          getAttribute: () => null,
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
  function metadataDocument(
    tags: Array<{ tag: 'meta' | 'script'; attributes: Record<string, string>; text?: string }>,
  ) {
    const source = createSnapshotDocument();
    const createElement = source.createElement.bind(source);
    type MetadataElement = {
      localName: string;
      attributes: Record<string, string>;
      textContent: string;
      hasAttribute: (name: string) => boolean;
      getAttribute: (name: string) => string | null;
      setAttribute: (name: string, value: string) => void;
      remove: () => void;
    };
    const elements: MetadataElement[] = [];
    const element = (tag: string, attributes: Record<string, string> = {}, text = ''): MetadataElement => ({
      localName: tag,
      attributes: { ...attributes },
      textContent: text,
      hasAttribute(name) {
        return name in this.attributes;
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      remove() {
        elements.splice(elements.indexOf(this), 1);
      },
    });
    elements.push(...tags.map(({ tag, attributes, text }) => element(tag, attributes, text)));
    const matches = (node: MetadataElement) =>
      node.localName === 'script'
        ? node.attributes.type === 'application/ld+json'
        : node.attributes.property?.startsWith('og:') ||
          node.attributes.property?.startsWith('article:') ||
          node.attributes.name?.startsWith('twitter:') ||
          node.attributes.name === 'robots';
    Object.assign(source, {
      head: {
        querySelectorAll: (selector: string) => (selector.startsWith('meta[') ? elements.filter(matches) : []),
        querySelector: () => null,
        append: (node: MetadataElement) => elements.push(node),
      },
      createElement: (tag: string) => (tag === 'template' ? createElement(tag) : element(tag)),
    });
    return { document: source, elements };
  }

  it('replaces product-page social metadata with destination metadata on cached returns', () => {
    const destinationTags = [
      { tag: 'meta' as const, attributes: { property: 'og:title', content: 'About the label' } },
      { tag: 'meta' as const, attributes: { property: 'og:url', content: 'https://example.test/about/' } },
      { tag: 'meta' as const, attributes: { name: 'twitter:title', content: 'About the label' } },
      { tag: 'meta' as const, attributes: { name: 'twitter:image', content: 'https://example.test/card.jpg' } },
      {
        tag: 'script' as const,
        attributes: { type: 'application/ld+json', id: 'page-entity' },
        text: '{"@type":"Organization","name":"BlackBox"}',
      },
    ];
    const destination = metadataDocument(destinationTags);
    const snapshot = readDocumentShellPageSnapshot(
      destination.document,
      'https://example.test/about/',
      'https://example.test/store/item/',
    );
    expect(snapshot).not.toBeNull();
    const current = metadataDocument([
      { tag: 'meta', attributes: { property: 'og:title', content: 'Disintegration' } },
      { tag: 'meta', attributes: { property: 'og:title', content: 'Duplicate stale title' } },
      { tag: 'meta', attributes: { property: 'article:published_time', content: '2026-10-22' } },
      { tag: 'meta', attributes: { name: 'robots', content: 'noindex' } },
      { tag: 'script', attributes: { type: 'application/ld+json' }, text: '{"@type":"MusicAlbum"}' },
      { tag: 'script', attributes: { type: 'application/json', id: 'purchase-information' }, text: '{"policy":true}' },
    ]);
    const purchaseInformation = current.elements.at(-1);
    for (let visit = 0; visit < 2; visit++) {
      updateDocumentMetadata(snapshot!, current.document);
      expect(
        current.elements
          .filter((node) => node !== purchaseInformation)
          .map((node) => ({ tag: node.localName, attributes: node.attributes, text: node.textContent })),
      ).toEqual(destinationTags.map((tag) => ({ ...tag, text: tag.text ?? '' })));
      expect(current.elements).toContain(purchaseInformation);
    }
    // A later mutation of the source document cannot change the reusable snapshot.
    destination.elements[0]!.attributes.content = 'Changed after capture';
    updateDocumentMetadata(snapshot!, current.document);
    expect(current.elements.find((node) => node.attributes.property === 'og:title')?.attributes.content).toBe(
      'About the label',
    );
  });

  it('captures fetched head metadata before releasing its parsed document and leaves runtime Product in main', () => {
    const source = metadataDocument([
      { tag: 'script', attributes: { type: 'application/ld+json' }, text: '{"@type":"BreadcrumbList"}' },
      { tag: 'meta', attributes: { property: 'og:type', content: 'article' } },
    ]);
    const main = source.document.querySelector('main[data-app-shell-main]')!;
    main.innerHTML = '<script type="application/ld+json">{"@type":"Product"}</script>';
    Object.assign(source.document, { replaceChildren: vi.fn() });
    const snapshot = readParsedShellPageSnapshot(
      source.document,
      'https://example.test/news/story/',
      'https://example.test/',
    );
    expect(snapshot?.headMetadata).toEqual([
      { tag: 'script', attributes: [['type', 'application/ld+json']], text: '{"@type":"BreadcrumbList"}' },
      {
        tag: 'meta',
        attributes: [
          ['property', 'og:type'],
          ['content', 'article'],
        ],
        text: '',
      },
    ]);
    expect(source.document.replaceChildren).toHaveBeenCalledOnce();
    expect(JSON.stringify(snapshot?.headMetadata)).not.toContain('Product');
    expect(fragmentHtml(snapshot?.mainContent)).toContain('Product');
  });

  it.each([
    ['Pre-order vinyl', false],
    ['Buy vinyl', false],
    ['Buy vinyl', true],
  ] as const)(
    'restores the rendered state of an enriched %s snapshot (projected pre-order: %s) without changing the live cards or layout',
    (actionName, projected) => {
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
        const price = { textContent: actionName === 'Pre-order vinyl' ? '€28.00' : '€25.00', hidden: false };
        const terms = { hidden: actionName !== 'Pre-order vinyl' };
        const status = { textContent: '', hidden: true, dataset: {} };
        const slot = { hidden: false };
        const fields = {
          '[data-release-purchase]': purchase,
          '[data-release-shipping]': shipping,
          '[data-release-price]': price,
          '[data-release-terms]': terms,
          '[data-release-status]': status,
          '[data-release-purchase-slot]': slot,
        };
        const card = {
          dataset: {
            releaseId: 'release',
            releaseRole: 'lead',
            releasePhysicalFormat: 'vinyl',
            releaseStoreSlug: 'edition',
            releaseSourceOrder: '0',
            ...(projected
              ? {
                  releaseProjected: JSON.stringify({
                    storeItemSlug: 'edition',
                    displayPrice: '€28.00',
                    shipEstimate: null,
                  }),
                }
              : {}),
          },
          ownerDocument: { createElement: () => ({ textContent: '', className: '' }) },
          querySelector: (selector: string) => fields[selector as keyof typeof fields] ?? null,
        };
        return { card, purchase, shipping, price, terms, status, slot };
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
                price: model.price,
                terms: model.terms,
                status: model.status,
                slot: model.slot,
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
      expect(cloned.card.dataset.releaseRole).toBe('lead');
      expect(snapshot?.mainClassName).toBe('releases-page-layout');
      if (projected) {
        // The HTML rendered the projected pre-order; the browser's Buy enrichment is not carried into the snapshot.
        expect(fragmentHtml(snapshot?.mainContent)).toContain('Pre-order vinyl');
        expect(fragmentHtml(snapshot?.mainContent)).not.toMatch(/Buy vinyl|Vinyl available|€25\.00/);
        expect(cloned.purchase.className).toContain('preorder-action');
        expect(cloned.price).toEqual({ textContent: '€28.00', hidden: false });
        expect(cloned.terms.hidden).toBe(false);
        return;
      }
      expect(fragmentHtml(snapshot?.mainContent)).not.toMatch(/View details|Digital out now|In stock/);
      expect(cloned.purchase).toHaveProperty('hidden', true);
      expect(cloned.slot.hidden).toBe(true);
      expect(cloned.status.hidden).toBe(true);
      expect(fragmentHtml(snapshot?.mainContent)).not.toMatch(
        /Pre-order vinyl|Buy vinyl|preorder-action|Expected to ship|Vinyl available|unconfirmed|€/,
      );
      expect(cloned.shipping).toEqual({ textContent: '', hidden: true });
      // Prices and the pre-order terms wait for the fresh offer read, like the actions they sit beside.
      expect(cloned.price).toEqual({ textContent: '', hidden: true });
      expect(cloned.terms.hidden).toBe(true);
      expect(live.price.hidden).toBe(false);
      expect(cloned.purchase.className).toBe('');
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

  it('returns a cached Store Crate to its complete Grid and All formats', () => {
    const removed = new Set<string>();
    const element = <Extra extends object>(extra: Extra = {} as Extra) => ({
      hidden: false,
      textContent: 'kept',
      removeAttribute: (name: string) => removed.add(name),
      ...extra,
    });
    const pressed = new Map<string, string>();
    const button = (name: string) =>
      element({
        disabled: false,
        hasAttribute: (attribute: string) => attribute === name,
        setAttribute: (attribute: string, value: string) => {
          if (attribute === 'aria-pressed') pressed.set(name, value);
        },
      });
    const gridButton = button('data-store-crate-grid');
    const openButton = button('data-store-crate-open');
    const choice = button('data-store-crate-bin-choice');
    const desk = element();
    const nav = element();
    const end = element();
    const replaced: string[] = [];
    const stage = element({ replaceChildren: () => replaced.push('stage') });
    const rail = element({ replaceChildren: () => replaced.push('rail') });
    const status = element();
    const counter = element();
    const hand = element();
    const crate = element({
      dataset: { storeCrate: 'open' } as Record<string, string>,
      querySelectorAll(selector: string) {
        if (selector === '[data-store-crate-grid], [data-store-crate-open]') return [gridButton, openButton];
        if (selector === '[data-store-crate-bin-choice]') return [choice];
        if (selector === '[data-store-crate-desk], [data-store-crate-nav], [data-store-crate-end]')
          return [desk, nav, end];
        if (selector === '[data-store-crate-stage]') return [stage];
        if (selector === '[data-store-crate-rail]') return [rail];
        if (selector === '[data-store-crate-status], [data-store-crate-counter]') return [status, counter];
        if (selector === '[data-store-crate-hand]') return [hand];
        return [];
      },
    });
    const selectedRoot = { removeAttribute: (name: string) => removed.add(name) };
    const currentSection = { removeAttribute: (name: string) => removed.add(name) };
    let allFormatLinkAriaCurrent: string | null = null;
    let allFormatLinkCurrent = false;
    let selectedFormatLinkAriaCurrent: string | null = 'true';
    let selectedFormatLinkCurrent = true;
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
      dataset: { distroFormatKey: 'distro-group-cds' },
      removeAttribute: (name: string) => {
        removed.add(name);
        if (name === 'aria-current') selectedFormatLinkAriaCurrent = null;
      },
      setAttribute: () => undefined,
      toggleAttribute: (_name: string, force: boolean) => {
        selectedFormatLinkCurrent = force;
      },
    };
    const root = {
      querySelectorAll(selector: string) {
        if (selector === '.store-crate[data-store-crate]') return [crate];
        if (selector === '[data-distro-selected-format]') return [selectedRoot];
        if (selector === '[data-distro-format-current]') return [currentSection, selectedFormatLink];
        if (selector === '[data-distro-format-link]') return [allFormatLink, selectedFormatLink];
        return [];
      },
    } as unknown as ParentNode;

    sanitizeStoreCrateSnapshot(root);

    expect(crate.dataset.storeCrate).toBe('grid');
    for (const name of [
      'data-store-crate-ready',
      'data-store-crate-switch',
      'data-store-crate-settled',
      'data-store-crate-hand',
      'style',
      'data-mechanic',
      'aria-label',
      'data-distro-selected-format',
      'data-distro-format-current',
    ]) {
      expect(removed.has(name)).toBe(true);
    }
    expect([gridButton.disabled, openButton.disabled]).toEqual([true, true]);
    expect(pressed.get('data-store-crate-grid')).toBe('true');
    expect(pressed.get('data-store-crate-open')).toBe('false');
    expect([desk.hidden, nav.hidden, end.hidden]).toEqual([true, true, true]);
    expect(replaced).toEqual(['stage', 'rail']);
    expect([status.textContent, counter.textContent]).toEqual(['', '']);
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
    const stylesheet = { localName: 'link', getAttribute: () => '/blackbox-records/_astro/StoreCollectionPage.css' };
    const devStyle = {
      localName: 'style',
      getAttribute: () => '/src/components/store/crate/crate.css',
      textContent: '.store-crate {}',
    };
    const parsedDocument = {
      createElement: forbidden('create elements'),
      head: {
        querySelectorAll: (selector: string) =>
          selector === 'link[rel="stylesheet"][href], style[data-vite-dev-id]' ? [stylesheet, devStyle] : [],
      },
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
      // Page-only CSS, such as the Store Crate's, which a page reached through the shell must link itself.
      stylesheets: [
        { href: 'https://example.test/blackbox-records/_astro/StoreCollectionPage.css' },
        { devId: '/src/components/store/crate/crate.css', css: '.store-crate {}' },
      ],
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
      head: { querySelectorAll: () => [] },
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
});
