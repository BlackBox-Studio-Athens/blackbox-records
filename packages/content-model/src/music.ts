export type BandcampPlayerProvider = {
  embedLayout: 'bandcamp-album' | 'bandcamp-track';
  embedUrl: string;
  id: 'bandcamp';
};

export type TidalPlayerProvider = {
  embedLayout: 'tidal';
  embedUrl: string;
  id: 'tidal';
};

export type PlayerProvider = BandcampPlayerProvider | TidalPlayerProvider;
export type PlayerProviderId = PlayerProvider['id'];
export type PlayerEmbedLayout = PlayerProvider['embedLayout'];

const BANDCAMP_EMBED_ORIGIN = 'https://bandcamp.com';
const BANDCAMP_EMBED_OPTION_PATTERN =
  /^(?:size=(?:small|large)|bgcol=[\da-fA-F]{6}|linkcol=[\da-fA-F]{6}|artwork=(?:small|big|none)|tracklist=(?:true|false)|transparent=(?:true|false)|linkback=(?:true|false))$/;

export class BandcampPage {
  private constructor(private readonly value: Readonly<{ url: string; kind: 'album' | 'track' }>) {
    Object.freeze(this.value);
    Object.freeze(this);
  }

  get url() {
    return this.value.url;
  }
  get kind() {
    return this.value.kind;
  }

  static parse(input: string): BandcampPage | null {
    const url = parseUrl(input.trim());
    if (!url || url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.bandcamp\.com$/.test(url.hostname)) return null;
    const path = /^\/(album|track)\/([a-z0-9-]+)\/?$/.exec(url.pathname);
    if (!path) return null;
    const kind = path[1] === 'album' ? 'album' : 'track';
    return new BandcampPage({ url: `${url.origin}/${kind}/${path[2]}`, kind });
  }
}

export class BandcampRecording {
  private constructor(private readonly value: Readonly<{ kind: 'album' | 'track'; id: string }>) {
    Object.freeze(this.value);
    Object.freeze(this);
  }

  get kind() {
    return this.value.kind;
  }
  get id() {
    return this.value.id;
  }

  static parse(input: unknown): BandcampRecording | null {
    if (!input || typeof input !== 'object' || !('kind' in input) || !('id' in input)) return null;
    if (input.kind !== 'album' && input.kind !== 'track') return null;
    if (typeof input.id !== 'string' || !/^[1-9]\d{0,19}$/.test(input.id)) return null;
    return new BandcampRecording({ kind: input.kind, id: input.id });
  }

  static fromEmbed(input: string): BandcampRecording | null {
    const url = parseUrl(input);
    if (!url || url.origin !== BANDCAMP_EMBED_ORIGIN || url.username || url.password || url.search || url.hash)
      return null;
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.shift() !== 'EmbeddedPlayer') return null;
    if (segments[0] === 'v=2') segments.shift();
    let album: BandcampRecording | null = null;
    let track: BandcampRecording | null = null;
    for (const segment of segments) {
      const match = /^(album|track)=([1-9]\d{0,19})$/.exec(segment);
      if (match) {
        const recording = BandcampRecording.parse({ kind: match[1], id: match[2] });
        if (match[1] === 'album') {
          if (album) return null;
          album = recording;
        } else {
          if (track) return null;
          track = recording;
        }
      } else if (!BANDCAMP_EMBED_OPTION_PATTERN.test(segment)) return null;
    }
    return track ?? album;
  }

  get player(): BandcampPlayerProvider {
    const isTrack = this.kind === 'track';
    return {
      embedLayout: isTrack ? 'bandcamp-track' : 'bandcamp-album',
      embedUrl: `${BANDCAMP_EMBED_ORIGIN}/EmbeddedPlayer/${this.kind}=${this.id}/size=large/bgcol=0d0d0d/linkcol=f5f5f5/artwork=big/${isTrack ? 'tracklist=false/' : ''}transparent=true/`,
      id: 'bandcamp',
    };
  }

  toJSON() {
    return this.value;
  }
}
const TIDAL_PUBLIC_ORIGIN = 'https://tidal.com';
const TIDAL_EMBED_ORIGIN = 'https://embed.tidal.com';
const TIDAL_ID_PATTERN = /^[A-Za-z0-9-]+$/;
const TIDAL_EMBED_PATH_BY_ENTITY_TYPE = {
  album: 'albums',
  track: 'tracks',
  playlist: 'playlists',
  video: 'videos',
} as const;

export function buildBandcampPlayerProvider(bandcampEmbedUrl?: string): BandcampPlayerProvider | null {
  return BandcampRecording.fromEmbed(bandcampEmbedUrl ?? '')?.player ?? null;
}

export function buildBandcampEmbedUrl(bandcampEmbedUrl?: string) {
  return buildBandcampPlayerProvider(bandcampEmbedUrl)?.embedUrl || '';
}

export function buildTidalPlayerProvider(tidalUrl?: string): TidalPlayerProvider | null {
  const parsedUrl = parseUrl(tidalUrl);
  if (!parsedUrl || parsedUrl.origin !== TIDAL_PUBLIC_ORIGIN || parsedUrl.hash) return null;

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const entityTypeIndex = pathSegments[0] === 'browse' ? 1 : 0;
  if (pathSegments.length !== entityTypeIndex + 2) return null;

  const entityType = pathSegments[entityTypeIndex] as keyof typeof TIDAL_EMBED_PATH_BY_ENTITY_TYPE;
  const tidalId = pathSegments[entityTypeIndex + 1] || '';
  const tidalEmbedPath = TIDAL_EMBED_PATH_BY_ENTITY_TYPE[entityType];
  if (!tidalEmbedPath || !TIDAL_ID_PATTERN.test(tidalId)) return null;

  return {
    embedLayout: 'tidal',
    embedUrl: `${TIDAL_EMBED_ORIGIN}/${tidalEmbedPath}/${tidalId}?coverInitially=true&disableAnalytics=true`,
    id: 'tidal',
  };
}

export function buildTidalPlayerProviderFromEmbedUrl(tidalEmbedUrl?: string): TidalPlayerProvider | null {
  const parsedUrl = parseUrl(tidalEmbedUrl);
  if (!parsedUrl || parsedUrl.origin !== TIDAL_EMBED_ORIGIN || parsedUrl.hash) return null;

  const [embedPath = '', tidalId = '', ...remainingPath] = parsedUrl.pathname.split('/').filter(Boolean);
  if (remainingPath.length > 0 || !TIDAL_ID_PATTERN.test(tidalId)) return null;
  if (!Object.values(TIDAL_EMBED_PATH_BY_ENTITY_TYPE).includes(embedPath as 'albums')) return null;

  const canonicalUrl = `${TIDAL_EMBED_ORIGIN}/${embedPath}/${tidalId}?coverInitially=true&disableAnalytics=true`;
  if (parsedUrl.toString() !== canonicalUrl) return null;

  return { embedLayout: 'tidal', embedUrl: canonicalUrl, id: 'tidal' };
}

export function buildTidalEmbedUrl(tidalUrl?: string) {
  return buildTidalPlayerProvider(tidalUrl)?.embedUrl || '';
}

function parseUrl(value?: string) {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    return null;
  }
}
