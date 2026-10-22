import { describe, expect, it } from 'vitest';

import { createMusicPageMetadata } from './_metadata';

describe('music page metadata', () => {
  it('distinguishes the same live-album title by its published artist', () => {
    const titles = ['Russian Circles', 'Pelican'].map(
      (artist) =>
        createMusicPageMetadata({ title: 'Live at Dunk! Fest 2016', artist, format: 'Vinyl', intent: 'store' }).title,
    );
    expect(new Set(titles).size).toBe(2);
    expect(titles[0]).toBe('Russian Circles — Live at Dunk! Fest 2016 (Vinyl) | Store');
  });

  it('distinguishes the CD and vinyl editions without changing names', () => {
    const titles = ['CD', 'Vinyl'].map(
      (format) =>
        createMusicPageMetadata({ title: 'ATATOA', artist: 'From Another Mother', format, intent: 'store' }).title,
    );
    expect(new Set(titles).size).toBe(2);
    expect(titles).toEqual([
      'From Another Mother — ATATOA (CD) | Store',
      'From Another Mother — ATATOA (Vinyl) | Store',
    ]);
  });

  it('distinguishes release information from shopping and omits an unknown format', () => {
    const facts = { title: 'Disintegration', artist: 'Afterwise' };
    const release = createMusicPageMetadata({ ...facts, intent: 'release' });
    const store = createMusicPageMetadata({ ...facts, format: null, intent: 'store' });
    expect(release.description).toContain('release information and artist details');
    expect(store.description).toContain("this edition's price, availability and purchase details");
    expect(store.description).not.toBe(release.description);
    expect(store.title).toBe('Afterwise — Disintegration | Store');
  });

  it('preserves full accepted names without automatic character truncation', () => {
    const title = 'Full published album title '.repeat(20);
    const metadata = createMusicPageMetadata({ title, artist: 'Artist', intent: 'store' });
    expect(metadata.title).toContain(title);
    expect(metadata.description).toContain(title);
  });

  it('retains the published editorial opening and excludes later credit paragraphs', () => {
    const facts = {
      title: 'Disintegration',
      artist: 'Afterwise',
      summary:
        "Afterwise's six-track debut blends instrumental post-rock with post-metal. Recorded and mixed at BlackBox Studio.\n\nArtwork and layout by the credited artist.",
    };
    const store = createMusicPageMetadata({ ...facts, format: 'Black Vinyl LP', intent: 'store' });
    const release = createMusicPageMetadata({ ...facts, intent: 'release' });
    for (const metadata of [store, release]) {
      expect(metadata.description).toContain(
        "Afterwise's six-track debut blends instrumental post-rock with post-metal.",
      );
      expect(metadata.description).not.toContain('Recorded');
      expect(metadata.description).not.toContain('Artwork');
    }
    expect(store.description).not.toEqual(release.description);
    expect(store.description).toContain('Black Vinyl LP');
  });

  it.each([
    'BBR#001\n\nReleased March 13, 2026\n\nRecorded live at Ignite Music Studio. '.repeat(20),
    'Recorded, mixed, and mastered by the credited producer. '.repeat(20),
    '   ',
  ])('uses factual identity when a summary has only credits or no text', (summary) => {
    const metadata = createMusicPageMetadata({ title: 'Caregivers', artist: 'Chronoboros', summary, intent: 'store' });
    expect(metadata.description).toBe(
      "Shop Chronoboros — Caregivers at BlackBox Records. View this edition's price, availability and purchase details.",
    );
  });
});
