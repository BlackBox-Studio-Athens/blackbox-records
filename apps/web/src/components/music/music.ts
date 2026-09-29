import { buildBandcampPlayerProvider, buildTidalPlayerProvider, type PlayerProvider } from '@blackbox/content-model';

type ReleaseLike = {
  bandcamp_embed_url?: string | undefined;
  tidal_url?: string | undefined;
};

export type EmbeddedPlayerData = {
  providers: [PlayerProvider, ...PlayerProvider[]];
  releaseId: string;
  title: string;
};

export function buildEmbeddedPlayerData(
  releaseId: string,
  release: ReleaseLike,
  title: string,
): EmbeddedPlayerData | null {
  const normalizedReleaseId = releaseId.trim();
  const normalizedTitle = title.trim();
  const providers = [
    buildBandcampPlayerProvider(release.bandcamp_embed_url),
    buildTidalPlayerProvider(release.tidal_url),
  ].filter((provider): provider is PlayerProvider => provider !== null);

  if (!normalizedReleaseId || !normalizedTitle || !providers[0]) return null;

  return {
    providers: providers as [PlayerProvider, ...PlayerProvider[]],
    releaseId: normalizedReleaseId,
    title: normalizedTitle,
  };
}
