import type { ActivePlayerSession } from './player-iframe-session';
import { selectDefaultPlayerProvider, type PlayerProvider, type PlayerProviderId } from './player-provider-data';

export type PlayerModalOpenRequest =
  | {
      kind: 'new-provider';
      nextProvider: PlayerProvider;
      shouldStopActiveSession: boolean;
    }
  | {
      activeSession: ActivePlayerSession;
      kind: 'reuse-active-session';
    }
  | {
      kind: 'without-provider';
    };

export function resolvePlayerModalOpenRequest({
  activeSession,
  cachedProviderId,
  providers,
  releaseTitle,
}: {
  activeSession: ActivePlayerSession | null;
  cachedProviderId?: PlayerProviderId | undefined;
  providers: PlayerProvider[];
  releaseTitle: string;
}): PlayerModalOpenRequest {
  if (providers.length === 0) return { kind: 'without-provider' };

  const isSameRelease = Boolean(activeSession && activeSession.releaseTitle === releaseTitle);
  if (activeSession && isSameRelease) return { activeSession, kind: 'reuse-active-session' };

  const cachedProvider = providers.find((provider) => provider.id === cachedProviderId);
  const nextProvider = cachedProvider || selectDefaultPlayerProvider(providers);
  if (!nextProvider) return { kind: 'without-provider' };

  return {
    kind: 'new-provider',
    nextProvider,
    shouldStopActiveSession: Boolean(activeSession),
  };
}
