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
      appendHeadLink(targetDocument, 'preconnect', origin, true);
      appendHeadLink(targetDocument, 'dns-prefetch', origin, false);
      warmedOrigins.add(origin);
    });
}

function appendHeadLink(targetDocument: HeadLinkDocument, rel: string, href: string, useCrossOrigin: boolean) {
  if (!targetDocument.head || targetDocument.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;

  const linkElement = targetDocument.createElement('link');
  linkElement.rel = rel;
  linkElement.href = href;
  if (useCrossOrigin) {
    linkElement.crossOrigin = 'anonymous';
  }
  targetDocument.head.appendChild(linkElement);
}
