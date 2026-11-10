import { z } from 'zod';
import { slugPatternSource, youtubeVideoIdPatternSource } from './validation';

declare const moneyBrand: unique symbol;
declare const dateBrand: unique symbol;
declare const timeBrand: unique symbol;
declare const durationBrand: unique symbol;
declare const urlBrand: unique symbol;
declare const providerBrand: unique symbol;
declare const youtubeBrand: unique symbol;
declare const slugBrand: unique symbol;

export type Money = number & { readonly [moneyBrand]: true };
export type IsoDate = string & { readonly [dateBrand]: true };
export type TimeOfDay = string & { readonly [timeBrand]: true };
export type DurationSeconds = number & { readonly [durationBrand]: true };
export type HttpsUrl = string & { readonly [urlBrand]: true };
export type YoutubeVideoId = string & { readonly [youtubeBrand]: true };
export type Slug = string & { readonly [slugBrand]: true };

export const moneySchema = z
  .number()
  .int()
  .positive()
  .transform((value) => value as Money);

export function parseEuroAmount(text: string): { ok: true; value: Money } | { ok: false; message: string } {
  const value = text.trim().replace(/^€\s*/, '');
  if (value.length > 32) return { ok: false, message: 'Enter an amount in euros, such as 12 or 12.50.' };
  const match = /^(-?)(\d+)(?:[.,](\d+))?$/.exec(value);
  if (!match) return { ok: false, message: 'Enter an amount in euros, such as 12 or 12.50.' };
  if ((match[3]?.length ?? 0) > 2) return { ok: false, message: 'Use at most two decimals.' };
  const cents = BigInt(match[2]!) * 100n + BigInt((match[3] ?? '').padEnd(2, '0'));
  if (match[1] || cents === 0n) return { ok: false, message: 'Enter an amount above €0.' };
  if (cents > BigInt(Number.MAX_SAFE_INTEGER))
    return { ok: false, message: 'Enter an amount in euros, such as 12 or 12.50.' };
  return { ok: true, value: Number(cents) as Money };
}

export function formatEuro(cents: number): string {
  const euros = Math.floor(cents / 100);
  const remainder = cents % 100;
  return `€${euros}${remainder ? `.${String(remainder).padStart(2, '0')}` : ''}`;
}

export function parseIsoDate(input: unknown): IsoDate | null {
  return typeof input === 'string' && z.iso.date().safeParse(input).success ? (input as IsoDate) : null;
}

export function formatDayDate(date: IsoDate): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]} ${date.slice(8, 10)} ${months[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
}

export function parseTimeOfDay(input: unknown): TimeOfDay | null {
  return typeof input === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(input) ? (input as TimeOfDay) : null;
}
export function timeOfDayFromParts(hour: number, minute: number): TimeOfDay | null {
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59)
    return null;
  return parseTimeOfDay(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
}
export function timeOfDayParts(time: TimeOfDay): { hour: number; minute: number } {
  return { hour: Number(time.slice(0, 2)), minute: Number(time.slice(3, 5)) };
}
export const timeOfDaySchema = z
  .string()
  .refine((value) => parseTimeOfDay(value) !== null, 'Use a 24-hour time, HH:MM.')
  .transform((value) => parseTimeOfDay(value)!);

export function durationFromParts(minutes: number, seconds: number): DurationSeconds | null {
  const value = minutes * 60 + seconds;
  return Number.isSafeInteger(minutes) &&
    minutes >= 0 &&
    Number.isInteger(seconds) &&
    seconds >= 0 &&
    seconds < 60 &&
    Number.isSafeInteger(value)
    ? (value as DurationSeconds)
    : null;
}
export function durationParts(duration: DurationSeconds): { minutes: number; seconds: number } {
  return { minutes: Math.floor(duration / 60), seconds: duration % 60 };
}
export function formatDuration(duration: DurationSeconds): string {
  const { minutes, seconds } = durationParts(duration);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
export function parseDuration(text: string): DurationSeconds | null {
  const match = /^(\d+):([0-5]\d)$/.exec(text);
  return match ? durationFromParts(Number(match[1]), Number(match[2])) : null;
}

export function parseHttpsUrl(input: unknown): HttpsUrl | null {
  if (typeof input !== 'string' || !/^https:\/\/\S+$/i.test(input)) return null;
  try {
    const url = new URL(input);
    return url.protocol === 'https:' && !url.username && !url.password ? (url.href as HttpsUrl) : null;
  } catch {
    return null;
  }
}

export const LINK_SERVICES = {
  facebook: { label: 'Facebook', hosts: ['facebook.com'], pathHint: 'events/' },
  instagram: { label: 'Instagram', hosts: ['instagram.com'] },
  youtube: { label: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
  bandcamp: { label: 'Bandcamp', hosts: ['bandcamp.com'] },
  tidal: { label: 'Tidal', hosts: ['tidal.com'] },
  spotify: { label: 'Spotify', hosts: ['spotify.com', 'spotify.link'] },
  soundcloud: { label: 'SoundCloud', hosts: ['soundcloud.com'] },
  'apple-music': { label: 'Apple Music', hosts: ['music.apple.com'] },
  'more-com': { label: 'More.com', hosts: ['more.com'] },
  generic: { label: 'Website', hosts: [] },
} as const;
export type LinkService = keyof typeof LINK_SERVICES;
export type ProviderUrl<Service extends LinkService> = HttpsUrl & { readonly [providerBrand]: Service };

function hostMatches(host: string, allowed: readonly string[]): boolean {
  return allowed.some((name) => host === name || host.endsWith(`.${name}`));
}
export function parseServiceUrl<Service extends LinkService>(
  service: Service,
  input: string,
): { ok: true; value: ProviderUrl<Service>; label: string } | { ok: false; message: string };
export function parseServiceUrl(
  service: LinkService,
  input: string,
): { ok: true; value: HttpsUrl; label: string } | { ok: false; message: string };
export function parseServiceUrl(
  service: LinkService,
  input: string,
): { ok: true; value: HttpsUrl; label: string } | { ok: false; message: string } {
  const entry = LINK_SERVICES[service];
  const text = input.trim();
  const value = parseHttpsUrl(/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(text) ? text : `https://${text}`);
  const url = value ? new URL(value) : null;
  const valid =
    url &&
    (service === 'generic' || hostMatches(url.hostname, entry.hosts)) &&
    (service !== 'facebook' || /^\/events\/[^/]+/.test(url.pathname));
  if (!valid || !value)
    return {
      ok: false,
      message: service === 'facebook' ? 'Paste a facebook.com event address.' : `Paste a ${entry.label} address.`,
    };
  return { ok: true, value, label: entry.label };
}
export function recognizeService(input: string): { id: LinkService; label: string } | null {
  const value = parseHttpsUrl(input);
  if (!value) return null;
  const host = new URL(value).hostname;
  for (const [id, entry] of Object.entries(LINK_SERVICES))
    if (hostMatches(host, entry.hosts)) return { id: id as LinkService, label: entry.label };
  return null;
}

export function parseYoutubeVideoId(input: unknown): YoutubeVideoId | null {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  const pattern = new RegExp(youtubeVideoIdPatternSource);
  if (pattern.test(text)) return text as YoutubeVideoId;
  const value = parseHttpsUrl(/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(text) ? text : `https://${text}`);
  if (!value) return null;
  const url = new URL(value);
  let id: string | null = null;
  if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') id = url.pathname.slice(1);
  else if (hostMatches(url.hostname, ['youtube.com'])) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = /^\/(?:shorts|embed)\/([^/]+)\/?$/.exec(url.pathname)?.[1] ?? null;
  }
  return id && pattern.test(id) ? (id as YoutubeVideoId) : null;
}

export function parseSlug(input: unknown): Slug | null {
  return typeof input === 'string' && new RegExp(slugPatternSource).test(input) ? (input as Slug) : null;
}
export function slugify(title: string): Slug {
  const greek: Record<string, string> = {
    α: 'a',
    β: 'v',
    γ: 'g',
    δ: 'd',
    ε: 'e',
    ζ: 'z',
    η: 'i',
    θ: 'th',
    ι: 'i',
    κ: 'k',
    λ: 'l',
    μ: 'm',
    ν: 'n',
    ξ: 'x',
    ο: 'o',
    π: 'p',
    ρ: 'r',
    σ: 's',
    ς: 's',
    τ: 't',
    υ: 'y',
    φ: 'f',
    χ: 'ch',
    ψ: 'ps',
    ω: 'o',
  };
  const value = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[α-ω]/g, (letter) => greek[letter] ?? letter)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (value || 'item') as Slug;
}
