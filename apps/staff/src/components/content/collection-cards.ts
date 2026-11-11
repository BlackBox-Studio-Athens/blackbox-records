import { formatArtistCountries, formatDayDate, parseIsoDate, type Tracklist } from '@blackbox/content-model';
import type { ContentData } from '../../lib/content-sections';

type CardConfig<Id extends string> = readonly { id: Id; title: string; paths: readonly string[] }[];

export type ReleaseCardId =
  'basics' | 'artwork' | 'formats' | 'listening' | 'tracklist' | 'credits' | 'text' | 'home' | 'safety';

/** The Release editor's cards, in order, with the stored paths each one edits. */
export const releaseCards: CardConfig<ReleaseCardId> = [
  { id: 'basics', title: 'Basics', paths: ['title', 'artist', 'catalog_number', 'release_stage', 'release_date'] },
  { id: 'artwork', title: 'Artwork & photos', paths: ['cover_image', 'cover_image_alt', 'gallery'] },
  { id: 'formats', title: 'Formats', paths: ['formats', 'product_condition'] },
  {
    id: 'listening',
    title: 'Listening',
    paths: ['bandcamp_embed_url', 'tidal_url', 'singles', 'clips', 'partner_links', 'merch_url'],
  },
  { id: 'tracklist', title: 'Tracklist', paths: ['tracklist'] },
  { id: 'credits', title: 'Credits', paths: ['credits'] },
  { id: 'text', title: 'Text', paths: ['summary', 'body'] },
  { id: 'home', title: 'Home & ordering', paths: ['show_on_home', 'releases_priority'] },
  { id: 'safety', title: 'Product safety', paths: ['product_safety'] },
];

export type DistroCardId = 'basics' | 'image' | 'listening' | 'tracklist' | 'text' | 'display' | 'safety';

export const distroCards: CardConfig<DistroCardId> = [
  { id: 'basics', title: 'Basics', paths: ['title', 'artist_or_label', 'format', 'product_condition'] },
  { id: 'image', title: 'Image & photos', paths: ['image', 'image_alt', 'gallery'] },
  { id: 'listening', title: 'Listening', paths: ['bandcamp_embed_url', 'tidal_url'] },
  { id: 'tracklist', title: 'Tracklist', paths: ['tracklist'] },
  { id: 'text', title: 'Text', paths: ['summary'] },
  { id: 'display', title: 'Display', paths: ['eyebrow', 'format_override', 'release_date', 'order'] },
  { id: 'safety', title: 'Product safety', paths: ['product_safety'] },
];

export type ArtistCardId = 'basics' | 'photo' | 'links' | 'videos' | 'story';

export const artistCards: CardConfig<ArtistCardId> = [
  { id: 'basics', title: 'Basics', paths: ['title', 'is_active', 'genre', 'country'] },
  { id: 'photo', title: 'Photo', paths: ['image', 'image_alt'] },
  { id: 'links', title: 'Links', paths: ['profile_links'] },
  { id: 'videos', title: 'Videos', paths: ['videos'] },
  { id: 'story', title: 'Story', paths: ['bio', 'body'] },
];

export type NewsCardId = 'basics' | 'image' | 'text';

export const newsCards: CardConfig<NewsCardId> = [
  { id: 'basics', title: 'Basics', paths: ['title', 'artist', 'date', 'section_label'] },
  { id: 'image', title: 'Image', paths: ['image', 'image_alt'] },
  { id: 'text', title: 'Text', paths: ['summary', 'body'] },
];

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const list = (value: unknown) => (Array.isArray(value) ? value : []);
const count = (amount: number, one: string, many = `${one}s`) => `${amount} ${amount === 1 ? one : many}`;
const hasImage = (value: unknown) => !!(value as { id?: string } | null | undefined)?.id;
const truthy = (value: unknown) => value === true || value === 1;
const hasBody = (value: unknown) => list(value).length > 0;

// Distro tracklists store sides or discs without a format, so count by shape.
function trackCount(tracklist: unknown) {
  if (!tracklist || typeof tracklist !== 'object') return 0;
  const groups = list((tracklist as { discs?: unknown }).discs ?? (tracklist as { sides?: unknown }).sides);
  return groups.reduce((total: number, group) => total + list((group as { tracks?: unknown }).tracks).length, 0);
}

/** Product safety reads as verified, started or not started; the card body lists what is missing. */
export function safetySummary(value: unknown) {
  const safety = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  if (safety.review_status === 'verified') return 'Verified';
  return Object.keys(safety).length ? 'Not verified yet' : 'Not started';
}

function imageSummary(image: unknown, alt: unknown, photos = 0) {
  if (!hasImage(image)) return 'Image missing';
  const parts = [text(alt) ? 'Image with description' : 'Description missing'];
  if (photos) parts.push(count(photos, 'photo'));
  return parts.join(' · ');
}

function textSummary(data: ContentData) {
  const parts = [text(data.summary) ? 'Short description' : '', hasBody(data.body) ? 'full text' : ''].filter(Boolean);
  return parts.length ? parts.join(' + ') : 'No text yet';
}

/** One plain-language line per Release card, read from the stored values. */
export function releaseCardSummaries(
  data: ContentData,
  artistNames: ReadonlyMap<string, string> = new Map(),
): Record<ReleaseCardId, string> {
  const date = parseIsoDate(data.release_date);
  const upcoming = data.release_stage === 'upcoming';
  const formats = list(data.formats).map(text).filter(Boolean);
  const condition = data.product_condition === 'used' ? 'used' : data.product_condition === 'new' ? 'new' : '';
  const listening = [
    text(data.bandcamp_embed_url) ? 'Bandcamp' : '',
    text(data.tidal_url) ? 'Tidal' : '',
    list(data.singles).length ? count(list(data.singles).length, 'single') : '',
    list(data.clips).length ? count(list(data.clips).length, 'clip') : '',
    list(data.partner_links).length ? count(list(data.partner_links).length, 'store link') : '',
    text(data.merch_url) ? 'merch' : '',
  ].filter(Boolean);
  const tracks = trackCount(data.tracklist);
  const credits = list(data.credits).length;
  const priority = typeof data.releases_priority === 'number' ? data.releases_priority : null;
  const artist = artistNames.get(text(data.artist));
  return {
    basics: text(data.title)
      ? [
          text(data.title),
          artist,
          text(data.catalog_number),
          upcoming ? 'Upcoming' : date ? formatDayDate(date) : 'release date missing',
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Title missing',
    artwork: hasImage(data.cover_image)
      ? imageSummary(data.cover_image, data.cover_image_alt, list(data.gallery).length).replace('Image', 'Cover')
      : 'Cover missing',
    formats: formats.length ? [formats.join(', '), condition].filter(Boolean).join(' · ') : 'No formats yet',
    listening: listening.length ? listening.join(', ') : 'No listening links',
    tracklist: tracks
      ? `${(data.tracklist as Tracklist).format === 'cd' ? 'CD' : (data.tracklist as Tracklist).format === 'vinyl' ? 'Vinyl' : 'Cassette'} · ${count(tracks, 'track')}`
      : 'No tracklist',
    credits: credits ? count(credits, 'credit') : 'No credits',
    text: textSummary(data),
    home: [
      truthy(data.show_on_home) ? 'On Home' : 'Not on Home',
      priority === null ? 'automatic order' : `order ${priority}`,
    ].join(' · '),
    safety: safetySummary(data.product_safety),
  };
}

export function distroCardSummaries(data: ContentData): Record<DistroCardId, string> {
  const tracks = trackCount(data.tracklist);
  const condition = data.product_condition === 'used' ? 'used' : data.product_condition === 'new' ? 'new' : '';
  const date = parseIsoDate(data.release_date);
  return {
    basics: text(data.title)
      ? [text(data.title), text(data.artist_or_label), text(data.format), condition].filter(Boolean).join(' · ')
      : 'Title missing',
    image: imageSummary(data.image, data.image_alt, list(data.gallery).length),
    listening:
      [text(data.bandcamp_embed_url) ? 'Bandcamp' : '', text(data.tidal_url) ? 'Tidal' : '']
        .filter(Boolean)
        .join(', ') || 'No listening links',
    tracklist: tracks ? count(tracks, 'track') : 'No tracklist',
    text: text(data.summary) ? 'Short description' : 'Description missing',
    display:
      [
        text(data.eyebrow),
        text(data.format_override),
        date ? formatDayDate(date) : '',
        typeof data.order === 'number' ? `order ${data.order}` : '',
      ]
        .filter(Boolean)
        .join(' · ') || 'Defaults',
    safety: safetySummary(data.product_safety),
  };
}

export function artistCardSummaries(data: ContentData): Record<ArtistCardId, string> {
  const links = list(data.profile_links)
    .map((link) => text((link as ContentData).label))
    .filter(Boolean);
  const videos = list(data.videos).length;
  const country = Array.isArray(data.country) ? formatArtistCountries(data.country) : text(data.country);
  return {
    basics: text(data.title)
      ? [
          text(data.title),
          text(data.genre),
          country,
          data.is_active === false || data.is_active === 0 ? 'inactive' : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Name missing',
    photo: imageSummary(data.image, data.image_alt),
    links: links.length ? links.join(', ') : 'No links',
    videos: videos ? count(videos, 'video') : 'No videos',
    story:
      [text(data.bio) ? 'Short biography' : '', hasBody(data.body) ? 'full text' : ''].filter(Boolean).join(' + ') ||
      'No story yet',
  };
}

export function newsCardSummaries(
  data: ContentData,
  artistNames: ReadonlyMap<string, string> = new Map(),
): Record<NewsCardId, string> {
  const date = parseIsoDate(data.date);
  const artist = artistNames.get(text(data.artist));
  return {
    basics: text(data.title)
      ? [text(data.title), date ? formatDayDate(date) : 'date missing', artist, text(data.section_label)]
          .filter(Boolean)
          .join(' · ')
      : 'Title missing',
    image: imageSummary(data.image, data.image_alt),
    text: textSummary(data),
  };
}

const at = (data: ContentData, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (current, key) => (current && typeof current === 'object' ? (current as ContentData)[key] : undefined),
      data,
    );
/** The first filled text among the paths, shortened for a one-line summary. */
function firstText(data: ContentData, paths: readonly string[], empty: string) {
  for (const path of paths) {
    const value = text(at(data, path));
    if (value) return value.length > 60 ? `${value.slice(0, 57).trimEnd()}…` : value;
  }
  return empty;
}

export type WebsiteCard = { id: string; title: string; paths: readonly string[] };

/** Cards for the Website pages and settings, keyed by Content section. */
export const websiteCards = {
  home: [
    { id: 'opening', title: 'Opening', paths: ['hero.tagline', 'hero.image', 'hero.image_alt'] },
    {
      id: 'artists',
      title: 'Artist promotion',
      paths: ['artists.title', 'artists.button_text', 'artists.button_link'],
    },
    { id: 'news', title: 'News (hidden on the website)', paths: ['news.title', 'news.link_text', 'news.link_url'] },
  ],
  about: [
    {
      id: 'opening',
      title: 'Opening',
      paths: ['hero.section_label', 'hero.title', 'hero.image', 'hero.image_alt', 'lead.text'],
    },
    { id: 'story', title: 'Our story', paths: ['story.title', 'story.paragraphs'] },
    { id: 'quote', title: 'Quote', paths: ['quote'] },
    { id: 'contact', title: 'Contact', paths: ['contact.title', 'contact.intro', 'contact.items'] },
    { id: 'facts', title: 'Label facts', paths: ['stats.items'] },
  ],
  services: [
    { id: 'opening', title: 'Opening', paths: ['hero.title', 'hero.intro', 'hero.cta_text'] },
    { id: 'services', title: 'Services', paths: ['services.items'] },
    { id: 'process', title: 'How we work', paths: ['process.title', 'process.intro', 'process.steps'] },
    {
      id: 'inquiry',
      title: 'Contact form',
      paths: ['inquiry.title', 'inquiry.intro', 'inquiry.email', 'inquiry.submit_text'],
    },
  ],
  newsletter: [
    { id: 'text', title: 'Text', paths: ['section_label', 'title', 'description'] },
    { id: 'form', title: 'Sign-up form', paths: ['placeholder', 'button_label', 'note'] },
  ],
  settings: [
    { id: 'label', title: 'Label', paths: ['label_name', 'established_year', 'footer_text'] },
    { id: 'search', title: 'Search engines', paths: ['url', 'logo', 'location.locality', 'location.country'] },
  ],
  navigation: [
    { id: 'link', title: 'Link', paths: ['title', 'url'] },
    { id: 'placement', title: 'Where it shows', paths: ['show_in_header', 'show_in_footer'] },
  ],
  socials: [
    { id: 'platform', title: 'Platform', paths: ['title'] },
    { id: 'link', title: 'Link', paths: ['url', 'visible'] },
  ],
  distro_page: [
    { id: 'opening', title: 'Opening', paths: ['hero.title', 'hero.intro'] },
    { id: 'groups', title: 'Format introductions', paths: ['group_intros'] },
  ],
  purchase_information: [
    { id: 'approval', title: 'Approval', paths: ['publication', 'content.revision'] },
    { id: 'seller', title: 'Seller', paths: ['content.seller'] },
    { id: 'terms', title: 'Purchase terms', paths: ['content.terms'] },
    { id: 'privacy', title: 'Privacy', paths: ['content.privacy'] },
  ],
} as const satisfies Record<string, readonly WebsiteCard[]>;

export type WebsiteSection = keyof typeof websiteCards;

/** One plain-language line per Website card, read from the stored values. */
export function websiteCardSummaries(section: WebsiteSection, data: ContentData): Record<string, string> {
  const items = (path: string) => list(at(data, path));
  const on = (path: string) => truthy(at(data, path));
  switch (section) {
    case 'home':
      return {
        opening: firstText(data, ['hero.tagline'], 'Opening text missing'),
        artists: firstText(data, ['artists.title'], 'Heading missing'),
        news: firstText(data, ['news.title'], 'Not set'),
      };
    case 'about':
      return {
        opening: firstText(data, ['hero.title', 'lead.text'], 'Title missing'),
        story: items('story.paragraphs').length ? count(items('story.paragraphs').length, 'paragraph') : 'No story yet',
        quote: firstText(data, ['quote.cite', 'quote.text'], 'No quote'),
        contact: items('contact.items').length
          ? items('contact.items')
              .map((item) => text((item as ContentData).label))
              .filter(Boolean)
              .join(', ')
          : 'No contact details',
        facts: items('stats.items').length ? count(items('stats.items').length, 'fact') : 'No facts',
      };
    case 'services':
      return {
        opening: firstText(data, ['hero.title'], 'Title missing'),
        services: items('services.items').length
          ? items('services.items')
              .map((item) => text((item as ContentData).title))
              .filter(Boolean)
              .join(', ') || count(items('services.items').length, 'service')
          : 'No services yet',
        process: items('process.steps').length ? count(items('process.steps').length, 'step') : 'No steps yet',
        inquiry: firstText(data, ['inquiry.email'], 'Contact email missing'),
      };
    case 'newsletter':
      return {
        text: firstText(data, ['title', 'section_label'], 'Heading missing'),
        form: firstText(data, ['button_label'], 'Button text missing'),
      };
    case 'settings': {
      const year = at(data, 'established_year');
      return {
        label: [text(data.label_name) || 'Label name missing', year ? `since ${String(year)}` : '']
          .filter(Boolean)
          .join(' · '),
        search: firstText(data, ['url'], 'Website address missing'),
      };
    }
    case 'navigation': {
      const places = [on('show_in_header') ? 'main menu' : '', on('show_in_footer') ? 'bottom of the site' : ''].filter(
        Boolean,
      );
      return {
        link: text(data.title) ? `${text(data.title)} → ${text(data.url) || 'page not chosen'}` : 'Link text missing',
        placement: places.length ? `In the ${places.join(' and the ')}` : 'Hidden',
      };
    }
    case 'socials': {
      const hidden = data.visible === false || data.visible === 0 || data.url === '#';
      return {
        platform: text(data.title) || 'Platform not chosen',
        link: hidden ? 'Hidden on the website' : text(data.url) ? 'Shown on the website' : 'Profile link missing',
      };
    }
    case 'distro_page': {
      const intros = Object.values((at(data, 'group_intros') as ContentData | undefined) ?? {}).filter((value) =>
        text(value),
      );
      return {
        opening: firstText(data, ['hero.title'], 'Title missing'),
        groups: intros.length ? count(intros.length, 'introduction') : 'No introductions',
      };
    }
    case 'purchase_information': {
      const revision = parseIsoDate(at(data, 'content.revision'));
      return {
        approval: [
          data.publication === 'approved' ? 'Approved by the label' : 'Awaiting review',
          revision ? `wording of ${formatDayDate(revision)}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
        seller: firstText(data, ['content.seller.name'], 'Seller missing'),
        terms: 'Dispatch, delivery, returns and parcels',
        privacy: 'Purposes, recipients, retention, rights and contact',
      };
    }
  }
}
