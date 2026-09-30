/** Rosters at or above this size get letter groups and an A-Z jump index. */
const artistLetterIndexMinimum = 13;

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type ArtistRosterEntry<T> = {
  artist: T;
  /** Two-digit roster number in A-Z order. */
  number: string;
  letter: string;
  /** First row of a letter group; only set when the roster is grouped. */
  groupStart: boolean;
  /** Anchor id, present on the first row of each letter. */
  anchorId: string | null;
};

type ArtistJumpLetter = { letter: string; enabled: boolean; anchorId: string | null };

export function getArtistLetter(name: string) {
  const first = name.trim().normalize('NFD').charAt(0).toUpperCase();
  return alphabet.includes(first) ? first : '#';
}

function getArtistLetterAnchorId(letter: string) {
  return `artist-roster-letter-${letter === '#' ? 'other' : letter.toLowerCase()}`;
}

/** `artists` must already be in A-Z order. */
export function planArtistRoster<T>(artists: T[], getName: (artist: T) => string) {
  const grouped = artists.length >= artistLetterIndexMinimum;
  const seen = new Set<string>();
  let previousLetter = '';

  const entries: ArtistRosterEntry<T>[] = artists.map((artist, index) => {
    const letter = getArtistLetter(getName(artist));
    const groupStart = grouped && letter !== previousLetter;
    const anchorId = grouped && !seen.has(letter) ? getArtistLetterAnchorId(letter) : null;
    previousLetter = letter;
    seen.add(letter);
    return { artist, number: String(index + 1).padStart(2, '0'), letter, groupStart, anchorId };
  });

  const jumpLetters: ArtistJumpLetter[] = grouped
    ? [...alphabet, ...(seen.has('#') ? ['#'] : [])].map((letter) => ({
        letter,
        enabled: seen.has(letter),
        anchorId: seen.has(letter) ? getArtistLetterAnchorId(letter) : null,
      }))
    : [];

  return { grouped, entries, jumpLetters };
}
