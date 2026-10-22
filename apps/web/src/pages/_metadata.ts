export function createMusicPageMetadata({
  title,
  artist,
  format,
  summary,
  intent,
}: {
  title: string;
  artist: string;
  format?: string | null | undefined;
  summary?: string | null | undefined;
  intent: 'store' | 'release';
}) {
  const identity = `${artist} — ${title}${format ? ` (${format})` : ''}`;
  const paragraph = summary
    ?.trim()
    .split(/\r?\n\s*\r?\n/)[0]
    ?.replace(/\s+/g, ' ');
  const opening = paragraph
    ? [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(paragraph)][0]?.segment.trim()
    : '';
  // Credit-only summaries stay in the page body; use the factual identity when no editorial opening exists.
  const editorial =
    /^(?:BBR\s*#|credits?\b|released\b|all (?:music|lyrics)\b|recorded\b|mixed\b|mastered\b|artwork\b)/i.test(
      opening || '',
    )
      ? ''
      : opening;
  return {
    title: intent === 'store' ? `${identity} | Store` : identity,
    description:
      intent === 'store'
        ? `Shop ${identity} at BlackBox Records. ${editorial || "View this edition's price, availability and purchase details."}`
        : `${identity}. ${editorial || 'Explore release information and artist details on BlackBox Records.'}`,
  };
}
