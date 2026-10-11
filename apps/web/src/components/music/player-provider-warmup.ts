import type { PlayerProvider, PlayerProviderId } from './player-provider-data';

const EMBED_PROVIDER_WARMUP_ORIGINS: Record<PlayerProviderId, string[]> = {
  bandcamp: ['https://bandcamp.com'],
  tidal: ['https://embed.tidal.com', 'https://tidal.com'],
};

type HeadLinkDocument = Pick<Document, 'createElement'> & {
  head: Pick<HTMLHeadElement, 'appendChild' | 'querySelector'> | null;
};

export function warmPlayerProviderOrigins({
  providers,
  targetDocument = document,
  warmedOrigins,
}: {
  providers: PlayerProvider[];
  targetDocument?: HeadLinkDocument;
  warmedOrigins: Set<string>;
}) {
  providers
    .flatMap((provider) => EMBED_PROVIDER_WARMUP_ORIGINS[provider.id] || [])
    .forEach((origin) => {
      if (!origin || warmedOrigins.has(origin)) return;
      appendHeadLink(targetDocument, 'preconnect', origin);
      appendHeadLink(targetDocument, 'dns-prefetch', origin);
      warmedOrigins.add(origin);
    });
}

function appendHeadLink(targetDocument: HeadLinkDocument, rel: string, href: string) {
  if (!targetDocument.head || targetDocument.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;

  const linkElement = targetDocument.createElement('link');
  linkElement.rel = rel;
  linkElement.href = href;
  targetDocument.head.appendChild(linkElement);
}
