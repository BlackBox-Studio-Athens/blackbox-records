import english from 'i18n-iso-countries/langs/en.json';
import { z } from 'zod';

export type CountryCode = keyof typeof english.countries;
export const countryOptions = /* @__PURE__ */ (() =>
  Object.entries(english.countries)
    .map(([code, names]) => ({ code: code as CountryCode, name: Array.isArray(names) ? names[0]! : names }))
    .sort((left, right) => left.name.localeCompare(right.name)))();
const countryAliases = /* @__PURE__ */ (() => {
  const aliases = new Map<string, CountryCode>();
  for (const [code, names] of Object.entries(english.countries)) {
    for (const name of [code, ...(Array.isArray(names) ? names : [names])])
      aliases.set(name.toLowerCase(), code as CountryCode);
  }
  return aliases;
})();

// Keep the existing CMS text format at the storage boundary, with ISO identities in the editor.
export function parseArtistCountries(value: string): CountryCode[] | null {
  if (!value.trim()) return [];
  const codes = value.split('/').map((name) => countryAliases.get(name.trim().toLowerCase()));
  if (codes.some((code) => !code) || new Set(codes).size !== codes.length) return null;
  return codes as CountryCode[];
}

export function formatArtistCountries(codes: readonly CountryCode[]): string {
  return [...new Set(codes)].map((code) => countryOptions.find((option) => option.code === code)!.name).join(' / ');
}

export const artistCountriesSchema = z.string().refine((value) => parseArtistCountries(value) !== null, {
  message: 'Choose countries from the list without duplicates.',
});

export const artistLinkNames = [
  'Bandcamp',
  'Tidal',
  'Instagram',
  'Facebook',
  'YouTube',
  'SoundCloud',
  'Website',
] as const;
const artistLinkHosts: Partial<Record<(typeof artistLinkNames)[number], string[]>> = {
  Bandcamp: ['bandcamp.com'],
  Tidal: ['tidal.com'],
  Instagram: ['instagram.com'],
  Facebook: ['facebook.com'],
  YouTube: ['youtube.com', 'youtu.be'],
  SoundCloud: ['soundcloud.com'],
};
export function validArtistLink(label: string, value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      /(^|\.)spotify\.com$/.test(host) ||
      host === 'spotify.link'
    )
      return false;
    const hosts = artistLinkHosts[label as keyof typeof artistLinkHosts];
    return !hosts || hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

export const genreSuggestions = [
  'Ambient',
  'Alternative Rock',
  'Black Metal',
  'Doom Metal',
  'Drone',
  'Experimental',
  'Hardcore',
  'Indie Rock',
  'Instrumental Rock',
  'Math Rock',
  'Noise Rock',
  'Post Metal',
  'Post Rock',
  'Post Rock / Post Metal',
  'Progressive Rock',
  'Psychedelic Rock',
  'Punk',
  'Shoegaze',
  'Sludge Metal',
  'Stoner Rock',
] as const;
