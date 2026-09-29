import { describe, expect, it, vi } from 'vitest';

import type { PlayerProvider } from './player-provider-data';
import { warmPlayerProviderOrigins } from './player-provider-warmup';

function createHeadLinkDocument(existingLinks = new Set<string>()) {
  const appendedLinks: HTMLLinkElement[] = [];

  return {
    appendedLinks,
    createElement: vi.fn((tagName: string) => {
      expect(tagName).toBe('link');
      return {
        crossOrigin: '',
        href: '',
        rel: '',
      } as HTMLLinkElement;
    }),
    head: {
      appendChild: vi.fn((linkElement: HTMLLinkElement) => {
        appendedLinks.push(linkElement);
        return linkElement;
      }),
      querySelector: vi.fn((selector: string) => (existingLinks.has(selector) ? ({} as HTMLLinkElement) : null)),
    },
  } as unknown as {
    appendedLinks: HTMLLinkElement[];
    createElement: Document['createElement'];
    head: Pick<HTMLHeadElement, 'appendChild' | 'querySelector'>;
  };
}

const bandcampProvider: PlayerProvider = {
  embedLayout: 'bandcamp-album',
  embedUrl: 'https://bandcamp.test/embed',
  id: 'bandcamp',
};

const tidalProvider: PlayerProvider = {
  embedLayout: 'tidal',
  embedUrl: 'https://tidal.test/embed',
  id: 'tidal',
};

describe('warmPlayerProviderOrigins', () => {
  it('adds preconnect and DNS prefetch links for provider origins', () => {
    const targetDocument = createHeadLinkDocument();
    const warmedOrigins = new Set<string>();

    warmPlayerProviderOrigins({
      providers: [bandcampProvider, tidalProvider],
      targetDocument,
      warmedOrigins,
    });

    expect(targetDocument.appendedLinks).toMatchObject([
      { crossOrigin: 'anonymous', href: 'https://bandcamp.com', rel: 'preconnect' },
      { crossOrigin: '', href: 'https://bandcamp.com', rel: 'dns-prefetch' },
      { crossOrigin: 'anonymous', href: 'https://embed.tidal.com', rel: 'preconnect' },
      { crossOrigin: '', href: 'https://embed.tidal.com', rel: 'dns-prefetch' },
      { crossOrigin: 'anonymous', href: 'https://tidal.com', rel: 'preconnect' },
      { crossOrigin: '', href: 'https://tidal.com', rel: 'dns-prefetch' },
    ]);
    expect([...warmedOrigins]).toEqual(['https://bandcamp.com', 'https://embed.tidal.com', 'https://tidal.com']);
  });

  it('does not append links for origins already warmed in this session', () => {
    const targetDocument = createHeadLinkDocument();
    const warmedOrigins = new Set(['https://bandcamp.com']);

    warmPlayerProviderOrigins({
      providers: [bandcampProvider],
      targetDocument,
      warmedOrigins,
    });

    expect(targetDocument.head.appendChild).not.toHaveBeenCalled();
    expect([...warmedOrigins]).toEqual(['https://bandcamp.com']);
  });

  it('does not append duplicate document links that already exist', () => {
    const targetDocument = createHeadLinkDocument(new Set(['link[rel="preconnect"][href="https://bandcamp.com"]']));
    const warmedOrigins = new Set<string>();

    warmPlayerProviderOrigins({
      providers: [bandcampProvider],
      targetDocument,
      warmedOrigins,
    });

    expect(targetDocument.appendedLinks).toMatchObject([
      { crossOrigin: '', href: 'https://bandcamp.com', rel: 'dns-prefetch' },
    ]);
    expect(warmedOrigins.has('https://bandcamp.com')).toBe(true);
  });

  it('does not throw when the document has no head', () => {
    const targetDocument = {
      createElement: vi.fn(),
      head: null,
    };
    const warmedOrigins = new Set<string>();

    warmPlayerProviderOrigins({
      providers: [bandcampProvider],
      targetDocument,
      warmedOrigins,
    });

    expect(targetDocument.createElement).not.toHaveBeenCalled();
    expect(warmedOrigins.has('https://bandcamp.com')).toBe(true);
  });
});
