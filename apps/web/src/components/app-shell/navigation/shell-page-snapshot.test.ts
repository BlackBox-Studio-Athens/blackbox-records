import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  applyDocumentShellPageSnapshot,
  cacheDocumentShellPageSnapshot,
  readDocumentShellPageSnapshot,
  sanitizeDistroCoverflowSnapshot,
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
    return [];
  }
}

function createSnapshotDocument() {
  const main = new FakeElement(
    { class: 'catalog-page' },
    '<section>Catalog</section><div data-artists-roster-filters>hydrated filters</div><div data-distro-search><input value="vinyl"></div><a hidden data-distro-search-hidden>Item</a>',
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
    const group = {
      dataset: { distroCoverflowMode: 'catalog' },
      removeAttribute: (name: string) => removed.add(name),
    };
    const card = {
      dataset: { distroCoverflowInitialPosition: 'active', distroCoverflowPosition: 'right-near' },
      removeAttribute: (name: string) => removed.add(name),
    };
    const controls = { hidden: false };
    const previousButton = { removeAttribute: (name: string) => removed.add(name) };
    const nextButton = { removeAttribute: (name: string) => removed.add(name) };
    const toggle = {
      dataset: { distroCoverflowViewAllLabel: 'View all 53' },
      removeAttribute: (name: string) => removed.add(name),
      textContent: 'Show Coverflow',
    };
    const status = {
      dataset: { distroCoverflowInitialLabel: 'Barren Point — Bonebrokk' },
      hidden: true,
      textContent: '',
    };
    const root = {
      querySelectorAll(selector: string) {
        if (selector === '[data-distro-coverflow-group]') return [group];
        if (selector === '[data-distro-coverflow-card]') return [card];
        if (selector === '[data-distro-coverflow-controls]') return [controls];
        if (selector.includes('[data-distro-coverflow-next]')) return [previousButton, nextButton, toggle];
        if (selector === '[data-distro-coverflow-toggle]') return [toggle];
        if (selector === '[data-distro-coverflow-status]') return [status];
        return [];
      },
    } as unknown as ParentNode;

    sanitizeDistroCoverflowSnapshot(root);

    expect(removed).toEqual(
      new Set([
        'data-distro-coverflow-ready',
        'data-distro-coverflow-reveal',
        'data-distro-coverflow-transitioning',
        'data-distro-coverflow-selected',
        'aria-disabled',
      ]),
    );
    expect(group.dataset.distroCoverflowMode).toBe('preview');
    expect(card.dataset.distroCoverflowPosition).toBe('active');
    expect(controls.hidden).toBe(false);
    expect(toggle.textContent).toBe('View all 53');
    expect(status.textContent).toBe('Barren Point — Bonebrokk');
    expect(status.hidden).toBe(false);
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
