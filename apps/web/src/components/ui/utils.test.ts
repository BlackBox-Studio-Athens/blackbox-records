import { describe, expect, it } from 'vitest';
import { displayUppercase, publicTitleClass, publicTitleLang } from './utils';

describe('publicTitleClass', () => {
  it.each(['Ατελές το ον', 'Ατοπια', 'Blues & Ντέρτια', 'Ἄτοπος', 'Ντέρτια'])(
    'uses Inter for the whole Greek title %s',
    (title) => {
      expect(publicTitleClass(title)).toBe('public-title--greek');
    },
  );

  it.each(['Disintegration', 'Café', '123 & !', ''])('keeps the existing face for %s', (title) => {
    expect(publicTitleClass(title)).toBeUndefined();
  });
});

describe('Greek uppercase titles', () => {
  it('marks only Greek titles as Greek', () => {
    expect(publicTitleLang('200 χρόνια προτεκτοράτο')).toBe('el');
    expect(publicTitleLang('Resurrection')).toBeUndefined();
  });

  it.each([
    ['200 χρόνια προτεκτοράτο', '200 ΧΡΟΝΙΑ ΠΡΟΤΕΚΤΟΡΑΤΟ'],
    ['Ταΐζω άυλο', 'ΤΑΪΖΩ ΑΫΛΟ'],
    ['Café Blues', 'CAFÉ BLUES'],
  ])('uppercases %s without Greek accents', (title, expected) => {
    expect(displayUppercase(title)).toBe(expected);
  });
});
