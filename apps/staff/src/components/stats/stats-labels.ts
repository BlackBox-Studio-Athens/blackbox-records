// Member-facing names for provider dimension values. Derived from the value only; no extra reads.

export type PageKind =
  'home' | 'store' | 'release' | 'artists' | 'artist' | 'news' | 'services' | 'about' | 'legal' | 'other';
export type SourceKind =
  'direct' | 'instagram' | 'facebook' | 'google' | 'bandcamp' | 'linktree' | 'youtube' | 'bing' | 'duckduckgo' | 'site';
export type DeviceKind = 'phone' | 'desktop' | 'tablet' | 'other';
type Counts = { visits: number; pageViews: number };

const upperWords = new Set(['lp', 'ep', 'cd', 'mc', 'dvd', 'uk', 'usa', 'dj']);
const humanize = (slug: string) => {
  const words = decodeURIComponent(slug)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => (upperWords.has(word.toLowerCase()) ? word.toUpperCase() : word.toLowerCase()));
  const text = words.join(' ');
  return text ? text[0]!.toUpperCase() + text.slice(1) : slug;
};

const sections: Record<string, { name: string; kind: PageKind }> = {
  store: { name: 'Store', kind: 'store' },
  shop: { name: 'Store', kind: 'store' },
  releases: { name: 'Releases', kind: 'release' },
  artists: { name: 'Artists', kind: 'artists' },
  news: { name: 'News', kind: 'news' },
  services: { name: 'Services', kind: 'services' },
  about: { name: 'About', kind: 'about' },
  distro: { name: 'Distro', kind: 'store' },
  privacy: { name: 'Privacy', kind: 'legal' },
  terms: { name: 'Terms', kind: 'legal' },
  withdrawal: { name: 'Withdrawal', kind: 'legal' },
};
const storeSections: Record<string, string> = {
  'blackbox-releases': 'BlackBox Releases',
  distro: 'Distro',
  merch: 'Merch',
  checkout: 'Checkout',
};
const detailType: Partial<Record<PageKind, { label: string; kind: PageKind }>> = {
  store: { label: 'Store', kind: 'store' },
  release: { label: 'Release', kind: 'release' },
  artists: { label: 'Artist', kind: 'artist' },
  news: { label: 'News', kind: 'news' },
};

export function pageLabel(path: string): { name: string; kind: PageKind } {
  const parts = path.split(/[?#]/, 1)[0]!.split('/').filter(Boolean);
  if (!parts.length) return { name: 'Home', kind: 'home' };
  try {
    const section = sections[parts[0]!];
    if (!section) return { name: path, kind: 'other' };
    if (parts.length === 1) return section;
    if (section.kind === 'store' && parts[0] === 'store' && storeSections[parts[1]!]) {
      return { name: parts.length === 2 ? storeSections[parts[1]!]! : path, kind: 'store' };
    }
    const detail = detailType[section.kind];
    if (detail && parts.length === 2) return { name: `${humanize(parts[1]!)} · ${detail.label}`, kind: detail.kind };
  } catch {
    // A malformed escape falls back to the raw path below.
  }
  return { name: path, kind: 'other' };
}

const sourceNames: Record<Exclude<SourceKind, 'site'>, string> = {
  direct: 'Direct or unknown',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  bandcamp: 'Bandcamp',
  linktree: 'Linktree',
  youtube: 'YouTube',
  bing: 'Bing',
  duckduckgo: 'DuckDuckGo',
};
const within = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

export function sourceLabel(host: string): { key: string; name: string; kind: SourceKind } {
  const clean = host
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');
  const kind: SourceKind = !clean
    ? 'direct'
    : within(clean, 'instagram.com')
      ? 'instagram'
      : within(clean, 'facebook.com')
        ? 'facebook'
        : /^(?:[a-z0-9-]+\.)*google\.[a-z.]+$/.test(clean)
          ? 'google'
          : within(clean, 'bandcamp.com')
            ? 'bandcamp'
            : within(clean, 'linktr.ee')
              ? 'linktree'
              : within(clean, 'youtube.com') || clean === 'youtu.be'
                ? 'youtube'
                : within(clean, 'bing.com')
                  ? 'bing'
                  : within(clean, 'duckduckgo.com')
                    ? 'duckduckgo'
                    : 'site';
  return kind === 'site' ? { key: `site:${clean}`, name: clean, kind } : { key: kind, name: sourceNames[kind], kind };
}

/** Merges host variants into one source, sums their counts, and orders by visits. */
export function mergeSources<T extends Counts & { host: string }>(rows: T[]) {
  const merged = new Map<string, ReturnType<typeof sourceLabel> & Counts & { hosts: string[] }>();
  for (const row of rows) {
    const label = sourceLabel(row.host);
    const entry = merged.get(label.key) ?? { ...label, visits: 0, pageViews: 0, hosts: [] };
    entry.visits += row.visits;
    entry.pageViews += row.pageViews;
    entry.hosts.push(row.host || 'no referring site');
    merged.set(label.key, entry);
  }
  return byVisits([...merged.values()]);
}

export const byVisits = <T extends Counts>(rows: T[]) =>
  [...rows].sort((a, b) => b.visits - a.visits || b.pageViews - a.pageViews);

export function deviceKind(value: string): DeviceKind {
  const clean = value.trim().toLowerCase();
  return clean === 'mobile' || clean === 'smartphone'
    ? 'phone'
    : clean === 'desktop' || clean === 'tablet'
      ? (clean as DeviceKind)
      : 'other';
}
export const deviceNames: Record<DeviceKind, { label: string; plural: string; short: string }> = {
  phone: { label: 'Phone', plural: 'phones', short: 'phones' },
  desktop: { label: 'Desktop', plural: 'desktop computers', short: 'desktop' },
  tablet: { label: 'Tablet', plural: 'tablets', short: 'tablets' },
  other: { label: 'Other', plural: 'other devices', short: 'other' },
};

/** Groups provider device types into phone, desktop, tablet and other, ordered by visits. */
export function mergeDevices<T extends Counts & { deviceType: string }>(rows: T[]) {
  const merged = new Map<DeviceKind, Counts & { kind: DeviceKind }>();
  for (const row of rows) {
    const kind = deviceKind(row.deviceType);
    const entry = merged.get(kind) ?? { kind, visits: 0, pageViews: 0 };
    entry.visits += row.visits;
    entry.pageViews += row.pageViews;
    merged.set(kind, entry);
  }
  return byVisits([...merged.values()]).filter((row) => row.visits > 0);
}
