import { acknowledgePublicationDispatch, claimPublicationDispatch } from './publication-journal';

export async function dispatchPendingPublication(
  db: D1Database,
  environment: string | undefined,
  token: string | undefined,
  send: typeof fetch = fetch,
  now = Date.now(),
) {
  if (!token || environment === 'local') return { status: 'disabled' as const };
  if ((environment !== 'uat' && environment !== 'prd') || !/^[\x21-\x7e]{20,1024}$/.test(token))
    throw new Error('Invalid publication dispatch configuration');
  const claim = await claimPublicationDispatch(db, environment, now);
  if (!claim) return { status: 'idle' as const };
  let accepted = false;
  try {
    const response = await send(
      new Request(
        'https://api.github.com/repos/BlackBox-Studio-Athens/blackbox-records/actions/workflows/content-publication.yml/dispatches',
        {
          method: 'POST',
          redirect: 'manual',
          signal: AbortSignal.timeout(30_000),
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'BlackBox-Content-Publication',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            ref: 'main',
            return_run_details: false,
            inputs: { target: claim.environment, publication_id: claim.id, dispatch_token: claim.dispatchToken },
          }),
        },
      ),
    );
    accepted = response.status === 204;
    await response.body?.cancel();
  } catch {
    // Unknown provider outcome is retryable; never expose provider bodies or credentials.
  }
  if (accepted) await acknowledgePublicationDispatch(db, claim, now);
  return { id: claim.id, status: accepted ? ('dispatched' as const) : ('pending' as const) };
}
