import { describe, expect, it } from 'vitest';
import { artistPrintMaxima, getArtistPrintSlotSize, getArtistPrintTilt } from './artist-print';

describe('artist print slot size', () => {
  it('fits a square source by the shorter role maximum', () => {
    expect(getArtistPrintSlotSize({ width: 2000, height: 2000 }, artistPrintMaxima.preview)).toEqual({
      width: 340,
      height: 340,
    });
    expect(getArtistPrintSlotSize({ width: 1000, height: 1000 }, artistPrintMaxima.thumb)).toEqual({
      width: 54,
      height: 54,
    });
  });

  it('caps a landscape 1.5 source by width', () => {
    expect(getArtistPrintSlotSize({ width: 3000, height: 2000 }, artistPrintMaxima.preview)).toEqual({
      width: 340,
      height: 227,
    });
    expect(getArtistPrintSlotSize({ width: 3000, height: 2000 }, artistPrintMaxima.thumb)).toEqual({
      width: 72,
      height: 48,
    });
  });

  it('caps a portrait 0.667 source by height', () => {
    expect(getArtistPrintSlotSize({ width: 800, height: 1200 }, artistPrintMaxima.preview)).toEqual({
      width: 260,
      height: 390,
    });
    expect(getArtistPrintSlotSize({ width: 800, height: 1200 }, artistPrintMaxima.thumb)).toEqual({
      width: 36,
      height: 54,
    });
  });

  it('honours a custom maximum', () => {
    expect(getArtistPrintSlotSize({ width: 2000, height: 1000 }, { width: 300, height: 340 })).toEqual({
      width: 300,
      height: 150,
    });
  });
});

describe('artist print tilt', () => {
  it('cycles a fixed sequence per role', () => {
    expect(getArtistPrintTilt('preview', 0)).toBe(-2.6);
    expect(getArtistPrintTilt('preview', 6)).toBe(-2.6);
    expect(getArtistPrintTilt('detail', 1)).toBe(2.1);
    expect(getArtistPrintTilt('thumb', 4)).toBe(-3);
  });
});
