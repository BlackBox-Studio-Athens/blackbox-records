import { describe, expect, it } from 'vitest';
import { getArtistLetter, planArtistRoster } from './artist-roster-index';

const names = [
  'Afterwise',
  'Amber',
  'Bora',
  'Chronoboros',
  'Delta',
  'Echo',
  'Fjord',
  'Gale',
  'Halo',
  'Iris',
  'Juno',
  'Kilo',
  'Lotus',
];
const plan = (list: string[]) => planArtistRoster(list, (name) => name);

describe('artist roster letter index', () => {
  it('groups and indexes a 13-artist roster', () => {
    const { grouped, entries, jumpLetters } = plan(names);

    expect(names).toHaveLength(13);
    expect(grouped).toBe(true);
    expect(entries.filter((entry) => entry.groupStart).map((entry) => entry.letter)).toEqual('ABCDEFGHIJKL'.split(''));
    expect(entries[0]).toMatchObject({ groupStart: true, anchorId: 'artist-roster-letter-a' });
    expect(entries[1]).toMatchObject({ groupStart: false, anchorId: null });
    expect(jumpLetters).toHaveLength(26);
    expect(jumpLetters.find((item) => item.letter === 'A')).toEqual({
      letter: 'A',
      enabled: true,
      anchorId: 'artist-roster-letter-a',
    });
    expect(jumpLetters.find((item) => item.letter === 'Z')).toEqual({ letter: 'Z', enabled: false, anchorId: null });
  });

  it('renders no index or grouping for a 12-artist roster', () => {
    const { grouped, entries, jumpLetters } = plan(names.slice(0, 12));

    expect(grouped).toBe(false);
    expect(jumpLetters).toEqual([]);
    expect(entries.every((entry) => !entry.groupStart && entry.anchorId === null)).toBe(true);
  });

  it('files non A-Z names under # and folds diacritics', () => {
    expect(getArtistLetter('Élan')).toBe('E');
    expect(getArtistLetter('65daysofstatic')).toBe('#');
    expect(getArtistLetter('Άλφα')).toBe('#');
    expect(plan([...names, '65 Days']).jumpLetters.at(-1)).toMatchObject({ letter: '#', enabled: true });
  });
});
