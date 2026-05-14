import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:config/client', () => ({
  base: '/blackbox-records/',
  site: 'https://blackbox-studio-athens.github.io',
}));

import {
  applyDocumentShellPageSnapshot,
  cacheDocumentShellPageSnapshot,
  readDocumentShellPageSnapshot,
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
    if (selector === '[data-artists-roster-filters]' && this.innerHTML.includes('data-artists-roster-filters')) {
      return [new FakeElement({}, 'filters')];
    }
    if (selector === '[data-services-inquiry-form]' && this.innerHTML.includes('data-services-inquiry-form')) {
      return [new FakeElement({}, 'form')];
    }
    return [];
  }
}

function createSnapshotDocument() {
  const main = new FakeElement(
    { class: 'catalog-page' },
    '<section>Catalog</section><div data-artists-roster-filters>hydrated filters</div>',
  );
  const canonical = new FakeElement();
  canonical.href = 'https://example.test/blackbox-records/releases/';
  const description = new FakeElement();
  description.content = 'Release archive';

  return {
    title: 'Releases | BlackBox',
    querySelector(selector: string) {
      if (selector === 'main[data-app-shell-main]') return main;
      if (selector === 'link[rel="canonical"]') return canonical;
      if (selector === 'meta[name="description"]') return description;
      return null;
    },
  } as unknown as Document;
}

describe('shell page snapshots', () => {
  it('reads the swappable main payload and route metadata', () => {
    const snapshot = readDocumentShellPageSnapshot(
      createSnapshotDocument(),
      'https://example.test/blackbox-records/releases/',
      'https://example.test/blackbox-records/',
    );

    expect(snapshot).toMatchObject({
      canonicalHref: 'https://example.test/blackbox-records/releases/',
      href: 'https://example.test/blackbox-records/releases/',
      mainClassName: 'catalog-page',
      pageDescription: 'Release archive',
      pathname: '/releases/',
      title: 'Releases | BlackBox',
    });
    expect(snapshot?.mainHtml).toContain('Catalog');
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
