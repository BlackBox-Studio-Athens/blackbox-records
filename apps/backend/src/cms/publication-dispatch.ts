import {
  acknowledgePublicationDispatch,
  claimPublicationDispatch,
  claimPublicationReconciliation,
  failPublicationRun,
} from './publication-journal';
import { handlePublicationWorkflow } from './publication-routes';

export async function reconcilePendingPublication(
  context: Parameters<typeof handlePublicationWorkflow>[1] & { githubToken: string | undefined },
  send: typeof fetch = fetch,
  now = Date.now(),
) {
  const environment = context.environment;
  if (environment !== 'uat' && environment !== 'prd') return { status: 'disabled' as const };
  if (!context.githubToken || !context.token || !context.hostname) return { status: 'disabled' as const };
  const item = await claimPublicationReconciliation(context.db, environment, now);
  if (!item) return { status: 'idle' as const };
  if (item.deploymentId && item.codeSha && item.snapshotSha256) {
    const response = await handlePublicationWorkflow(
      new Request(`https://${context.hostname}/_emdash/api/blackbox/publications/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${context.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          ciRunId: item.ciRunId,
          codeSha: item.codeSha,
          snapshotSha256: item.snapshotSha256,
          deploymentId: item.deploymentId,
        }),
      }),
      context,
      send,
    );
    await response.body?.cancel();
    if (response.status === 409) await failPublicationRun(context.db, environment, item.id, item.ciRunId!);
    return { id: item.id, status: response.status === 200 ? 'live' : response.status === 409 ? 'failed' : 'pending' };
  }
  const response = await send(
    `https://api.github.com/repos/BlackBox-Studio-Athens/blackbox-records/actions/runs/${item.ciRunId}`,
    {
      headers: {
        Authorization: `Bearer ${context.githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'BlackBox-Content-Publication',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (response.status !== 200) {
    await response.body?.cancel();
    return { id: item.id, status: 'pending' };
  }
  const run = (await response.json()) as { id?: number; status?: string; path?: string; head_branch?: string };
  if (
    String(run.id) !== item.ciRunId ||
    run.path !== '.github/workflows/content-publication.yml' ||
    run.head_branch !== 'main'
  )
    throw new Error('Publication run identity mismatch');
  if (run.status === 'completed') {
    await failPublicationRun(context.db, environment, item.id, item.ciRunId!);
    return { id: item.id, status: 'failed' };
  }
  return { id: item.id, status: 'pending' };
}

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
