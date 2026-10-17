import { describe, expect, it } from 'vitest';
import { publicTitleClass } from './utils';

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
